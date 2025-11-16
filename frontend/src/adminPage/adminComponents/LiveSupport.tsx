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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
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
    if (!stompRef.current?.connected) {
      console.error("STOMP 클라이언트가 없습니다");
      return;
    }

    // 기존 구독 해제
    if (roomSubRef.current) {
      try {
        roomSubRef.current.unsubscribe();
      } catch (e) {
        console.error("구독 해제 오류:", e);
      }
      roomSubRef.current = null;
    }

    roomSubRef.current = stompRef.current.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      try {
        const body = JSON.parse(frame.body);
        const messageId = `agent-${body.type}-${body.role}-${body.text}`;

        if (isMessageProcessed(messageId)) return;

        handleRoomMessage(body);
      } catch (e) {
        console.error("방 메시지 파싱 오류:", e);
        if (frame.body) setLogs(prev => [...prev, `[RAW] ${frame.body}`]);
      }
    });
  }, [isMessageProcessed]);

  // 방 메시지 핸들러
  const handleRoomMessage = useCallback((body: any) => {
    switch (body.type) {
      case "HANDOFF_ACCEPTED":
        const userName = body.userName || "user";
        const userNickname = body.userNickname || "user";
        setLogs(prev => [...prev, `[SYS] [${userName} (${userNickname})] 상담 연결됨`]);
        setIsUserConnected(true);
        break;

      case "USER_DISCONNECTED":
        setIsUserConnected(false);
        setLogs(prev => [...prev, `[SYS] 유저가 연결을 해제했습니다.`]);
        break;

      case "AGENT_DISCONNECTED":
        setIsUserConnected(false);
        break;

      default:
        if (body.text) {
          const role = body.role ?? "UNKNOWN";
          const prefix = role === "AGENT" ? "[나]" : `[${role}]`;
          setLogs(prev => [...prev, `${prefix} ${body.text}`]);
        }
    }
  }, []);

  // 큐 메시지 핸들러
  const handleQueueMessage = useCallback((body: any) => {
    if (body.event === "HANDOFF_REQUESTED" && body.roomId) {
      setQueue(prev => {
        if (prev.some(q => q.roomId === body.roomId)) {
          return prev;
        }
        return [...prev, {
          roomId: body.roomId,
          userName: body.userName || "user",
          userNickname: body.userNickname || "user"
        }];
      });
    } else if (body.event === "USER_DISCONNECTED" && body.roomId) {
      setQueue(prev => prev.filter(q => q.roomId !== body.roomId));
    }
  }, []);

  // STOMP 연결
  useEffect(() => {
    const wsUrl = API_BASE_URL ? `${API_BASE_URL}/ws` : "/ws";
    const sock = new SockJS(wsUrl);
    const client = Stomp.over(sock);
    client.debug = () => {};

    const token = localStorage.getItem("adminAccessToken") || 
                  localStorage.getItem("accessToken") || 
                  localStorage.getItem("token");
    
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    client.connect(
      headers,
      () => {
        stompRef.current = client;

        // 큐 구독
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
        client.disconnect(() => {});
      } catch (e) {
        console.error("연결 해제 오류:", e);
      }
    };
  }, [API_BASE_URL, activeRoom, subscribeRoom, isMessageProcessed, handleQueueMessage]);

  // 수락 핸들러
  const accept = useCallback((roomId: string) => {
    const request = queue.find(q => q.roomId === roomId);
    if (!request || !stompRef.current?.connected) {
      console.error("수락 실패: 요청을 찾을 수 없거나 STOMP 미연결");
      return;
    }

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
    setQueue(prev => prev.filter(q => q.roomId !== roomId));
    
    subscribeRoom(roomId);
  }, [queue, subscribeRoom]);

  // 메시지 전송
  const sendToRoom = useCallback(() => {
    if (!stompRef.current?.connected || !activeRoom || !input.trim() || !isUserConnected) {
      return;
    }

    stompRef.current.send(
      `/app/support.send/${activeRoom}`,
      {},
      JSON.stringify({ type: "TEXT", role: "AGENT", text: input })
    );

    setInput("");
  }, [activeRoom, input, isUserConnected]);

  // 연결 해제
  const disconnectFromUser = useCallback(() => {
    if (!stompRef.current?.connected || !activeRoom) return;

    setIsUserConnected(false);
    setLogs(prev => [...prev, `[SYS] 연결을 해제했습니다.`]);

    stompRef.current.send(
      "/app/support.agent.disconnect",
      {},
      JSON.stringify({ roomId: activeRoom })
    );
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
            <div className={`mb-2 px-3 py-2 rounded text-sm ${
              isUserConnected
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
                className={`px-4 py-2 rounded text-sm ${
                  activeRoom && input.trim() && isUserConnected
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