import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { socket } from '../../src/lib/socket';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function JoinRoomScreen() {
  const [roomCode, setCode] = useState('');
  const router = useRouter();
  const { userId, nickname, setRoomCode } = useSessionStore();

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Join Room</Text>
      <TextInput value={roomCode} onChangeText={setCode} autoCapitalize="characters" style={{ backgroundColor: '#222', color: 'white', padding: 12, borderRadius: 8 }} />
      <PrimaryButton
        title="Join"
        onPress={() => {
          const code = roomCode.trim().toUpperCase();
          socket.emit('room:join', { userId, nickname, roomCode: code }, (res) => {
            if (res.ok) {
              setRoomCode(code);
              router.push('/friends/lobby');
            }
          });
        }}
      />
    </Screen>
  );
}
