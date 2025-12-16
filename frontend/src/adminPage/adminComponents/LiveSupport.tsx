import React, { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

interface QueueItem {
  roomId: string;
  userName: string;
  userNickname?: string;
}

const MESSAGE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분

const LiveSupport: React.FC = () => {
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

  const [queue, setQueue] = useState<QueueItem[]>([]);

  // ✅ queue 변경 추적
  useEffect(() => {
    console.log("🔄 큐 상태 변경됨:", queue.length, "건", queue);
  }, [queue]);
  const [activeRoom, setActiveRoom] = useState<string | null>(() =>
    localStorage.getItem('agent-activeRoom')
  );
  const [logs, setLogs] = useState<string[]>(() => {
    const stored = localStorage.getItem('agent-logs');
    try {
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isUserConnected, setIsUserConnected] = useState(() =>
    localStorage.getItem('agent-isUserConnected') === 'true'
  );

  const stompRef = useRef<CompatClient | null>(null);
  const roomSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const processedMessagesRef = useRef<Map<string, number>>(new Map());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 수락한 방 추적 (localStorage에서 복원)
  const acceptedRoomsRef = useRef<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('agent-acceptedRooms') || '[]'))
  );

  // localStorage 동기화
  useEffect(() => {
    if (activeRoom) {
      localStorage.setItem('agent-activeRoom', activeRoom);
    } else {
      localStorage.removeItem('agent-activeRoom');
    }
  }, [activeRoom]);

  useEffect(() => {
    localStorage.setItem('agent-logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('agent-isUserConnected', String(isUserConnected));
  }, [isUserConnected]);

  // 메시지 중복 체크
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

  // 방 구독
  const subscribeRoom = useCallback((roomId: string) => {
    console.log("📡 방 구독 시도:", roomId);

    if (!stompRef.current?.connected) {
      console.error("❌ STOMP 클라이언트가 연결되지 않았습니다");
      return;
    }

    // 기존 구독 해제
    if (roomSubRef.current) {
      try {
        console.log("🔄 기존 구독 해제 중...");
        roomSubRef.current.unsubscribe();
      } catch (e) {
        console.error("구독 해제 오류:", e);
      }
      roomSubRef.current = null;
    }

    console.log("📍 구독 경로:", `/topic/rooms/${roomId}`);
    roomSubRef.current = stompRef.current.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      console.log("📨 방 메시지 수신:", frame.body);
      try {
        const body = JSON.parse(frame.body);

        // ✅ HelpDto 형식 처리 (content 필드 사용)
        const content = body.content || body.text;
        const role = body.role || 'UNKNOWN';

        if (!content) {
          console.warn("⚠️ 메시지 내용이 없습니다:", body);
          return;
        }

        const messageId = `agent-${body.type}-${role}-${content}`;

        if (isMessageProcessed(messageId)) {
          console.log("⏭️ 중복 메시지 무시:", messageId);
          return;
        }

        handleRoomMessage({ ...body, text: content, role });
      } catch (e) {
        console.error("방 메시지 파싱 오류:", e);
        if (frame.body) setLogs(prev => [...prev, `[RAW] ${frame.body}`]);
      }
    });
    console.log("✅ 방 구독 완료:", roomId);
  }, [isMessageProcessed]);

  // 방 메시지 핸들러
  const handleRoomMessage = useCallback((body: any) => {
    console.log("📨 상담사가 받은 메시지:", body);

    // type이 없고 role이 SYS인 경우도 처리 (일반 메시지 형식)
    if (body.role === 'SYS' && body.text) {
      console.log("🔔 시스템 메시지 수신:", body.text);
      setLogs(prev => [...prev, `[시스템] ${body.text}`]);

      // 유저 연결 해제 메시지 감지
      if (body.text.includes('유저가 연결을 해제') || body.text.includes('연결을 해제')) {
        console.log("⚠️ 유저 연결 해제 감지");
        setIsUserConnected(false);
      }
      return;
    }

    switch (body.type) {
      case "HANDOFF_ACCEPTED":
        const userName = body.userName || "user";
        const userNickname = body.userNickname || "user";
        setLogs(prev => [...prev, `[SYS] [${userName} (${userNickname})] 상담 연결됨`]);
        setIsUserConnected(true);
        break;

      case "USER_DISCONNECTED":
        console.log("⚠️ 유저 연결 해제 수신 (type)");
        setIsUserConnected(false);
        const disconnectText = body.text || "유저가 연결을 해제했습니다.";
        setLogs(prev => [...prev, `[SYS] ${disconnectText}`]);
        break;

      case "AGENT_DISCONNECTED":
        console.log("ℹ️ 상담사 연결 해제 확인 메시지 수신");
        setIsUserConnected(false);
        break;

      default:
        if (body.text) {
          const role = body.role ?? "UNKNOWN";
          const prefix = role === "ADMIN" ? "[나]" : `[${role}]`;
          setLogs(prev => [...prev, `${prefix} ${body.text}`]);
        }
    }
  }, []);

  // 큐 메시지 핸들러
  const handleQueueMessage = useCallback((body: any) => {
    console.log("📥 큐 메시지 수신:", body);

    if (body.event === "HANDOFF_REQUESTED" && body.roomId) {
      // ✅ 이미 수락한 방은 무시
      if (acceptedRoomsRef.current.has(body.roomId)) {
        console.log("⏭️ 이미 수락한 방이므로 무시:", body.roomId);
        return;
      }

      console.log("🔔 핸드오프 요청 수신:", {
        roomId: body.roomId,
        userName: body.userName,
        userNickname: body.userNickname
      });

      setQueue(prev => {
        // ✅ 중복 체크: roomId가 이미 있으면 업데이트, 없으면 추가
        const exists = prev.some(q => q.roomId === body.roomId);

        if (exists) {
          console.log("♻️ 기존 큐 항목 업데이트:", body.roomId);
          return prev.map(q =>
            q.roomId === body.roomId
              ? {
                roomId: body.roomId,
                userName: body.userName || "user",
                userNickname: body.userNickname || "user"
              }
              : q
          );
        } else {
          console.log("➕ 새 큐 항목 추가:", body.roomId);
          return [...prev, {
            roomId: body.roomId,
            userName: body.userName || "user",
            userNickname: body.userNickname || "user"
          }];
        }
      });
    } else if (body.event === "USER_DISCONNECTED" && body.roomId) {
      console.log("🗑️ 큐에서 제거:", body.roomId);
      setQueue(prev => prev.filter(q => q.roomId !== body.roomId));
      // ✅ 수락 목록에서도 제거
      acceptedRoomsRef.current.delete(body.roomId);
      localStorage.setItem('agent-acceptedRooms', JSON.stringify(Array.from(acceptedRoomsRef.current)));
    }
  }, []);

  // ✅ 미처리 상담 요청 불러오기
  const loadPendingRequests = useCallback(async () => {
    console.log("🔍 미처리 상담 요청 불러오기 시작");
    try {
      const token = localStorage.getItem("adminAccessToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

      console.log("🔑 사용 중인 토큰:", token ? "있음" : "없음");
      console.log("📡 요청 URL:", `${API_BASE_URL}/api/admin/support/pending`);

      const response = await fetch(`${API_BASE_URL}/api/admin/support/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📥 응답 상태:", response.status, response.statusText);

      if (response.ok) {
        const pendingRequests = await response.json();
        console.log("📋 미처리 상담 요청:", pendingRequests);

        // 중복 제거하면서 큐에 추가
        setQueue(prev => {
          console.log("현재 큐 상태:", prev);
          const existingRoomIds = new Set(prev.map(q => q.roomId));
          console.log("기존 roomId 목록:", Array.from(existingRoomIds));

          const newRequests = pendingRequests
            .filter((req: any) => {
              const isDuplicate = existingRoomIds.has(req.sessionId);
              const isAccepted = acceptedRoomsRef.current.has(req.sessionId);

              if (isDuplicate) {
                console.log(`⏭️ 중복 건너뛰기: ${req.sessionId}`);
              }
              if (isAccepted) {
                console.log(`⏭️ 이미 수락한 방이므로 건너뛰기: ${req.sessionId}`);
              }

              return !isDuplicate && !isAccepted;
            })
            .map((req: any) => ({
              roomId: req.sessionId,
              userName: req.nickname || "user",
              userNickname: req.nickname || "user"
            }));

          if (newRequests.length > 0) {
            console.log(`➕ ${newRequests.length}건의 미처리 요청을 큐에 추가:`, newRequests);
            const merged = [...prev, ...newRequests];
            console.log("병합 후 큐:", merged);
            return merged;
          } else {
            console.log("ℹ️ 새로운 미처리 요청 없음");
          }
          return prev;
        });
      } else {
        const errorText = await response.text();
        console.error("❌ API 응답 실패:", response.status, errorText);
      }
    } catch (error) {
      console.error("❌ 미처리 요청 로드 실패:", error);
    }
  }, [API_BASE_URL]);

  // ✅ 초기 로드 플래그
  const initialLoadDoneRef = useRef(false);

  // STOMP 연결
  useEffect(() => {
    // SockJS는 http:// 또는 https:// URL을 받아서 자동으로 WebSocket으로 업그레이드
    const wsUrl = API_BASE_URL ? `${API_BASE_URL}/ws` : '/ws';
    console.log('🔌 SockJS 연결 시도:', wsUrl);

    const sock = new SockJS(wsUrl);
    const client = Stomp.over(sock);
    client.debug = () => { };

    const token = localStorage.getItem("adminAccessToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");

    console.log("🔑 사용할 토큰:", token ? `${token.substring(0, 20)}...` : "없음");

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("✅ Authorization 헤더 설정됨");
    } else {
      console.warn("⚠️ 토큰이 없습니다. WebSocket 연결이 인증되지 않을 수 있습니다.");
    }

    client.connect(
      headers,
      () => {
        console.log("✅ STOMP 연결 성공");
        stompRef.current = client;

        // 큐 구독
        console.log("📡 /topic/support.queue 구독 시작");
        client.subscribe("/topic/support.queue", (frame) => {
          try {
            const body = JSON.parse(frame.body);
            const messageId = `queue-${body.event}-${body.roomId}`;

            if (isMessageProcessed(messageId)) return;

            handleQueueMessage(body);
          } catch (e) {
            console.error("큐 메시지 파싱 오류:", e);
          }
        });
        console.log("✅ 큐 구독 완료");

        // ✅ 연결 후 미처리 요청 불러오기 (최초 1회만)
        if (!initialLoadDoneRef.current) {
          loadPendingRequests();
          initialLoadDoneRef.current = true;
        }

        // 활성 방 재구독
        if (activeRoom) {
          subscribeRoom(activeRoom);
          setLogs(prev => [...prev, `[SYS] 연결이 복원되었습니다.`]);
        }
      },
      (err) => {
        console.error("STOMP 연결 오류:", err);
        setLogs(prev => [...prev, `[ERROR] WebSocket 연결 실패: ${err}`]);
      }
    );

    return () => {
      try {
        client.disconnect(() => { });
      } catch (e) {
        console.error("연결 해제 오류:", e);
      }
    };
  }, [API_BASE_URL, activeRoom, subscribeRoom, isMessageProcessed, handleQueueMessage, loadPendingRequests]);

  // 수락 핸들러
  const accept = useCallback((roomId: string) => {
    console.log("✅ 수락 버튼 클릭:", roomId);
    console.log("현재 큐:", queue);

    const request = queue.find(q => q.roomId === roomId);
    if (!request || !stompRef.current?.connected) {
      console.error("수락 실패: 요청을 찾을 수 없거나 STOMP 미연결");
      return;
    }

    console.log("📤 WebSocket으로 수락 메시지 전송");
    stompRef.current.send(
      `/app/support.handoff.accept`,
      {},
      JSON.stringify({ roomId })
    );

    setActiveRoom(roomId);
    setLogs(prev => [...prev,
    `[SYS] [${request.userName} (${request.userNickname})] 상담 연결 중...`
    ]);
    setIsUserConnected(true);

    console.log("🗑️ 큐에서 제거 시도:", roomId);

    // ✅ 수락한 방 기록
    acceptedRoomsRef.current.add(roomId);
    localStorage.setItem('agent-acceptedRooms', JSON.stringify(Array.from(acceptedRoomsRef.current)));
    console.log("✅ 수락한 방 목록:", Array.from(acceptedRoomsRef.current));

    setQueue(prev => {
      const filtered = prev.filter(q => q.roomId !== roomId);
      console.log("제거 전 큐:", prev);
      console.log("제거 후 큐:", filtered);
      return filtered;
    });

    subscribeRoom(roomId);
  }, [queue, subscribeRoom]);

  // 메시지 전송
  const sendToRoom = useCallback(() => {
    if (!stompRef.current?.connected || !activeRoom || !input.trim() || !isUserConnected) {
      console.error("메시지 전송 불가:", {
        connected: stompRef.current?.connected,
        activeRoom,
        hasInput: !!input.trim(),
        isUserConnected
      });
      return;
    }

    const messagePayload = {
      type: "TEXT",
      role: "ADMIN",
      text: input
    };

    console.log("📤 메시지 전송:", messagePayload);
    console.log("📍 목적지:", `/app/support.send/${activeRoom}`);

    try {
      stompRef.current.send(
        `/app/support.send/${activeRoom}`,
        {},
        JSON.stringify(messagePayload)
      );
      console.log("✅ 메시지 전송 성공");

      // WebSocket 브로드캐스트로 받은 메시지만 표시하므로 여기서는 추가하지 않음
      setInput("");
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
      setLogs(prev => [...prev, `[ERROR] 메시지 전송 실패: ${error}`]);
    }
  }, [activeRoom, input, isUserConnected]);

  // 연결 해제
  const disconnectFromUser = useCallback(() => {
    if (!stompRef.current?.connected || !activeRoom) return;

    console.log("📤 상담사 연결 해제:", activeRoom);

    setIsUserConnected(false);
    setLogs(prev => [...prev, `[SYS] 연결을 해제했습니다.`]);

    // ✅ 큐에서 제거
    setQueue(prev => prev.filter(q => q.roomId !== activeRoom));

    // ✅ 수락 목록에서도 제거
    acceptedRoomsRef.current.delete(activeRoom);
    localStorage.setItem('agent-acceptedRooms', JSON.stringify(Array.from(acceptedRoomsRef.current)));

    stompRef.current.send(
      "/app/support.agent.disconnect",
      {},
      JSON.stringify({ roomId: activeRoom })
    );

    // ✅ activeRoom 초기화
    setActiveRoom(null);
  }, [activeRoom]);

  // 대화 내용 삭제
  const clearLogs = useCallback(() => {
    if (window.confirm('대화 내용을 삭제하시겠습니까?\n(유저 화면에는 영향이 없습니다)')) {
      setLogs([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 md:px-14" style={{ maxWidth: '1440px' }}>
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-8 gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">실시간 상담</h1>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={clearLogs}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
            >
              🗑️ 대화 삭제
            </button>
            {activeRoom && isUserConnected && (
              <button
                onClick={() => {
                  if (window.confirm('연결을 해제하시겠습니까?')) {
                    disconnectFromUser();
                  }
                }}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                해제하기
              </button>
            )}
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 대기 큐 */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">대기 요청</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {queue.length}건
                </span>
              </div>

              {queue.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  대기중인 요청이 없습니다.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {queue.map((q) => (
                    <div key={q.roomId} className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {q.userName}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            ({q.userNickname})
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-1">
                            {q.roomId}
                          </div>
                        </div>
                        <button
                          onClick={() => accept(q.roomId)}
                          className="text-xs px-3 py-2 rounded-lg text-white whitespace-nowrap hover:opacity-90 transition"
                          style={{ backgroundColor: '#006AFF' }}
                        >
                          수락
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 대화창 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-300px)] md:h-[600px]">
              {/* 대화창 헤더 */}
              <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">대화창</h3>
                    {activeRoom && isUserConnected && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        ● 연결됨
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm">대화 로그가 없습니다</p>
                      <p className="text-xs mt-1">대기 큐에서 상담을 수락하세요</p>
                    </div>
                  </div>
                ) : (
                  logs.map((l, i) => {
                    const isSystem = l.startsWith('[시스템]') || l.startsWith('[SYS]');
                    const isAdmin = l.startsWith('[나]') || l.startsWith('[ADMIN]');
                    const isUser = l.startsWith('[USER]');

                    if (isSystem) {
                      return (
                        <div key={i} className="flex justify-center">
                          <div className="rounded-lg px-4 py-2 shadow-sm max-w-md" style={{ backgroundColor: '#D6E4F0' }}>
                            <p className="text-sm text-gray-700 text-center">{l.replace(/\[(시스템|SYS)\]\s*/, '')}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className={`flex items-start gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        {!isAdmin && (
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 0116 0H4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        <div className={`flex flex-col max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'}`}>
                          {!isAdmin && (
                            <span className="text-xs font-semibold text-gray-700 mb-1 ml-1">
                              {isUser ? '유저' : '알 수 없음'}
                            </span>
                          )}

                          <div
                            className={`px-4 py-2.5 text-sm rounded-2xl break-words shadow-sm ${isAdmin
                              ? 'text-white rounded-tr-sm'
                              : 'bg-gray-50 text-gray-800 rounded-tl-sm'
                              }`}
                            style={isAdmin ? { backgroundColor: '#006AFF' } : {}}
                          >
                            {l.replace(/\[(나|ADMIN|USER|.*?)\]\s*/, '')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 입력 영역 */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      // 한글 입력 중복 방지
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter" && isUserConnected) sendToRoom();
                    }}
                    placeholder={
                      activeRoom
                        ? (isUserConnected ? "메시지를 입력하세요" : "유저가 연결 해제되었습니다")
                        : "방 수락 후 입력 가능"
                    }
                    disabled={!activeRoom || !isUserConnected}
                    className="flex-1 px-3 py-2 rounded-lg border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-200 disabled:text-gray-400"
                  />
                  <button
                    onClick={sendToRoom}
                    disabled={!activeRoom || !input.trim() || !isUserConnected}
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
                      className="w-6 h-6 rotate-[5deg]"
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
      </div>
    </div>
  );
};

export default LiveSupport;