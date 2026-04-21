import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { socket } from '../../src/lib/socket';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function MatchTableScreen() {
  const { match, setMatch, userId } = useSessionStore();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [voteDeadline, setVoteDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (!voteDeadline) return;
      setSecondsLeft(Math.max(0, Math.ceil((voteDeadline - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [voteDeadline]);

  useEffect(() => {
    const onState = (state: any) => setMatch(state);
    socket.on('room:state', onState);
    socket.on('round:vote_options', ({ options, deadlineTs }) => {
      setCategories(options);
      setVoteDeadline(deadlineTs);
    });
    socket.on('round:question_shown', () => router.push('/match/question'));
    socket.on('match:ended', () => router.replace('/match/result'));
    return () => {
      socket.off('room:state', onState);
      socket.off('round:vote_options');
    };
  }, [router, setMatch]);

  const me = useMemo(() => match?.players.find((p) => p.userId === userId), [match, userId]);
  const canVote = match?.round.targetUserId !== userId && me?.isAlive;

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Arcade Table</Text>
      <Text style={{ color: 'white' }}>Round: {match?.round.roundNumber}</Text>
      <Text style={{ color: 'white' }}>Spinner target: {match?.round.targetUserId}</Text>
      <Text style={{ color: '#a9a3d1' }}>Vote timer: {secondsLeft}s</Text>
      <Text style={{ color: 'white' }}>You: {me?.nickname} ({me?.isAlive ? 'Alive' : 'Eliminated'})</Text>
      <View style={{ marginTop: 16 }}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            disabled={!canVote}
            style={{ backgroundColor: '#282347', padding: 10, borderRadius: 8, marginBottom: 8, opacity: canVote ? 1 : 0.5 }}
            onPress={() => socket.emit('round:submit_vote', { matchId: match!.matchId, userId, categoryId: c.id })}
          >
            <Text style={{ color: 'white' }}>Vote: {c.name}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
