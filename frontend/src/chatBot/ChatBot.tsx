import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const ChatBot: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const roomId = useMemo(() => {
    const stored = localStorage.getItem('chatbot-roomId');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem('chatbot-roomId', newId);
    return newId;
  }, []);

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Array<{ role: 'BOT' | 'USER' | 'AGENT' | 'SYS', text: string }>>(() => {
    const stored = localStorage.getItem('chatbot-messages');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [
          { role: 'BOT', text: '안녕하세요 반갑습니다.' },
          { role: 'BOT', text: '카테고리를 선택하여 자주 묻는 질문을 확인해보세요.' },
        ];
      }
    }
    return [
      { role: 'BOT', text: '안녕하세요 반갑습니다.' },
      { role: 'BOT', text: '카테고리를 선택하여 자주 묻는 질문을 확인해보세요.' },
    ];
  });

  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const [isAgentConnected, setIsAgentConnected] = useState(() => {
    const stored = localStorage.getItem('chatbot-isAgentConnected');
    return stored === 'true';
  });

  const decodeJWT = (token: string) => {
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
  };

  const [userInfo] = useState(() => {
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
  });

  const userName = userInfo.name;

  const stompRef = useRef<CompatClient | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);

  useEffect(() => {
    localStorage.setItem('chatbot-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatbot-isAgentConnected', String(isAgentConnected));
  }, [isAgentConnected]);

  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (isAgentConnected) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsAgentConnected(false);
        setMessages(prev => [...prev, {
          role: 'SYS',
          text: '10분간 활동이 없어 상담사 연결이 자동으로 해제되었습니다.'
        }]);

        if (stompRef.current) {
          stompRef.current.send(
            `/app/support.disconnect/${roomId}`,
            {},
            JSON.stringify({ userName: "user" })
          );
        }
      }, 10 * 60 * 1000);
    }
  }, [isAgentConnected, roomId]);

  // ✅ 계층형 FAQ 로드 (중복 제거)
  useEffect(() => {
    console.log("=== 계층형 FAQ 로드 시작 ===");
    
    fetch(`${API_BASE_URL}/api/chatbot/faq/categories`)
      .then(res => {
        console.log("응답 상태:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("받은 계층형 데이터:", data);
        if (Array.isArray(data)) {
          console.log("✅ 카테고리 개수:", data.length);
          data.forEach((cat: FaqCategory) => {
            console.log(`  📁 ${cat.category}: ${cat.items.length}개 질문`);
          });
          setFaqCategories(data);
        } else {
          console.error("FAQ 데이터가 배열이 아닙니다:", data);
          setFaqCategories([]);
        }
      })
      .catch(err => {
        console.error("FAQ 로드 실패:", err);
        setFaqCategories([]);
      });
  }, [API_BASE_URL]);

  useEffect(() => {
    const sock = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(() => sock);
    (client as any).debug = () => { };

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
            const messageId = `user-${body.type}-${body.role}-${body.text}-${Date.now()}`;

            if (processedMessagesRef.current.has(messageId)) {
              return;
            }
            processedMessagesRef.current.add(messageId);

            if (body.type === "HANDOFF_REQUESTED") {
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사 연결을 요청했습니다. 잠시만 기다려주세요.' }]);
            } else if (body.type === "HANDOFF_ACCEPTED") {
              setIsAgentConnected(true);
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사가 연결되었습니다. 지금부터 실시간 상담이 가능합니다.' }]);
            } else if (body.type === "AGENT_DISCONNECTED") {
              setIsAgentConnected(false);
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사가 연결을 해제했습니다.' }]);
              if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
              }
            } else if (body.type === "USER_DISCONNECTED") {
              if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
              }
            } else if (body.text) {
              const role = (body.role as 'BOT' | 'USER' | 'AGENT') ?? 'BOT';
              const text = (body.text as string) ?? '';
              setMessages(prev => [...prev, { role, text }]);
              if (role === 'AGENT') {
                resetInactivityTimer();
              }
            }
          } catch (error) {
            console.error("메시지 파싱 오류:", error);
            if (frame.body) setMessages(prev => [...prev, { role: 'BOT', text: frame.body }]);
          }
        });

        if (isAgentConnected) {
          if (!isInitialMount.current) {
            setMessages(prev => [...prev, { role: 'SYS', text: '연결이 복원되었습니다.' }]);
          }
        }

        isInitialMount.current = false;
      },
      (err) => {
        console.error("STOMP error:", err);
      }
    );

    return () => {
      try { client.disconnect(() => { }); } catch { }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [roomId, API_BASE_URL]);

  const sendText = () => {
    if (!stompRef.current || !input.trim() || !isAgentConnected) return;

    stompRef.current.send(
      `/app/support.send/${roomId}`,
      {},
      JSON.stringify({ type: "TEXT", role: "USER", text: input })
    );
    setInput("");
    resetInactivityTimer();
  };

  const requestHandoff = React.useCallback(() => {
    if (!stompRef.current || isAgentConnected) return;

    if (!userInfo.userId) {
      setMessages(prev => [...prev, { 
        role: 'SYS', 
        text: '로그인 후 상담사 연결을 요청할 수 있습니다.' 
      }]);
      return;
    }

    stompRef.current.send(
      `/app/support.handoff/${roomId}`,
      {},
      JSON.stringify({
        type: "HANDOFF",
        message: "상담사 연결 요청",
        userId: userInfo.userId,
        userName: userName,
        userNickname: userInfo.nickname
      })
    );

    setMessages(prev => [...prev, { role: 'SYS', text: '상담사 연결을 요청했습니다.' }]);
  }, [roomId, isAgentConnected, userName, userInfo]);

  const disconnectAgent = (auto = false) => {
    if (!stompRef.current) return;

    setIsAgentConnected(false);
    const disconnectMessage = auto
      ? '10분간 활동이 없어 상담사 연결이 자동으로 해제되었습니다.'
      : '상담사 연결을 해제했습니다.';

    setMessages(prev => [...prev, { role: 'SYS', text: disconnectMessage }]);

    stompRef.current.send(
      `/app/support.disconnect/${roomId}`,
      {},
      JSON.stringify({ userName })
    );

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAgentConnected) {
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAgentConnected]);

  useEffect(() => {
    if (isAgentConnected) {
      resetInactivityTimer();
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [isAgentConnected, resetInactivityTimer]);

  const toggleCategory = (categoryId: number) => {
    setOpenCategoryId(prev => prev === categoryId ? null : categoryId);
    setOpenFaqId(null);
  };

  const toggleFaq = (faqId: number) => {
    setOpenFaqId(prevId => prevId === faqId ? null : faqId);
  };

  const clearMessages = () => {
    if (window.confirm('대화 내용을 삭제하시겠습니까?\n(상대방 화면에는 영향이 없습니다)')) {
      setMessages([
        { role: 'BOT', text: '안녕하세요 반갑습니다.' },
        { role: 'BOT', text: '카테고리를 선택하여 자주 묻는 질문을 확인해보세요.' },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">고객지원센터</h1>
          <button
            onClick={clearMessages}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
          >
            🗑️ 대화 내용 삭제
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-6 min-h-[600px] flex flex-col">
          <div className="flex-1 space-y-6 mb-6 overflow-y-auto">
            {messages.map((m, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {m.role === 'BOT' ? 'HireBot' : m.role === 'AGENT' ? '상담사' : m.role === 'SYS' ? '알림' : '나'}
                  </p>
                  <div className="bg-white rounded-lg px-4 py-3 shadow-sm max-w-md">
                    <p className="text-sm text-gray-800">{m.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* ✨ 계층형 FAQ 아코디언 */}
            <div className="ml-13 space-y-3">
              {Array.isArray(faqCategories) && faqCategories.length > 0 ? (
                faqCategories.map((category) => (
                  <div key={category.id} className="w-full max-w-md">
                    {/* 카테고리 헤더 */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full text-left bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-lg px-4 py-3 shadow-md transition flex items-center justify-between font-semibold"
                    >
                      <div>
                        <div className="text-sm">📁 {category.category}</div>
                        <div className="text-xs opacity-90 mt-1">{category.description}</div>
                      </div>
                      {openCategoryId === category.id ? (
                        <ChevronUpIcon className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 flex-shrink-0" />
                      )}
                    </button>

                    {/* 카테고리 내 FAQ 목록 */}
                    {openCategoryId === category.id && (
                      <div className="mt-2 space-y-2 pl-4">
                        {category.items.map((faq) => (
                          <div key={faq.id}>
                            <button
                              onClick={() => toggleFaq(faq.id)}
                              className="w-full text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition flex items-center justify-between"
                            >
                              <span>💬 {faq.question}</span>
                              {openFaqId === faq.id ? (
                                <ChevronUpIcon className="w-4 h-4 flex-shrink-0" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                              )}
                            </button>

                            {openFaqId === faq.id && (
                              <div className="mt-2 bg-blue-50 rounded-lg px-4 py-3 shadow-sm">
                                <p className="text-sm text-gray-800">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">자주 묻는 질문을 불러오는 중...</div>
              )}

              {/* 상담사 연결/해제 버튼 */}
              {!isAgentConnected ? (
                <button
                  onClick={requestHandoff}
                  className="block w-full max-w-md text-left bg-blue-400 hover:bg-blue-500 text-white rounded-lg px-4 py-3 shadow-sm text-sm transition"
                >
                  💬 상담사 연결하기
                </button>
              ) : (
                <div className="w-full max-w-md space-y-2">
                  <div className="bg-green-100 border border-green-500 rounded-lg px-4 py-3 text-sm text-green-800">
                    ✅ 상담사와 연결되었습니다
                    <div className="text-xs mt-1 text-green-600">
                      * 10분간 활동이 없으면 자동으로 연결이 해제됩니다.
                    </div>
                  </div>
                  <button
                    onClick={() => disconnectAgent(false)}
                    className="block w-full text-left bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-3 shadow-sm text-sm transition"
                  >
                    ❌ 연결 해제하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isAgentConnected) sendText(); }}
              placeholder={isAgentConnected ? "문의 사항을 남겨주세요" : "상담사 연결 후 이용 가능합니다"}
              disabled={!isAgentConnected}
              className={`w-full bg-white border border-gray-300 rounded-full px-6 py-4 pr-14 text-sm focus:outline-none ${!isAgentConnected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                }`}
            />
            <button
              onClick={sendText}
              disabled={!isAgentConnected}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition ${isAgentConnected ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300 cursor-not-allowed'
                }`}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-2">roomId: {roomId}</div>
      </div>
    </div>
  );
};

export default ChatBot;