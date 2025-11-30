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
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">실시간 상담</h2>
        <button
          onClick={clearLogs}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition"
        >
          🗑️ 대화 내용 삭제
        </button>
      </div>

      {/* 디버그 정보 */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
        <div>WebSocket 상태: {stompRef.current?.connected ? '✅ 연결됨' : '❌ 미연결'}</div>
        <div>대기 큐: {queue.length}건</div>
        <div>활성 방: {activeRoom || '없음'}</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 대기 큐 */}
        <div className="col-span-1 bg-white border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">대기 요청</h3>
            <span className="text-xs text-gray-500">{queue.length}건</span>
          </div>
          {queue.length === 0 ? (
            <div className="text-sm text-gray-500">대기중인 요청이 없습니다.</div>
          ) : (
            <ul className="space-y-2">
              {queue.map((q) => (
                <li key={q.roomId} className="border rounded p-2 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {q.userName} ({q.userNickname})
                      </div>
                      <div className="text-xs text-gray-500 truncate">{q.roomId}</div>
                    </div>
                    <button
                      onClick={() => accept(q.roomId)}
                      className="text-xs px-3 py-1 rounded bg-black text-white whitespace-nowrap hover:bg-gray-800"
                    >
                      수락
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 활성 방 */}
        <div className="col-span-2 bg-white border rounded p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">대화창</h3>
            <div className="text-xs text-gray-500">
              {activeRoom ? `roomId: ${activeRoom}` : "선택된 방 없음"}
            </div>
          </div>

          {activeRoom && (
            <div className={`mb-2 px-3 py-2 rounded text-sm ${isUserConnected
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
              {isUserConnected ? '✅ 유저 연결됨' : '❌ 유저 연결 해제됨'}
            </div>
          )}

          <div className="flex-1 border rounded p-2 overflow-y-auto text-sm bg-gray-50 min-h-[400px]">
            {logs.length === 0 ? (
              <div className="text-gray-500">대화 로그가 없습니다.</div>
            ) : (
              logs.map((l, i) => <div key={i} className="py-0.5">{l}</div>)
            )}
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-2 py-2 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isUserConnected) sendToRoom();
                }}
                placeholder={
                  activeRoom
                    ? (isUserConnected ? "메시지를 입력하세요" : "유저가 연결 해제되었습니다")
                    : "방 수락 후 입력 가능"
                }
                disabled={!activeRoom || !isUserConnected}
              />
              <button
                onClick={sendToRoom}
                disabled={!activeRoom || !input.trim() || !isUserConnected}
                className={`px-4 py-2 rounded text-sm ${activeRoom && input.trim() && isUserConnected
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
              >
                보내기
              </button>
            </div>

            {activeRoom && isUserConnected && (
              <button
                onClick={disconnectFromUser}
                className="w-full px-4 py-2 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
              >
                연결 해제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSupport;