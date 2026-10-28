import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
} from "expo-audio";

type Props = {
  recordingUri: string | null;
  onBack: () => void;
};

export default function ViewRecordingsScreen({
  recordingUri,
  onBack,
}: Props) {
  const player = useAudioPlayer(recordingUri);

  async function playRecording() {
    if (!recordingUri) {
      return;
    }

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    await player.seekTo(0);
    player.play();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>View Recordings</Text>

      <View style={styles.recordingCard}>
        <Text style={styles.recordingTitle}>
          Latest Recording
        </Text>

        <Text style={styles.recordingInfo}>
          Room Measurement
        </Text>

        <Button
          title="Play Recording"
          onPress={playRecording}
        />
      </View>

      <View style={styles.backButton}>
        <Button
          title="Back"
          onPress={onBack}
        />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  recordingCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 10,
  },

  recordingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  recordingInfo: {
    fontSize: 16,
    marginBottom: 20,
  },

  backButton: {
    marginTop: 30,
  },
});