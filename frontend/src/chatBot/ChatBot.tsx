import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";

/**
 * 사용자는 이 화면에서:
 *  - 메시지 전송: /app/support.send/{roomId}
 *  - 수신: /topic/rooms/{roomId}
 *  - 상담사 연결 요청: /app/support.handoff/{roomId}
 * 헤더 Authorization: Bearer {JWT} 가 필요하면, connectHeaders로 주입
 */
const ChatBot: React.FC = () => {
  // ✅ roomId는 세션 단위로 고정. 새로고침 시 새로 발급
  const roomId = useMemo(() => crypto.randomUUID(), []);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'BOT'|'USER'|'AGENT'|'SYS', text: string}>>([
    { role: 'BOT', text: '안녕하세요 반갑습니다.' },
    { role: 'BOT', text: '아래 내용이 궁금하다면 클릭하여 빠르게 안내를 받아 보세요.' },
  ]);

  const stompRef = useRef<CompatClient | null>(null);

  useEffect(() => {
    const sock = new SockJS("/ws");
    const client = Stomp.over(sock);
    // 개발 중 콘솔 소음 줄이기
    (client as any).debug = () => {};

    // JWT가 있다면 여기에 주입
    const token = localStorage.getItem("accessToken"); // 프로젝트에 맞게 조정
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    client.connect(
      headers,
      () => {
        stompRef.current = client;

        // 내 방 구독
        client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
          try {
            const body = JSON.parse(frame.body);
            if (body.type === "HANDOFF_REQUESTED") {
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사 연결을 요청했습니다. 잠시만 기다려주세요.' }]);
            } else if (body.type === "HANDOFF_ACCEPTED") {
              setMessages(prev => [...prev, { role: 'SYS', text: '상담사가 연결되었습니다. 지금부터 실시간 상담이 가능합니다.' }]);
            } else {
              // 일반 에코 메시지
              const role = (body.role as 'BOT'|'USER'|'AGENT') ?? 'BOT';
              const text = (body.text as string) ?? '';
              if (text) setMessages(prev => [...prev, { role, text }]);
            }
          } catch {
            // 서버가 단순 문자열을 보낼 수도 있음(ChatService.send에서 content만 보낼 때)
            if (frame.body) setMessages(prev => [...prev, { role: 'BOT', text: frame.body }]);
          }
        });

        // 큐(상담사용)는 사용자 화면에선 불필요
      },
      (err) => {
        console.error("STOMP error:", err);
      }
    );

    return () => {
      try { client.disconnect(() => {}); } catch {}
    };
  }, [roomId]);

  const sendText = () => {
    if (!stompRef.current || !input.trim()) return;
    // 화면에 먼저 반영
    setMessages(prev => [...prev, { role: 'USER', text: input }]);

    // 서버에 전송
    stompRef.current.send(
      `/app/support.send/${roomId}`,
      {},
      JSON.stringify({ type: "TEXT", role: "USER", text: input })
    );
    setInput("");
  };

  const requestHandoff = () => {
    if (!stompRef.current) return;
    // 상담사 큐 알림 + 내 방에 ACK
    stompRef.current.send(
      `/app/support.handoff/${roomId}`,
      {},
      JSON.stringify({ userName: "user" })
    );

    // (선택) REST로도 생성 이벤트 찍고 싶으면 다음을 병행
    // fetch("/api/handoff", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ roomId, userId:"user", message:"상담 요청" }) });

    setMessages(prev => [...prev, { role: 'SYS', text: '상담사 연결을 요청했어요.' }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 제목 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">고객지원센터</h1>

        {/* 채팅 영역 */}
        <div className="bg-gray-100 rounded-lg p-6 min-h-[600px] flex flex-col">
          {/* 메시지 영역 */}
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

            {/* 옵션 버튼들 */}
            <div className="ml-13 space-y-2">
              <button className="block w-35 text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition">
                자주 묻는 질문 1
              </button>
              <button className="block w-35 text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition">
                자주 묻는 질문 2
              </button>
              <button className="block w-35 text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition">
                자주 묻는 질문 3
              </button>
              <button className="block w-35 text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition">
                자주 묻는 질문 4
              </button>

              {/* ✅ 상담사 연결하기 */}
              <button
                onClick={requestHandoff}
                className="block w-35 text-left bg-white hover:bg-gray-50 rounded-lg px-4 py-3 shadow-sm text-sm text-gray-700 transition"
              >
                상담사 연결하기
              </button>
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') sendText(); }}
              placeholder="문의 사항을 남겨주세요"
              className="w-full bg-white border border-gray-300 rounded-full px-6 py-4 pr-14 text-sm focus:outline-none"
            />
            <button
              onClick={sendText}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 개발용: 방번호 확인 */}
        <div className="text-xs text-gray-400 mt-2">roomId: {roomId}</div>
      </div>
    </div>
  );
};

export default ChatBot;
