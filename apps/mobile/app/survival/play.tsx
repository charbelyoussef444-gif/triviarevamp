import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, Pressable, ActivityIndicator } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { startSurvival, submitSurvivalAnswer } from '../../src/lib/api';
import { useSessionStore } from '../../src/store/useSessionStore';

type SurvivalPayload = {
  sessionId: string;
  status: 'ongoing' | 'ended';
  score: number;
  roundsSurvived: number;
  streak: number;
  bestStreak: number;
  wrongEvents: number;
  dangerMeter: number;
  deadlineTs?: number;
  question?: {
    id: string;
    prompt: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    categoryId: string;
  };
  roundResult?: { correct: boolean; timedOut: boolean; eliminated: boolean; chance: number };
};

export default function SurvivalPlayScreen() {
  const { nickname } = useSessionStore();
  const router = useRouter();
  const [session, setSession] = useState<SurvivalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    let mounted = true;
    startSurvival({ nickname }).then((res) => {
      if (!mounted) return;
      setSession(res);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [nickname]);

  useEffect(() => {
    if (!session?.deadlineTs) return;
    const timer = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((session.deadlineTs! - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [session?.deadlineTs]);

  const options = useMemo(
    () =>
      session?.question
        ? [
            ['A', session.question.optionA],
            ['B', session.question.optionB],
            ['C', session.question.optionC],
            ['D', session.question.optionD],
          ]
        : [],
    [session?.question],
  );

  const onSubmit = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (!session) return;
    const res = await submitSurvivalAnswer({ sessionId: session.sessionId, option });
    if (!res.ok) return;
    setSession(res);
    if (res.status === 'ended') {
      router.replace({
        pathname: '/survival/result',
        params: {
          score: String(res.score),
          rounds: String(res.roundsSurvived),
          bestStreak: String(res.bestStreak),
          danger: String(res.dangerMeter),
        },
      });
    }
  };

  if (loading || !session) {
    return (
      <Screen>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: 'white', marginTop: 12 }}>Starting survival session...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Survival Arena</Text>
      <Text style={{ color: 'white' }}>Score: {session.score}</Text>
      <Text style={{ color: 'white' }}>Rounds survived: {session.roundsSurvived}</Text>
      <Text style={{ color: 'white' }}>Streak: {session.streak}</Text>
      <Text style={{ color: '#ff88aa' }}>Danger meter: {session.dangerMeter}%</Text>
      <Text style={{ color: '#b7b2d8' }}>Timer: {secondsLeft}s</Text>
      {!!session.roundResult && (
        <Text style={{ color: session.roundResult.correct ? '#80ffb0' : '#ff96b5' }}>
          {session.roundResult.correct
            ? 'Correct! You stay in.'
            : session.roundResult.timedOut
              ? 'Time expired. You were knocked out.'
              : session.roundResult.eliminated
                ? 'Wrong answer and knocked out.'
                : 'Wrong answer, but you survived the chamber risk.'}
        </Text>
      )}
      <Text style={{ color: 'white', marginTop: 12 }}>{session.question?.prompt}</Text>
      {options.map(([label, value]) => (
        <Pressable
          key={label}
          onPress={() => onSubmit(label as 'A' | 'B' | 'C' | 'D')}
          style={{ marginTop: 10, backgroundColor: '#282347', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>
            {label}: {value}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}
