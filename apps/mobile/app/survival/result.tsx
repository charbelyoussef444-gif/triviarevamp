import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function SurvivalResultScreen() {
  const params = useLocalSearchParams<{ score: string; rounds: string; bestStreak: string; danger: string }>();
  const router = useRouter();
  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Session Complete</Text>
      <Text style={{ color: 'white' }}>Final score: {params.score}</Text>
      <Text style={{ color: 'white' }}>Rounds survived: {params.rounds}</Text>
      <Text style={{ color: 'white' }}>Best streak: {params.bestStreak}</Text>
      <Text style={{ color: '#ff88aa' }}>Final danger meter: {params.danger}%</Text>
      <PrimaryButton title="Play Again" onPress={() => router.replace('/survival/play')} />
      <PrimaryButton title="Leaderboard" onPress={() => router.push('/leaderboard')} />
      <PrimaryButton title="Home" onPress={() => router.replace('/home')} />
    </Screen>
  );
}
