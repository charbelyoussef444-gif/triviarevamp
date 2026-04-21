import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { socket } from '../../src/lib/socket';
import { useSessionStore } from '../../src/store/useSessionStore';

export default function FriendsLobbyScreen() {
  const { roomCode, userId, match, setMatch } = useSessionStore();
  const router = useRouter();
  const isHost = match?.hostUserId === userId;

  useEffect(() => {
    const onState = (state: any) => {
      setMatch(state);
      if (state.status === 'in_progress') router.replace('/match/table');
    };
    socket.on('room:state', onState);
    return () => {
      socket.off('room:state', onState);
    };
  }, [setMatch, router]);

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 24 }}>Lobby {roomCode}</Text>
      <Text style={{ color: '#a9a3d1' }}>Host starts when everyone is ready.</Text>
      <Text style={{ color: 'white', marginTop: 12 }}>Players:</Text>
      {match?.players.map((p) => (
        <Text key={p.userId} style={{ color: p.connected ? 'white' : '#ff96b5' }}>
          • {p.nickname} {p.userId === match.hostUserId ? '(Host)' : ''} {p.connected ? '' : '(Reconnecting...)'}
        </Text>
      ))}
      {isHost && (
        <PrimaryButton
          title="Start Match"
          onPress={() => {
            if (roomCode) socket.emit('room:start', { roomCode, userId });
          }}
        />
      )}
    </Screen>
  );
}
