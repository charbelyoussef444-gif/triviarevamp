const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

export async function startSurvival(payload: { nickname: string }) {
  const res = await fetch(`${baseUrl}/survival/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function submitSurvivalAnswer(payload: { sessionId: string; option: 'A' | 'B' | 'C' | 'D' }) {
  const res = await fetch(`${baseUrl}/survival/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getSurvivalLeaderboard() {
  const res = await fetch(`${baseUrl}/leaderboard/survival`);
  return res.json();
}

export async function getRankedLeaderboard() {
  const res = await fetch(`${baseUrl}/leaderboard/ranked`);
  return res.json();
}
