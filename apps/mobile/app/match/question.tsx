import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, Pressable } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { socket } from '../../src/lib/socket';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function QuestionScreen() {
  const { match, userId } = useSessionStore();
  const [question, setQuestion] = useState<any>(match?.round.question);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline) return;
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    const onQuestion = ({ question: incoming, deadlineTs }: any) => {
      setQuestion(incoming);
      setDeadline(deadlineTs);
    };
    socket.on('round:question_shown', onQuestion);
    socket.on('round:answer_result', () => router.replace('/match/round-result'));
    return () => {
      socket.off('round:question_shown', onQuestion);
      socket.off('round:answer_result');
    };
  }, [router]);

  if (!match || !question) {
    return (
      <Screen>
        <Text style={{ color: 'white' }}>Loading question...</Text>
      </Screen>
    );
  }

  const isTarget = match.round.targetUserId === userId;

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 20 }}>{question.prompt}</Text>
      <Text style={{ color: '#a9a3d1' }}>Answer timer: {secondsLeft}s</Text>
      {(['A', 'B', 'C', 'D'] as const).map((key) => (
        <Pressable
          key={key}
          disabled={!isTarget}
          style={{ backgroundColor: '#282347', padding: 12, marginTop: 10, borderRadius: 8, opacity: isTarget ? 1 : 0.5 }}
          onPress={() => socket.emit('round:submit_answer', { matchId: match.matchId, userId, option: key })}
        >
          <Text style={{ color: 'white' }}>
            {key}: {question[`option${key}`]}
          </Text>
        </Pressable>
      ))}
      {!isTarget && <Text style={{ color: '#aaa', marginTop: 12 }}>Waiting for target player...</Text>}
    </Screen>
  );
}
