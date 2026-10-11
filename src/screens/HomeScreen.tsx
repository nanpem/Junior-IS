import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

type Props = {
  onStartMeasurement: () => void;
  onViewRecordings: () => void;
};

export default function HomeScreen({
  onStartMeasurement,
  onViewRecordings,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Acoustic Analyzer</Text>

      <Text style={styles.description}>
        Measure and analyze the acoustics of your room.
      </Text>

      <TouchableOpacity
        style={[styles.startButton, styles.firstButton]}
        onPress={onStartMeasurement}
      >
        <Text style={styles.buttonText}>
          New Room Measurement
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.startButton}
        onPress={onViewRecordings}
      >
        <Text style={styles.buttonText}>
          View Recordings
        </Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
    textAlign: "center",
    marginBottom: 25,
  },

  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },

  startButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderRadius: 10,
  },

  firstButton: {
    marginBottom: 15,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },
});