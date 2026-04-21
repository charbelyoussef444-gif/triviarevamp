import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';

export default function SplashScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: '700', marginBottom: 24 }}>Trivia Revamp</Text>
      <PrimaryButton title="Continue" onPress={() => router.push('/onboarding')} />
    </Screen>
  );
}
