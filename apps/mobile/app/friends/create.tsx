import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { socket } from '../../src/lib/socket';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function CreateRoomScreen() {
  const router = useRouter();
  const { userId, nickname, setRoomCode } = useSessionStore();

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Create Friends Room</Text>
      <PrimaryButton
        title="Create Room"
        onPress={() => {
          socket.emit('room:create', { userId, nickname, mode: 'friends' }, (res) => {
            if (res.ok && res.roomCode) {
              setRoomCode(res.roomCode);
              router.push('/friends/lobby');
            }
          });
        }}
      />
      <PrimaryButton title="Join Existing" onPress={() => router.push('/friends/join')} />
    </Screen>
  );
}
