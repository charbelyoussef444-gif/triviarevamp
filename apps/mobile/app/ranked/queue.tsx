import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { socket } from '../../src/lib/socket';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function RankedQueueScreen() {
  const { userId, nickname, setMatch } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    const onFound = (state: any) => {
      setMatch(state);
      router.replace('/match/table');
    };
    socket.on('match:found', onFound);
    return () => socket.off('match:found', onFound);
  }, [router, setMatch]);

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Ranked Queue</Text>
      <PrimaryButton title="Join Queue" onPress={() => socket.emit('match:queue_join', { userId, nickname, rating: 1000 })} />
    </Screen>
  );
}
