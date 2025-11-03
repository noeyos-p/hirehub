import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PaperAirplaneIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

interface FaqItem {
  id: number;
  content: string;
  botAnswer: string;
  category: string;
}

const ChatBot: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // ✅ roomId를 localStorage에 저장하여 브라우저 종료 후에도 유지
  const roomId = useMemo(() => {
    const stored = localStorage.getItem('chatbot-roomId');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem('chatbot-roomId', newId);
    return newId;
  }, []);

  const [input, setInput] = useState("");

  // ✅ 메시지도 localStorage에 저장하여 브라우저 종료 후에도 유지
  const [messages, setMessages] = useState<Array<{ role: 'BOT' | 'USER' | 'AGENT' | 'SYS', text: string }>>(() => {
    const stored = localStorage.getItem('chatbot-messages');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [
          { role: 'BOT', text: '안녕하세요 반갑습니다.' },
          { role: 'BOT', text: '아래 내용이 궁금하다면 클릭하여 빠르게 안내를 받아 보세요.' },
        ];
      }
    }
    return [
      { role: 'BOT', text: '안녕하세요 반갑습니다.' },
      { role: 'BOT', text: '아래 내용이 궁금하다면 클릭하여 빠르게 안내를 받아 보세요.' },
    ];
  });

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  // ✅ 연결 상태를 localStorage에 저장하여 브라우저 종료 후에도 유지
  const [isAgentConnected, setIsAgentConnected] = useState(() => {
    const stored = localStorage.getItem('chatbot-isAgentConnected');
    return stored === 'true';
  });

  // ✅ JWT 토큰 디코딩 함수
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

  // ✅ 실제 유저 정보 가져오기 (localStorage에서)
  const [userInfo, setUserInfo] = useState(() => {
    console.log("=== 유저 정보 초기화 시작 ===");
    
    // 1. localStorage에서 직접 userId 확인
    let userId = localStorage.getItem('userId');
    console.log("📦 localStorage userId:", userId);
    
    // "undefined" 문자열 체크
    if (userId === "undefined" || !userId) {
      // 2. JWT 토큰에서 userId 추출 시도
      const token = localStorage.getItem('token');
      console.log("📦 localStorage token:", token);
      
      if (token) {
        const decoded = decodeJWT(token);
        console.log("🔓 JWT 디코딩 결과:", decoded);
        
        if (decoded) {
          // JWT에서 userId 추출 (uid, userId, id, sub 등 다양한 필드명 시도)
          userId = decoded.uid || decoded.userId || decoded.id || decoded.sub;
          console.log("✅ JWT에서 userId 추출:", userId);
        }
      }
    }
    
    // 3. email과 role 가져오기
    const email = localStorage.getItem('email') || 'user@example.com';
    const role = localStorage.getItem('role') || 'USER';
    
    console.log("최종 유저 정보:", { userId, email, role });
    
    return {
      userId: userId && userId !== "undefined" ? userId : null,
      name: email.split('@')[0], // 이메일의 @ 앞부분을 이름으로
      nickname: email.split('@')[0]
    };
  });

  // ✅ userName 추출 (이 줄 추가!)
  const userName = userInfo.name;

  const stompRef = useRef<CompatClient | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true); // ✅ 초기 마운트 구분

  // ✅ 메시지 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('chatbot-messages', JSON.stringify(messages));
  }, [messages]);

  // ✅ 연결 상태 변경 시 localStorage 업데이트
  useEffect(() => {
    localStorage.setItem('chatbot-isAgentConnected', String(isAgentConnected));
  }, [isAgentConnected]);

  // ✅ 10분 비활성 시 자동 연결 해제
  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (isAgentConnected) {
      console.log("⏰ 타이머 시작: 10분 후 자동 연결 해제");
      inactivityTimerRef.current = setTimeout(() => {
        console.log("⏰ 10분 비활성으로 자동 연결 해제 실행");
        // disconnectAgent 함수를 직접 호출하지 않고 상태 업데이트로 처리
        setIsAgentConnected(false);
        setMessages(prev => [...prev, {
          role: 'SYS',
          text: '10분간 활동이 없어 상담사 연결이 자동으로 해제되었습니다.'
        }]);

        // 서버에 연결 해제 전송
        if (stompRef.current) {
          stompRef.current.send(
            `/app/support.disconnect/${roomId}`,
            {},
            JSON.stringify({ userName: "user" })
          );
        }
      }, 10 * 60 * 1000); // 10분
    }
  }, [isAgentConnected, roomId]);

  // FAQ 데이터 로드
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/chatbot/faq`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("FAQ 데이터:", data);
        if (Array.isArray(data)) {
          setFaqs(data);
        } else {
          console.error("FAQ 데이터가 배열이 아닙니다:", data);
          setFaqs([]);
        }
      })
      .catch(err => {
        console.error("FAQ 로드 실패:", err);
        setFaqs([]);
      });
  }, [API_BASE_URL]);

  // WebSocket 연결
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
        console.log("✅ WebSocket 연결 성공");

        client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
          try {
            const body = JSON.parse(frame.body);
            const messageId = `user-${body.type}-${body.role}-${body.text}-${Date.now()}`;

            // ✅ 중복 메시지 방지
            if (processedMessagesRef.current.has(messageId)) {
              console.log("🚫 중복 메시지 무시:", messageId);
              return;
            }
            processedMessagesRef.current.add(messageId);

            console.log("📩 받은 메시지:", body);

            if (body.type === "HANDOFF_REQUESTED") {
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사 연결을 요청했습니다. 잠시만 기다려주세요.' }]);
            } else if (body.type === "HANDOFF_ACCEPTED") {
              console.log("✅ 상담사 연결됨!");
              setIsAgentConnected(true);
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사가 연결되었습니다. 지금부터 실시간 상담이 가능합니다.' }]);
              // resetInactivityTimer는 useEffect에서 자동 호출됨
            } else if (body.type === "AGENT_DISCONNECTED") {
              console.log("❌ 상담사 연결 해제됨");
              setIsAgentConnected(false);
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사가 연결을 해제했습니다.' }]);
              if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
              }
            } else if (body.type === "USER_DISCONNECTED") {
              console.log("✅ 본인이 연결 해제함");
              if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
              }
            } else if (body.text) {
              const role = (body.role as 'BOT' | 'USER' | 'AGENT') ?? 'BOT';
              const text = (body.text as string) ?? '';
              setMessages(prev => [...prev, { role, text }]);
              if (role === 'AGENT') {
                console.log("📨 상담사 메시지 수신 - 타이머 리셋");
                resetInactivityTimer();
              }
            }
          } catch (error) {
            console.error("메시지 파싱 오류:", error);
            if (frame.body) setMessages(prev => [...prev, { role: 'BOT', text: frame.body }]);
          }
        });

        // ✅ 새로고침 후 재연결 시 타이머 시작
        if (isAgentConnected) {
          console.log("🔄 연결 상태 복원");
          // resetInactivityTimer는 useEffect에서 자동 호출됨

          // ✅ 초기 마운트가 아니고 재연결인 경우에만 복귀 메시지 추가
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

    console.log("📤 메시지 전송 - 타이머 리셋");
    stompRef.current.send(
      `/app/support.send/${roomId}`,
      {},
      JSON.stringify({ type: "TEXT", role: "USER", text: input })
    );
    setInput("");
    resetInactivityTimer(); // 메시지 전송 시 타이머 리셋
  };

  const requestHandoff = React.useCallback(() => {
    if (!stompRef.current || isAgentConnected) return;

    console.log("📩 핸드오프 요청 전송 준비");
    console.log("  - userInfo:", userInfo);
    console.log("  - userId:", userInfo.userId);
    console.log("  - userName:", userName);
    console.log("  - userNickname:", userInfo.nickname);

    // ✅ userId가 없으면 경고
    if (!userInfo.userId) {
      console.error("❌ userId가 없습니다! 로그인이 필요합니다.");
      console.log("💡 디버깅 정보:");
      console.log("  - localStorage 전체:", { ...localStorage });
      console.log("  - 모든 localStorage 키:", Object.keys(localStorage));
      
      // 각 키의 값 출력
      Object.keys(localStorage).forEach(key => {
        console.log(`  - ${key}:`, localStorage.getItem(key));
      });
      
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

    console.log("✅ 핸드오프 요청 전송 완료");
    setMessages(prev => [...prev, { role: 'SYS', text: '상담사 연결을 요청했습니다.' }]);
  }, [roomId, isAgentConnected, userName, userInfo]);

  const disconnectAgent = (auto = false) => {
    if (!stompRef.current) return;

    console.log("🔌 유저가 연결 해제 요청:", roomId);

    // ✅ 먼저 상태와 메시지 업데이트
    setIsAgentConnected(false);
    const disconnectMessage = auto
      ? '10분간 활동이 없어 상담사 연결이 자동으로 해제되었습니다.'
      : '상담사 연결을 해제했습니다.';

    setMessages(prev => [...prev, { role: 'SYS', text: disconnectMessage }]);

    // 서버에 연결 해제 전송
    stompRef.current.send(
      `/app/support.disconnect/${roomId}`,
      {},
      JSON.stringify({ userName })
    );

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  // ✅ 탭 비활성화 시 타이머 관리 (연결 해제는 하지 않음)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAgentConnected) {
        console.log("👁️ 탭 활성화 - 타이머 리셋");
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAgentConnected]);

  // ✅ 컴포넌트 마운트/연결 상태 변경 시 타이머 시작
  useEffect(() => {
    console.log("🔄 연결 상태 변경:", isAgentConnected);
    if (isAgentConnected) {
      resetInactivityTimer();
    } else {
      // 연결 해제 시 타이머 정리
      if (inactivityTimerRef.current) {
        console.log("🛑 타이머 정리");
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

  const toggleFaq = (id: number) => {
    setOpenFaqId(prevId => prevId === id ? null : id);
  };

  // ✅ 대화 내용 삭제 (본인 화면에서만)
  const clearMessages = () => {
    if (window.confirm('대화 내용을 삭제하시겠습니까?\n(상대방 화면에는 영향이 없습니다)')) {
      setMessages([
        { role: 'BOT', text: '안녕하세요 반갑습니다.' },
        { role: 'BOT', text: '아래 내용이 궁금하다면 클릭하여 빠르게 안내를 받아 보세요.' },
      ]);
      console.log("🗑️ 대화 내용 삭제됨");
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

            {/* FAQ 아코디언 */}
            <div className="ml-13 space-y-2">
              {Array.isArray(faqs) && faqs.length > 0 ? (
                faqs.map((faq) => (
                  <div key={faq.id} className="w-full max-w-md">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition flex items-center justify-between"
                    >
                      <span>{faq.content}</span>
                      {openFaqId === faq.id ? (
                        <ChevronUpIcon className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>

                    {openFaqId === faq.id && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-4 py-3 shadow-sm">
                        <p className="text-sm text-gray-800">{faq.botAnswer}</p>
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
                  className="block w-full max-w-md text-left bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-3 shadow-sm text-sm transition"
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