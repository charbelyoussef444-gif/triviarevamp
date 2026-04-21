import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.btn} onPress={onPress}>
      <Text style={styles.txt}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.accent, borderRadius: 12, padding: 14, marginTop: 10 },
  txt: { color: colors.text, textAlign: 'center', fontWeight: '700' },
});
