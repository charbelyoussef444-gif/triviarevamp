import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useSessionStore } from '../src/store/useSessionStore';

export default function GuestOnboarding() {
  const [nickname, setNickname] = useState('');
  const setGlobal = useSessionStore((s) => s.setNickname);
  const router = useRouter();

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 12 }}>Choose nickname</Text>
      <TextInput value={nickname} onChangeText={setNickname} style={{ backgroundColor: '#222', color: 'white', padding: 12, borderRadius: 8 }} />
      <PrimaryButton
        title="Enter"
        onPress={() => {
          setGlobal(nickname.trim() || 'Guest');
          router.replace('/home');
        }}
      />
    </Screen>
  );
}
