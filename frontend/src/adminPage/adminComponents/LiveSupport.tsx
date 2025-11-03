import React, { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

/**
 * 어드민(상담사) 화면
 */
const LiveSupport: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  
  const [queue, setQueue] = useState<Array<{ roomId: string; userName: string; userNickname?: string }>>([]);

  // ✅ 활성 방 정보를 localStorage에 저장하여 브라우저 종료 후에도 유지
  const [activeRoom, setActiveRoom] = useState<string | null>(() => {
    return localStorage.getItem('agent-activeRoom');
  });

  // ✅ 로그도 localStorage에 저장
  const [logs, setLogs] = useState<string[]>(() => {
    const stored = localStorage.getItem('agent-logs');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [input, setInput] = useState("");

  // ✅ 유저 연결 상태도 localStorage에 저장
  const [isUserConnected, setIsUserConnected] = useState(() => {
    const stored = localStorage.getItem('agent-isUserConnected');
    return stored === 'true';
  });

  const stompRef = useRef<CompatClient | null>(null);
  const roomSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);

  // ✅ 상태 변경 시 localStorage에 저장
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

  // STOMP 연결
  useEffect(() => {
    console.log("🔌 상담사 WebSocket 연결 시작...");
    console.log("📍 API_BASE_URL:", API_BASE_URL);
    
    const wsUrl = API_BASE_URL ? `${API_BASE_URL}/ws` : "/ws";
    console.log("📍 WebSocket URL:", wsUrl);
    
    const sock = new SockJS(wsUrl);
    const client = Stomp.over(sock);
    
    // 디버그 활성화 (개발 중)
    client.debug = (str) => {
      console.log("🔧 STOMP:", str);
    };

    // ✅ 토큰 가져오기 (adminAccessToken 또는 accessToken)
    const token = localStorage.getItem("adminAccessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token");
    console.log("🔑 사용할 토큰:", token ? "있음" : "없음");
    
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    client.connect(
      headers,
      () => {
        stompRef.current = client;
        console.log("✅ 상담사 WebSocket 연결 성공!");

        // 상담사 대기 큐 구독
        console.log("📡 /topic/support.queue 구독 중...");
        client.subscribe("/topic/support.queue", (frame) => {
          try {
            const body = JSON.parse(frame.body);
            const messageId = `queue-${body.event}-${body.roomId}-${Date.now()}`;

            console.log("📩 큐 메시지 받음:", body);

            if (processedMessagesRef.current.has(messageId)) {
              console.log("🚫 큐 중복 메시지 무시:", messageId);
              return;
            }
            processedMessagesRef.current.add(messageId);

            if (body.event === "HANDOFF_REQUESTED" && body.roomId) {
              console.log("✅ 핸드오프 요청 수신:", {
                roomId: body.roomId,
                userName: body.userName,
                userNickname: body.userNickname
              });
              
              setQueue(prev => {
                // 중복 방지
                const exists = prev.some(q => q.roomId === body.roomId);
                if (exists) {
                  console.log("⚠️ 이미 큐에 있는 roomId:", body.roomId);
                  return prev;
                }
                
                console.log("➕ 큐에 추가:", body.roomId);
                return [...prev, {
                  roomId: body.roomId,
                  userName: body.userName || "user",
                  userNickname: body.userNickname || "user"
                }];
              });
            } else if (body.event === "USER_DISCONNECTED" && body.roomId) {
              console.log("📌 유저 연결 해제 - 큐에서 제거:", body.roomId);
              setQueue(prev => prev.filter(q => q.roomId !== body.roomId));
            }
          } catch (e) {
            console.error("❌ 큐 메시지 파싱 오류:", e);
          }
        });

        // ✅ 새로고침 후 재연결 시 활성 방이 있으면 다시 구독
        if (activeRoom) {
          console.log("🔄 새로고침 후 방 재구독:", activeRoom);
          subscribeRoom(activeRoom);

          if (!isInitialMount.current) {
            setLogs((prev) => [...prev, `[SYS] 연결이 복원되었습니다.`]);
          }
        }

        isInitialMount.current = false;
        
        console.log("✅ 상담사 WebSocket 초기화 완료");
      },
      (err) => {
        console.error("❌ STOMP 연결 오류:", err);
        setLogs(prev => [...prev, `[ERROR] WebSocket 연결 실패: ${err}`]);
      }
    );

    return () => {
      console.log("🔌 상담사 WebSocket 연결 종료");
      try {
        client.disconnect(() => {
          console.log("✅ STOMP 연결 해제 완료");
        });
      } catch (e) {
        console.error("❌ 연결 해제 오류:", e);
      }
    };
  }, [API_BASE_URL]);

  // 특정 room 구독
  const subscribeRoom = (roomId: string) => {
    if (!stompRef.current) {
      console.error("❌ STOMP 클라이언트가 없습니다!");
      return;
    }

    console.log("📡 방 구독 시작:", roomId);

    if (roomSubRef.current) {
      try {
        console.log("🔄 기존 구독 해제 중...");
        roomSubRef.current.unsubscribe();
      } catch (e) {
        console.error("❌ 구독 해제 오류:", e);
      }
      roomSubRef.current = null;
    }

    roomSubRef.current = stompRef.current.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      try {
        const body = JSON.parse(frame.body);
        const messageId = `agent-room-${body.type}-${body.role}-${body.text}-${Date.now()}`;

        console.log("📩 방 메시지 받음:", body);

        if (processedMessagesRef.current.has(messageId)) {
          console.log("🚫 방 중복 메시지 무시:", messageId);
          return;
        }
        processedMessagesRef.current.add(messageId);

        if (body.type === "HANDOFF_ACCEPTED") {
          const userName = body.userName || "user";
          const userNickname = body.userNickname || "user";
          console.log("✅ 핸드오프 수락 완료:", { userName, userNickname });
          setLogs((prev) => [...prev, `[SYS] [${userName} (${userNickname})] 상담 연결됨`]);
          setIsUserConnected(true);
        } else if (body.type === "USER_DISCONNECTED") {
          console.log("📩 유저 연결 해제");
          setIsUserConnected(false);
          setLogs((prev) => [...prev, `[SYS] 유저가 연결을 해제했습니다.`]);
        } else if (body.type === "AGENT_DISCONNECTED") {
          console.log("📩 상담사 연결 해제");
          setIsUserConnected(false);
        } else if (body.text) {
          const role = body.role ?? "UNKNOWN";
          if (role === "AGENT") {
            setLogs((prev) => [...prev, `[나] ${body.text}`]);
          } else {
            setLogs((prev) => [...prev, `[${role}] ${body.text}`]);
          }
        }
      } catch (e) {
        console.error("❌ 방 메시지 파싱 오류:", e);
        if (frame.body) setLogs((prev) => [...prev, `[RAW] ${frame.body}`]);
      }
    });

    console.log("✅ 방 구독 완료:", roomId);
  };

  const accept = (roomId: string) => {
    const request = queue.find(q => q.roomId === roomId);
    if (!request || !stompRef.current) {
      console.error("❌ 수락 실패: 요청을 찾을 수 없거나 STOMP 미연결");
      return;
    }

    console.log("✅ 수락 버튼 클릭:", { 
      roomId, 
      userName: request.userName, 
      userNickname: request.userNickname 
    });

    // 서버에 accept 전송
    console.log("📤 핸드오프 수락 전송 중...");
    stompRef.current.send(
      `/app/support.handoff.accept`,
      {},
      JSON.stringify({ roomId })
    );

    // 즉시 UI 업데이트
    setActiveRoom(roomId);
    setLogs(prev => [...prev, 
      `[SYS] [${request.userName} (${request.userNickname})] 상담 연결 중...`
    ]);
    setIsUserConnected(true);
    
    // ✅ 큐에서 제거
    setQueue(prev => prev.filter(q => q.roomId !== roomId));
    
    subscribeRoom(roomId);
    
    console.log("✅ 수락 처리 완료");
  };

  const sendToRoom = () => {
    if (!stompRef.current || !activeRoom || !input.trim() || !isUserConnected) {
      console.warn("⚠️ 메시지 전송 불가:", {
        hasClient: !!stompRef.current,
        hasRoom: !!activeRoom,
        hasInput: !!input.trim(),
        isConnected: isUserConnected
      });
      return;
    }

    console.log("📤 메시지 전송:", input);
    
    stompRef.current.send(
      `/app/support.send/${activeRoom}`,
      {},
      JSON.stringify({ type: "TEXT", role: "AGENT", text: input })
    );

    setInput("");
  };

  const disconnectFromUser = () => {
    if (!stompRef.current || !activeRoom) {
      console.warn("⚠️ 연결 해제 불가");
      return;
    }

    console.log("🔌 상담사 연결 해제:", activeRoom);

    setIsUserConnected(false);
    setLogs((prev) => [...prev, `[SYS] 연결을 해제했습니다.`]);

    stompRef.current.send(
      "/app/support.agent.disconnect",
      {},
      JSON.stringify({ roomId: activeRoom })
    );
  };

  // ✅ 대화 내용 삭제 (본인 화면에서만)
  const clearLogs = () => {
    if (window.confirm('대화 내용을 삭제하시겠습니까?\n(유저 화면에는 영향이 없습니다)')) {
      setLogs([]);
      console.log("🗑️ 대화 내용 삭제됨");
    }
  };

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
        <div>WebSocket 상태: {stompRef.current ? '✅ 연결됨' : '❌ 미연결'}</div>
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