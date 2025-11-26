export async function sendAiMessage(message: string) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.answer as string;
}
