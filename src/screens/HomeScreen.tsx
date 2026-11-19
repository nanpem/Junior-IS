import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";

// Defines the callbacks for navigating from the home screen
type Props = {
  onStartMeasurement: () => void;
  onViewRecordings: () => void;
};

// Displays the main menu of the room acoustic analyzer
export default function HomeScreen({ onStartMeasurement, onViewRecordings }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Acoustic Analyzer</Text>

      <Text style={styles.description}>
        Measure and analyze the acoustics of your room.
      </Text>

      {/* Start a new room measurement */}
      <TouchableOpacity
        style={[styles.startButton, styles.firstButton]}
        onPress={onStartMeasurement}
      >
        <Text style={styles.buttonText}>New Room Measurement</Text>
      </TouchableOpacity>

      {/* Navigate to previously saved recordings */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={onViewRecordings}
      >
        <Text style={styles.buttonText}>View Recordings</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

// Defines the layout, typography and appearance of the home screen
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