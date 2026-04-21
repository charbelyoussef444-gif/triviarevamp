import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function RoundResultScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Round Result</Text>
      <Text style={{ color: 'white' }}>Spinner continues for next round.</Text>
      <PrimaryButton title="Back to Table" onPress={() => router.replace('/match/table')} />
    </Screen>
  );
}
