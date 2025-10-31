import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../../api/api';

// SockJS를 위한 global 정의
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: { NODE_ENV: 'development' } };
}

interface ChatMessage {
  id?: number;
  content: string;
  createAt: string;
  sessionId: string;
  nickname?: string;
  userId?: number;
}

const RealTimeChat: React.FC = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [userNickname, setUserNickname] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializing = useRef(false);
  const sessionId = 'main-chat-room';

  const API_BASE_URL = api.defaults.baseURL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (stompClient) {
        console.log('컴포넌트 언마운트: WebSocket 연결 해제');
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  const fetchUserInfo = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('토큰 없음 - 비인증 사용자');
        setUserNickname('');
        setIsAuthenticated(false);
        return false;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        const nick = user.nickname || user.name || '익명';
        console.log('사용자 정보 조회 성공:', user);
        setUserNickname(nick.trim() || '익명');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('사용자 정보 조회 실패 - 토큰 무효');
        localStorage.removeItem('token');
        setUserNickname('');
        setIsAuthenticated(false);
        return false;
      }
    } catch (e) {
      console.error('사용자 정보 조회 에러:', e);
      setUserNickname('');
      setIsAuthenticated(false);
      return false;
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}?limit=30`, { headers });
      if (res.ok) {
        const messages = await res.json();
        console.log('이전 메시지 로드:', messages.length, '개');
        setMessages(messages);
      } else {
        console.log('메시지 로드 실패');
        setMessages([]);
      }
    } catch (e) {
      console.error('메시지 로드 에러:', e);
      setMessages([]);
    }
  };

  // ✅ handleLeave 함수 정의 (한 번만)
  const handleLeave = () => {
    console.log('채팅방 퇴장');
    setIsJoined(false);
    localStorage.removeItem('chatRoomJoined');
    setMessages([]);
    setIsConnected(false);

    if (stompClient) {
      stompClient.deactivate();
    }
  };

  // ✅ 실제 WebSocket 연결 로직 (공통 함수로 분리)
  const connectToChatRoom = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('토큰 없음 - 연결 불가');
      return;
    }

    console.log('=== 채팅방 입장 시작 ===');

    try {
      await fetchRecentMessages();
      setIsJoined(true);
      localStorage.setItem('chatRoomJoined', 'true');

      console.log('WebSocket 연결 시도, 토큰 존재:', !!token);

      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => console.log('STOMP:', str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('✅ STOMP 연결 성공', frame);
        setIsConnected(true);
        setConnectionError('');

        console.log(`📢 구독 시작: /topic/rooms/${sessionId}`);

        const subscription = client.subscribe(`/topic/rooms/${sessionId}`, (message) => {
          console.log('📨 새 메시지 수신 (raw):', message);
          console.log('📨 메시지 body:', message.body);

          try {
            const newMsg: ChatMessage = JSON.parse(message.body);
            console.log('✅ 파싱된 메시지:', newMsg);
            console.log('메시지 ID:', newMsg.id, '닉네임:', newMsg.nickname, 'User ID:', newMsg.userId);

            setMessages((prev) => {
              if (newMsg.id && prev.some(m => m.id === newMsg.id)) {
                console.log('⚠️ 중복 메시지 무시:', newMsg.id);
                return prev;
              }
              console.log('✅ 메시지 추가:', newMsg);
              return [...prev, newMsg];
            });
          } catch (e) {
            console.error('❌ 메시지 파싱 실패:', e, message.body);
          }
        });

        console.log('✅ 구독 완료:', subscription.id);
      };

      client.onStompError = (frame) => {
        console.error('❌ STOMP 에러:', frame);
        setConnectionError('연결 실패. 다시 로그인해주세요.');
        setIsConnected(false);
        setIsJoined(false);
        localStorage.removeItem('chatRoomJoined');
      };

      client.onWebSocketClose = (event) => {
        console.log('WebSocket 연결 종료:', event);
        setIsConnected(false);
      };

      client.onDisconnect = () => {
        console.log('STOMP 연결 해제');
        setIsConnected(false);
      };

      client.activate();
      setStompClient(client);

      console.log('=== 채팅방 입장 완료 ===');
    } catch (e) {
      console.error('채팅방 입장 실패:', e);
      setConnectionError('입장 실패. 다시 시도해주세요.');
      setIsJoined(false);
      localStorage.removeItem('chatRoomJoined');
    }
  };

  // ✅ 로그아웃 감지 이벤트 리스너 추가 (3가지 방법 모두 지원)
  useEffect(() => {
    const handleLogout = () => {
      console.log('로그아웃 이벤트 감지 - 채팅방 자동 퇴장');
      handleLeave();
    };

    // 방법 1: 커스텀 이벤트 리스너
    window.addEventListener('userLogout', handleLogout);

    // 방법 2: localStorage 변경 감지 (다른 탭/창에서도 작동)
    const handleStorageChange = (e: StorageEvent) => {
      // token이 삭제되었을 때
      if (e.key === 'token' && e.newValue === null && e.oldValue !== null) {
        console.log('localStorage에서 토큰 삭제 감지 - 채팅방 자동 퇴장');
        handleLeave();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 방법 3: 주기적으로 토큰 존재 확인 (같은 탭에서 로그아웃 감지)
    const checkToken = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token && isJoined) {
        console.log('토큰 없음 감지 - 채팅방 자동 퇴장');
        handleLeave();
      }
    }, 1000); // 1초마다 체크

    return () => {
      window.removeEventListener('userLogout', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkToken);
    };
  }, [isJoined, stompClient]);

  // ✅ 초기 로드 시 인증 확인 및 자동 입장
  useEffect(() => {
    const initAuth = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      console.log('=== 초기화 시작 ===');
      const authenticated = await fetchUserInfo();
      console.log('인증 상태:', authenticated);
      console.log('채팅방 참여 상태:', localStorage.getItem('chatRoomJoined'));

      // ✅ 인증되고 이전에 참여했던 경우 자동 입장
      if (authenticated && localStorage.getItem('chatRoomJoined') === 'true') {
        console.log('✅ 새로고침 감지 - 자동으로 채팅방 재입장');
        await connectToChatRoom();
      }

      isInitializing.current = false;
    };

    initAuth();
  }, []);

  // ✅ 참여 버튼 클릭 핸들러
  const handleJoin = async () => {
    setConnectionError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      return;
    }

    // 사용자 정보가 없으면 다시 가져오기
    if (!isAuthenticated) {
      const authenticated = await fetchUserInfo();
      if (!authenticated) {
        setConnectionError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        return;
      }
    }

    await connectToChatRoom();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      console.log('빈 메시지 전송 시도 차단');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('로그인이 필요합니다.');
      return;
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('메시지 전송 시도:', {
      sessionId,
      content: inputMessage,
      nickname: userNickname,
      hasToken: !!token,
      url: `${API_BASE_URL}/api/chat/send`
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          content: inputMessage,
          nickname: userNickname || '익명',
        }),
      });

      if (res.ok) {
        console.log('✅ 메시지 전송 성공');
        setInputMessage('');
      } else {
        console.error('❌ 메시지 전송 실패:', res.status);
        if (res.status === 401 || res.status === 403) {
          setConnectionError('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
      }
    } catch (e) {
      console.error('❌ 메시지 전송 에러:', e);
      setConnectionError('메시지 전송 실패. 다시 시도해주세요.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✅ UTC 시간을 한국 시간으로 변환하는 함수
  const formatKoreanTime = (utcTime: string) => {
    const date = new Date(utcTime);
    // UTC+9 시간대로 변환
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return koreanTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-800">실시간 채팅</h2>
          {isJoined && (
            <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isConnected ? '● 연결됨' : '○ 연결 끊김'}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isJoined ? (
            <button
              onClick={handleJoin}
              disabled={!isAuthenticated}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isAuthenticated
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              title={!isAuthenticated ? '로그인이 필요합니다' : ''}
            >
              참여
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              퇴장
            </button>
          )}
        </div>
      </div>

      {connectionError && (
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
          {connectionError}
        </div>
      )}

      {!isAuthenticated && !isJoined && (
        <div className="mb-2 p-2 bg-blue-100 text-blue-800 text-xs rounded">
          💡 채팅방 참여는 로그인 후 가능합니다.
        </div>
      )}

      <div className="h-96 bg-gray-100 rounded-lg overflow-hidden flex flex-col">
        {!isJoined ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {isAuthenticated
              ? '참여 버튼을 눌러 채팅방에 입장하세요'
              : '로그인 후 채팅방에 참여할 수 있습니다'}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  채팅 내역이 없습니다. 첫 메시지를 보내보세요!
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg.id || i} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-600">
                        {msg.nickname || '익명'}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatKoreanTime(msg.createAt)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm break-words">{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-300 p-3 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  disabled={!isConnected}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isConnected}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  전송
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default RealTimeChat;