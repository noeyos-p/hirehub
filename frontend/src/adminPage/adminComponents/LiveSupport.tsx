import React, { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

/**
 * 어드민(상담사) 화면:
 * - 대기 큐 구독: /topic/support.queue
 * - 수락: /app/support.handoff.accept  (body: { roomId })
 * - 방 메시지 구독: /topic/rooms/{roomId}
 * - 방으로 전송: /app/support.send/{roomId}
 *
 * JWT가 필요하다면 localStorage의 adminAccessToken을 Authorization 헤더로 사용합니다.
 */
const LiveSupport: React.FC = () => {
  const [queue, setQueue] = useState<Array<{ roomId: string; userName: string }>>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const stompRef = useRef<CompatClient | null>(null);
  const roomSubRef = useRef<{ unsubscribe: () => void } | null>(null);

  // STOMP 연결
  useEffect(() => {
    const sock = new SockJS("/ws"); // 백엔드 WebSocketConfig에서 /ws endpoint 사용
    const client = Stomp.over(sock);
    (client as any).debug = () => {}; // 콘솔 로그 억제

    // 어드민 JWT (프로젝트 정책에 맞게 보관 키 바꾸세요)
    const token = localStorage.getItem("adminAccessToken");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    client.connect(
      headers,
      () => {
        stompRef.current = client;

        // 상담사 대기 큐 구독
        client.subscribe("/topic/support.queue", (frame) => {
          try {
            const body = JSON.parse(frame.body);
            if (body.event === "HANDOFF_REQUESTED" && body.roomId) {
              setQueue((prev) => {
                if (prev.some((q) => q.roomId === body.roomId)) return prev;
                return [...prev, { roomId: body.roomId, userName: body.userName ?? "user" }];
              });
            }
          } catch (e) {
            console.warn("queue parse error", e);
          }
        });
      },
      (err) => console.error("STOMP error:", err)
    );

    return () => {
      try {
        client.disconnect(() => {});
      } catch {}
    };
  }, []);

  // 특정 room 구독 교체
  const subscribeRoom = (roomId: string) => {
    if (!stompRef.current) return;

    // 기존 구독 해제
    if (roomSubRef.current) {
      try {
        roomSubRef.current.unsubscribe();
      } catch {}
      roomSubRef.current = null;
    }

    // 새 방 구독
    roomSubRef.current = stompRef.current.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      try {
        const body = JSON.parse(frame.body);
        if (body.type === "HANDOFF_ACCEPTED") {
          setLogs((prev) => [...prev, `[SYS] ${roomId} 상담 연결됨`]);
        } else if (body.text) {
          const role = body.role ?? "UNKNOWN";
          setLogs((prev) => [...prev, `[MSG:${role}] ${body.text}`]);
        }
      } catch {
        if (frame.body) setLogs((prev) => [...prev, `[RAW] ${frame.body}`]);
      }
    });
  };

  const accept = (roomId: string) => {
    if (!stompRef.current) return;

    // 상담사 수락
    stompRef.current.send("/app/support.handoff.accept", {}, JSON.stringify({ roomId }));

    // 활성 방 설정 + 대기 큐에서 제거 + 로그 초기화 옵션(원하면 유지)
    setActiveRoom(roomId);
    setQueue((prev) => prev.filter((q) => q.roomId !== roomId));
    setLogs((prev) => [...prev, `[SYS] 방 수락: ${roomId}`]);

    // 방 구독
    subscribeRoom(roomId);
  };

  const sendToRoom = () => {
    if (!stompRef.current || !activeRoom || !input.trim()) return;

    stompRef.current.send(
      `/app/support.send/${activeRoom}`,
      {},
      JSON.stringify({ type: "TEXT", role: "AGENT", text: input })
    );
    setLogs((prev) => [...prev, `[ME] ${input}`]);
    setInput("");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">실시간 상담</h2>

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
                      <div className="text-sm font-medium truncate">{q.userName}</div>
                      <div className="text-xs text-gray-500 truncate">{q.roomId}</div>
                    </div>
                    <button
                      onClick={() => accept(q.roomId)}
                      className="text-xs px-3 py-1 rounded bg-black text-white whitespace-nowrap"
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

          <div className="flex-1 border rounded p-2 overflow-y-auto text-sm bg-gray-50">
            {logs.length === 0 ? (
              <div className="text-gray-500">대화 로그가 없습니다.</div>
            ) : (
              logs.map((l, i) => <div key={i} className="py-0.5">{l}</div>)
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendToRoom();
              }}
              placeholder={activeRoom ? "메시지를 입력하세요" : "방 수락 후 입력 가능"}
              disabled={!activeRoom}
            />
            <button
              onClick={sendToRoom}
              disabled={!activeRoom || !input.trim()}
              className={`px-4 py-2 rounded text-sm ${
                activeRoom && input.trim()
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSupport;
