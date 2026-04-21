import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function MatchResultScreen() {
  const router = useRouter();
  const match = useSessionStore((s) => s.match);

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Match Ended</Text>
      <Text style={{ color: 'white' }}>Winner: {match?.winnerUserId ?? 'TBD'}</Text>
      <PrimaryButton title="Home" onPress={() => router.replace('/home')} />
    </Screen>
  );
}
