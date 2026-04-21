import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Screen } from '../src/components/Screen';
import { getRankedLeaderboard, getSurvivalLeaderboard } from '../src/lib/api';
import { useSessionStore } from '../src/store/useSessionStore';

export default function LeaderboardScreen() {
  const { leaderboard, setLeaderboard } = useSessionStore();
  const [ranked, setRanked] = useState<Array<{ userId: string; nickname: string; rating: number; wins: number; matches: number }>>([]);

  useEffect(() => {
    getSurvivalLeaderboard().then((res) => {
      if (res.ok) setLeaderboard(res.rows);
    });
    getRankedLeaderboard().then((res) => {
      if (res.ok) setRanked(res.rows);
    });
  }, [setLeaderboard]);

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Survival Leaderboard</Text>
      {leaderboard.map((row, idx) => (
        <Text key={`${row.nickname}-${idx}`} style={{ color: 'white' }}>
          {idx + 1}. {row.nickname} • score {row.score} • rounds {row.roundsSurvived}
        </Text>
      ))}

      <Text style={{ color: 'white', fontSize: 24, marginTop: 20 }}>Ranked Leaderboard</Text>
      {ranked.map((row, idx) => (
        <Text key={row.userId} style={{ color: 'white' }}>
          {idx + 1}. {row.nickname} • rating {row.rating} • {row.wins}/{row.matches}
        </Text>
      ))}
    </Screen>
  );
}
