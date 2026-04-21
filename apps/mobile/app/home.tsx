import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 26, fontWeight: '700' }}>Select Mode</Text>
      <PrimaryButton title="Play with Friends" onPress={() => router.push('/friends/create')} />
      <PrimaryButton title="Ranked" onPress={() => router.push('/ranked/queue')} />
      <PrimaryButton title="Survival" onPress={() => router.push('/survival/play')} />
      <PrimaryButton title="Leaderboard" onPress={() => router.push('/leaderboard')} />
      <PrimaryButton title="Settings" onPress={() => router.push('/settings')} />
    </Screen>
  );
}
