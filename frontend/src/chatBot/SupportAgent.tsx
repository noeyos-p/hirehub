import React, { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

/**
 * 상담사 화면
 * - 대기 큐 구독: /topic/support.queue
 * - 수락: /app/support.handoff.accept (body: { roomId })
 * - 방 메시지 구독: /topic/rooms/{roomId}
 * - 방으로 전송: /app/support.send/{roomId}
 */
const SupportAgent: React.FC = () => {
  const [queue, setQueue] = useState<Array<{roomId: string, userName: string}>>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const stompRef = useRef<CompatClient | null>(null);
  const roomSubRef = useRef<any>(null);

  useEffect(() => {
    const sock = new SockJS("/ws");
    const client = Stomp.over(sock);
    (client as any).debug = () => {};

    const token = localStorage.getItem("adminAccessToken"); // 어드민 JWT
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    client.connect(
      headers,
      () => {
        stompRef.current = client;

        // 상담사 큐 구독
        client.subscribe("/topic/support.queue", (frame) => {
          try{
            const body = JSON.parse(frame.body);
            if (body.event === "HANDOFF_REQUESTED") {
              setQueue(prev => {
                const exists = prev.some(q => q.roomId === body.roomId);
                if (exists) return prev;
                return [...prev, { roomId: body.roomId, userName: body.userName ?? 'user' }];
              });
            }
          } catch(e) {
            console.warn("queue parse error", e);
          }
        });
      },
      (err) => console.error("agent stomp error", err)
    );

    return () => {
      try { client.disconnect(()=>{}); } catch {}
    };
  }, []);

  const accept = (roomId: string) => {
    if (!stompRef.current) return;
    stompRef.current.send("/app/support.handoff.accept", {}, JSON.stringify({ roomId }));
    setActiveRoom(roomId);
    setQueue(prev => prev.filter(q => q.roomId !== roomId));

    // 방 구독 교체
    roomSubRef.current?.unsubscribe?.();
    roomSubRef.current = stompRef.current.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      try{
        const body = JSON.parse(frame.body);
        if (body.type === 'HANDOFF_ACCEPTED') {
          setLogs(prev => [...prev, `[SYS] ${roomId} 상담 연결됨`]);
        } else if (body.text) {
          setLogs(prev => [...prev, `[MSG:${body.role}] ${body.text}`]);
        }
      } catch {
        setLogs(prev => [...prev, `[RAW] ${frame.body}`]);
      }
    });
  };

  const sendToRoom = () => {
    if (!stompRef.current || !activeRoom || !input.trim()) return;
    stompRef.current.send(
      `/app/support.send/${activeRoom}`,
      {},
      JSON.stringify({ type: "TEXT", role: "AGENT", text: input })
    );
    setLogs(prev => [...prev, `[ME] ${input}`]);
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">상담사 대시보드</h2>

      <div className="grid grid-cols-3 gap-4">
        {/* 대기 큐 */}
        <div className="col-span-1 border rounded p-3 bg-white">
          <h3 className="font-semibold mb-2">대기 요청</h3>
          {queue.length === 0 && <div className="text-sm text-gray-500">대기 없음</div>}
          <ul className="space-y-2">
            {queue.map((q) => (
              <li key={q.roomId} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{q.userName}</div>
                  <div className="text-xs text-gray-500">{q.roomId}</div>
                </div>
                <button
                  onClick={()=>accept(q.roomId)}
                  className="text-sm px-2 py-1 rounded bg-black text-white"
                >
                  수락
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 활성 방 */}
        <div className="col-span-2 border rounded p-3 bg-white flex flex-col">
          <h3 className="font-semibold mb-2">활성 방</h3>
          {!activeRoom ? (
            <div className="text-sm text-gray-500">선택된 방이 없습니다.</div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-2">roomId: {activeRoom}</div>
              <div className="flex-1 border rounded p-2 overflow-y-auto text-sm mb-2">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded px-2 py-1"
                  value={input}
                  onChange={(e)=>setInput(e.target.value)}
                  onKeyDown={(e)=>{ if(e.key==='Enter') sendToRoom(); }}
                  placeholder="메시지 입력"
                />
                <button className="px-3 py-1 rounded bg-black text-white" onClick={sendToRoom}>
                  보내기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportAgent;
