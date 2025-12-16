import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PaperAirplaneIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FaqCategory {
  id: number;
  category: string;
  description: string;
  items: FaqItem[];
}

interface Message {
  role: 'BOT' | 'USER' | 'ADMIN' | 'SYS' | 'AI';
  text: string;
}

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10분
const MESSAGE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분마다 정리

const ChatBot: React.FC = () => {
  // HTTPS 환경에서는 localhost를 사용할 수 없으므로 상대 경로 또는 현재 origin 사용
  const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;

    // 환경 변수가 설정되어 있으면 사용
    if (envUrl) return envUrl;

    // HTTPS 페이지에서는 localhost를 사용할 수 없으므로 현재 origin 사용
    if (window.location.protocol === 'https:') {
      return window.location.origin;
    }

    // HTTP 개발 환경에서만 localhost 사용
    return 'http://localhost:8080';
  };

  const API_BASE_URL = getApiBaseUrl();

  // ✅ 사용자별 고유 roomId 생성
  const roomId = useMemo(() => {
    const userInfo = getUserInfo();
    const userId = userInfo.userId;

    if (userId) {
      // 로그인한 사용자: userId 기반 roomId
      return `user-${userId}-${crypto.randomUUID()}`;
    } else {
      // 비로그인 사용자: 세션별 고유 ID
      const stored = localStorage.getItem('chatbot-guest-roomId');
      if (stored) return stored;
      const newId = `guest-${crypto.randomUUID()}`;
      localStorage.setItem('chatbot-guest-roomId', newId);
      return newId;
    }
  }, []);

  const [input, setInput] = useState("");

  // ✅ 사용자별 대화 기록 저장
  const [messages, setMessages] = useState<Message[]>(() => {
    const userInfo = getUserInfo();
    const storageKey = userInfo.userId
      ? `chatbot-messages-user-${userInfo.userId}`
      : 'chatbot-messages-guest';

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getInitialMessages();
      }
    }
    return getInitialMessages();
  });

  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [isFaqVisible, setIsFaqVisible] = useState(() => {
    const stored = localStorage.getItem('chatbot-isFaqVisible');
    return stored !== 'false'; // 기본값 true (처음엔 무조건 보임)
  });
  const [isAgentConnected, setIsAgentConnected] = useState(() => {
    const userInfo = getUserInfo();
    const storageKey = userInfo.userId
      ? `chatbot-isAgentConnected-user-${userInfo.userId}`
      : 'chatbot-isAgentConnected-guest';
    const stored = localStorage.getItem(storageKey);
    return stored === 'true';
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Refs
  const stompRef = useRef<CompatClient | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessagesRef = useRef<Map<string, number>>(new Map());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userInfo = useRef(getUserInfo());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ localStorage 동기화 (사용자별)
  useEffect(() => {
    const userInfo = getUserInfo();
    const storageKey = userInfo.userId
      ? `chatbot-messages-user-${userInfo.userId}`
      : 'chatbot-messages-guest';
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const userInfo = getUserInfo();
    const storageKey = userInfo.userId
      ? `chatbot-isAgentConnected-user-${userInfo.userId}`
      : 'chatbot-isAgentConnected-guest';
    localStorage.setItem(storageKey, String(isAgentConnected));
  }, [isAgentConnected]);

  useEffect(() => {
    localStorage.setItem('chatbot-isFaqVisible', String(isFaqVisible));
  }, [isFaqVisible]);

  // FAQ 로드
  useEffect(() => {
    const controller = new AbortController();

    // ✅ FaqController의 실제 경로: /api/faq
    fetch(`${API_BASE_URL}/api/faq`, {
      signal: controller.signal
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFaqCategories(data);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("FAQ 로드 실패:", err);
        }
      });

    return () => controller.abort();
  }, [API_BASE_URL]);

  // 메시지 중복 체크 (시간 기반)
  const isMessageProcessed = useCallback((messageId: string): boolean => {
    const now = Date.now();
    const lastProcessed = processedMessagesRef.current.get(messageId);

    if (lastProcessed && now - lastProcessed < 5000) {
      return true;
    }

    processedMessagesRef.current.set(messageId, now);
    return false;
  }, []);

  // 오래된 메시지 ID 정리
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      processedMessagesRef.current.forEach((timestamp, key) => {
        if (now - timestamp > MESSAGE_CLEANUP_INTERVAL) {
          processedMessagesRef.current.delete(key);
        }
      });
    }, MESSAGE_CLEANUP_INTERVAL);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // 비활성 타이머 관리
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (isAgentConnected) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsAgentConnected(false);
        setMessages(prev => [...prev, {
          role: 'SYS',
          text: '10분간 활동이 없어 상담사 연결이 자동으로 해제되었습니다.'
        }]);

        if (stompRef.current?.connected) {
          stompRef.current.send(
            `/app/support.disconnect/${roomId}`,
            {},
            JSON.stringify({ userName: userInfo.current.name })
          );
        }
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAgentConnected, roomId]);

  // WebSocket 연결
  useEffect(() => {
    // SockJS는 http:// 또는 https:// URL을 받아서 자동으로 WebSocket으로 업그레이드합니다
    // ws:// 또는 wss:// URL을 직접 전달하면 안 됩니다!
    const wsUrl = API_BASE_URL ? `${API_BASE_URL}/ws` : '/ws';
    console.log('SockJS URL:', wsUrl);

    const sock = new SockJS(wsUrl);
    const client = Stomp.over(() => sock);
    client.debug = () => { };

    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    client.connect(
      headers,
      () => {
        stompRef.current = client;

        client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
          try {
            const body = JSON.parse(frame.body);

            const content = body.content || body.text;
            const role = body.role || 'BOT';

            if (!content) return;

            const messageId = `${body.type}-${role}-${content}-${Date.now()}`;

            if (isMessageProcessed(messageId)) return;

            handleWebSocketMessage({ ...body, text: content, role });
          } catch (error) {
            console.error("메시지 파싱 오류:", error);
          }
        });
      },
      (err) => console.error("STOMP error:", err)
    );

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      try {
        client.disconnect(() => { });
      } catch { }
    };
  }, [roomId, API_BASE_URL, isMessageProcessed]);

  // WebSocket 메시지 핸들러
  const handleWebSocketMessage = useCallback((body: any) => {
    console.log("📨 받은 메시지:", body);

    switch (body.type) {
      case "HANDOFF_REQUESTED":
        setMessages(prev => [...prev, {
          role: 'SYS',
          text: '상담사 연결을 요청했습니다. 잠시만 기다려주세요.'
        }]);
        break;

      case "HANDOFF_ACCEPTED":
        setIsAgentConnected(true);
        setMessages(prev => [...prev, {
          role: 'SYS',
          text: '상담사가 연결되었습니다.\n10분간 활동이 없으면 자동으로 연결이 해제됩니다.'
        }]);
        resetInactivityTimer();
        break;

      case "AGENT_DISCONNECTED":
        console.log("⚠️ 상담사 연결 해제 수신");
        setIsAgentConnected(false);
        setMessages(prev => [...prev, {
          role: 'SYS',
          text: body.text || '상담사가 연결을 해제했습니다.'
        }]);
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        break;

      case "USER_DISCONNECTED":
        console.log("ℹ️ 유저 연결 해제 확인 메시지 수신");
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        break;

      default:
        if (body.text) {
          const role = (body.role as 'BOT' | 'USER' | 'ADMIN' | 'SYS') ?? 'BOT';

          if (role === 'SYS') {
            setMessages(prev => [...prev, { role: 'SYS', text: body.text }]);
          } else {
            setMessages(prev => [...prev, { role, text: body.text }]);
          }

          if (role === 'ADMIN') {
            resetInactivityTimer();
          }
        }
    }
  }, [resetInactivityTimer]);

  // AI 챗봇에 질문하기
  const askAI = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setIsAiLoading(true);

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'USER', text: question }]);

    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // 토큰이 있으면 추가
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: question,
          userId: userInfo.current.userId || 'guest',
          sessionId: roomId
        })
      });

      if (!response.ok) {
        console.error('AI 응답 상태 코드:', response.status);
        const errorText = await response.text();
        console.error('AI 응답 에러 내용:', errorText);
        throw new Error(`AI 응답 실패: ${response.status}`);
      }

      const data = await response.json();

      // AI 응답 추가
      setMessages(prev => [...prev, {
        role: 'AI',
        text: data.answer || '답변을 생성할 수 없습니다.'
      }]);

    } catch (error) {
      console.error('AI 질문 오류:', error);
      setMessages(prev => [...prev, {
        role: 'SYS',
        text: 'AI 응답을 가져오는 중 오류가 발생했습니다.\nSpring 서버와 FastAPI 서버가 모두 실행 중인지 확인해주세요.'
      }]);
    } finally {
      setIsAiLoading(false);
    }
  }, [API_BASE_URL]);

  // 메시지 전송 (AI 또는 상담사)
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    if (isAgentConnected) {
      // 상담사 연결 시 WebSocket으로 전송
      if (!stompRef.current?.connected) return;

      stompRef.current.send(
        `/app/support.send/${roomId}`,
        {},
        JSON.stringify({
          type: "TEXT",
          role: "USER",
          text: input,
          userId: userInfo.current.userId
        })
      );
      resetInactivityTimer();
    } else {
      // AI 챗봇에게 질문
      askAI(input);
    }

    setInput("");
  }, [input, isAgentConnected, roomId, resetInactivityTimer, askAI]);

  // 핸드오프 요청
  const requestHandoff = useCallback(() => {
    if (!stompRef.current?.connected) {
      console.error("WebSocket이 연결되지 않았습니다.");
      return;
    }

    if (isAgentConnected) {
      console.log("이미 상담사와 연결되어 있습니다.");
      return;
    }

    if (!userInfo.current.userId) {
      setMessages(prev => [...prev, {
        role: 'SYS',
        text: '로그인 후 상담사 연결을 요청할 수 있습니다.'
      }]);
      return;
    }

    console.log("📤 핸드오프 요청 전송:", {
      roomId,
      userId: userInfo.current.userId,
      userName: userInfo.current.name,
      userNickname: userInfo.current.nickname
    });

    stompRef.current.send(
      `/app/support.handoff/${roomId}`,
      {},
      JSON.stringify({
        type: "HANDOFF",
        message: "상담사 연결 요청",
        userId: userInfo.current.userId,
        userName: userInfo.current.name,
        userNickname: userInfo.current.nickname
      })
    );

    setMessages(prev => [...prev, {
      role: 'SYS',
      text: '상담사 연결을 요청했습니다.'
    }]);
  }, [roomId, isAgentConnected]);

  // 연결 해제
  const disconnectAgent = useCallback(() => {
    if (!stompRef.current?.connected) return;

    console.log("📤 유저 연결 해제 요청");

    setIsAgentConnected(false);
    setMessages(prev => [...prev, {
      role: 'SYS',
      text: '상담사 연결을 해제했습니다.'
    }]);

    stompRef.current.send(
      `/app/support.disconnect/${roomId}`,
      {},
      JSON.stringify({
        userName: userInfo.current.name,
        userNickname: userInfo.current.nickname
      })
    );

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, [roomId]);

  // 대화 내용 삭제
  const clearMessages = useCallback(() => {
    if (window.confirm('대화 내용을 삭제하시겠습니까?\n(상대방 화면에는 영향이 없습니다)')) {
      setMessages(getInitialMessages());
      setIsFaqVisible(true); // ✅ 대화 삭제 시 FAQ 다시 보이기
    }
  }, []);

  // UI 이벤트 핸들러
  const toggleCategory = useCallback((categoryId: number) => {
    setOpenCategoryId(prev => prev === categoryId ? null : categoryId);
    setOpenFaqId(null);
  }, []);

  const toggleFaq = useCallback((faqId: number) => {
    setOpenFaqId(prev => prev === faqId ? null : faqId);
  }, []);

  // 페이지 가시성 변경 시 타이머 리셋
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAgentConnected) {
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAgentConnected, resetInactivityTimer]);

  // ✅ 로그아웃 시 채팅 기록 초기화
  useEffect(() => {
    const handleLogout = () => {
      console.log('🔄 로그아웃 감지 - 채팅 기록 초기화');

      // 현재 사용자의 채팅 관련 localStorage 삭제
      const userInfo = getUserInfo();
      if (userInfo.userId) {
        localStorage.removeItem(`chatbot-messages-user-${userInfo.userId}`);
        localStorage.removeItem(`chatbot-isAgentConnected-user-${userInfo.userId}`);
      }

      // 게스트 데이터도 삭제
      localStorage.removeItem('chatbot-messages-guest');
      localStorage.removeItem('chatbot-isAgentConnected-guest');
      localStorage.removeItem('chatbot-guest-roomId');

      // 메시지 초기화
      setMessages(getInitialMessages());
      setIsAgentConnected(false);
    };

    window.addEventListener('userLogout', handleLogout);
    return () => window.removeEventListener('userLogout', handleLogout);
  }, []);

  // 타이머 관리
  useEffect(() => {
    if (isAgentConnected) {
      resetInactivityTimer();
    } else if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAgentConnected, resetInactivityTimer]);

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 md:px-14" style={{ maxWidth: '1440px' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-8 gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">고객지원센터</h1>
            {isAgentConnected && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                ● 연결됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={clearMessages}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
            >
              🗑️ 대화 삭제
            </button>
            {isAgentConnected ? (
              <button
                onClick={() => {
                  if (window.confirm('상담사 연결을 해제하시겠습니까?')) {
                    disconnectAgent();
                  }
                }}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                해제하기
              </button>
            ) : (
              <button
                onClick={requestHandoff}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: '#006AFF' }}
              >
                상담사 연결
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-180px)] md:h-[600px] md:min-h-[600px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'USER';
              const isSystem = m.role === 'SYS';

              if (isSystem) {
                return (
                  <div key={idx} className="flex justify-center">
                    <div className="rounded-lg px-4 py-3 shadow-sm max-w-md" style={{ backgroundColor: '#D6E4F0' }}>
                      {m.text.split('\n').map((line, i) => (
                        <p key={i} className="text-sm md:text-base text-gray-700 text-center">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex items-start gap-2 md:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={m.role === 'ADMIN' ? '/images/agent.png' : '/images/ai-bot.png'}
                        alt={m.role === 'ADMIN' ? 'Admin' : 'AI Bot'}
                        className="w-[180%] h-[180%] object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-8 h-8 text-gray-600">
                              <path fill-rule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 0116 0H4z" clip-rule="evenodd"/>
                            </svg>
                          `;
                        }}
                      />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {!isUser && (
                      <span className="text-xs font-semibold text-gray-700 mb-1 ml-1">
                        {m.role === 'AI' ? 'AI 봇' :
                          m.role === 'BOT' ? 'HireBot' :
                            m.role === 'ADMIN' ? '상담사' : '봇'}
                      </span>
                    )}

                    <div
                      className={`px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base rounded-2xl break-words ${isUser
                          ? 'text-white rounded-tr-sm'
                          : 'bg-gray-50 text-gray-800 rounded-tl-sm shadow-sm'
                        }`}
                      style={isUser ? { backgroundColor: '#006AFF' } : {}}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {isAiLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src="/images/ai-bot.png"
                    alt="AI Bot"
                    className="w-[150%] h-[150%] object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-8 h-8 text-gray-600">
                          <path fill-rule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 0116 0H4z" clip-rule="evenodd"/>
                        </svg>
                      `;
                    }}
                  />
                </div>
                <div className="flex flex-col max-w-[75%] items-start">
                  <span className="text-xs font-semibold text-gray-700 mb-1 ml-1">AI 봇</span>
                  <div className="px-4 py-2.5 text-base rounded-2xl break-words bg-gray-50 text-gray-800 rounded-tl-sm shadow-sm">
                    답변을 생성하고 있습니다...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* FAQ 토글 버튼과 아코디언 */}
            <div className="mt-8 pt-4">
              <div className="flex items-start gap-3">
                {/* 토글 버튼 */}
                <button
                  onClick={() => setIsFaqVisible(!isFaqVisible)}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0 shadow-sm"
                  title={isFaqVisible ? 'FAQ 숨기기' : 'FAQ 보기'}
                >
                  {isFaqVisible ? (
                    <ChevronDownIcon className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <ChevronUpIcon className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>

                {/* FAQ 아코디언 */}
                {isFaqVisible && (
                  <div className="flex-1 space-y-3">
                    {faqCategories.map((category) => (
                      <div key={category.id} className="w-full max-w-md">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full text-left bg-white text-gray-600 rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-md transition flex items-center justify-between font-semibold hover:bg-gray-50"
                        >
                          <div>
                            <div className="text-sm">📋 {category.category}</div>
                            <div className="text-xs opacity-90 mt-1">{category.description}</div>
                          </div>
                          {openCategoryId === category.id ? (
                            <ChevronUpIcon className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 flex-shrink-0" />
                          )}
                        </button>

                        {openCategoryId === category.id && (
                          <div className="mt-2 space-y-2 pl-2 md:pl-4">
                            {category.items.map((faq) => (
                              <div key={faq.id}>
                                <button
                                  onClick={() => toggleFaq(faq.id)}
                                  className="w-full text-left bg-white hover:bg-gray-50 rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-sm text-sm text-gray-700 transition flex items-center justify-between"
                                >
                                  <span>💬 {faq.question}</span>
                                  {openFaqId === faq.id ? (
                                    <ChevronUpIcon className="w-4 h-4 flex-shrink-0" />
                                  ) : (
                                    <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                                  )}
                                </button>

                                {openFaqId === faq.id && (
                                  <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-sm">
                                    <p className="text-sm text-gray-800">{faq.answer}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                onKeyDown={(e) => {
                  // 한글 입력 중복 방지
                  if (isComposingRef.current) return;
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder={
                  isAgentConnected
                    ? "상담사에게 메시지를 입력하세요"
                    : isAiLoading
                      ? "AI가 답변 중입니다..."
                      : "AI 챗봇에게 질문하세요"
                }
                disabled={isAiLoading}
                className="flex-1 px-2 rounded-lg border-0 focus:outline-none text-sm md:text-base disabled:bg-gray-100"
              />
              <button
                onClick={sendMessage}
                disabled={isAiLoading || !input.trim()}
                className="p-2 text-gray-500 hover:text-blue-500 disabled:text-gray-300 transition-colors"
                title="메시지 전송"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 rotate-[5deg]"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== Helper Functions ==========

function getInitialMessages(): Message[] {
  return [
    { role: 'AI', text: '안녕하세요! AI 챗봇입니다. 무엇을 도와드릴까요?' },
    { role: 'AI', text: '카테고리를 선택하여 자주 묻는 질문을 확인하거나, 직접 질문해주세요.' },
  ];
}

function getUserInfo() {
  let userId = localStorage.getItem('userId');

  if (userId === "undefined" || !userId) {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        userId = decoded.uid || decoded.userId || decoded.id || decoded.sub;
      }
    }
  }

  const email = localStorage.getItem('email') || 'user@example.com';

  return {
    userId: userId && userId !== "undefined" ? userId : null,
    name: email.split('@')[0],
    nickname: email.split('@')[0]
  };
}

function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT 디코딩 실패:", e);
    return null;
  }
}

export default ChatBot;