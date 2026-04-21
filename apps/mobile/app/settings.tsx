import { Text } from 'react-native';
import { Screen } from '../src/components/Screen';

export default function SettingsScreen() {
  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Settings</Text>
      <Text style={{ color: '#aaa' }}>Haptics and sound placeholders for beta.</Text>
    </Screen>
  );
}
