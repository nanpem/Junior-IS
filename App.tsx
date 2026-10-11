import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

export default function App() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!showCountdown) {
      return;
    }
  
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
  
      return () => clearTimeout(timer);
    }
  
    console.log("Countdown finished - recording starts here");
  }, [countdown, showCountdown]);

  function startMeasurement() {
    setShowInstructions(true);
  }

  function viewRecordings() {
    console.log("Viewing past recordings");
  }

  function startCountdown() {
    setCountdown(3);
    setShowCountdown(true);
  }

  if (showCountdown) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Get Ready</Text>
  
        <Text style={styles.countdown}>
          {countdown > 0 ? countdown : "CLAP!"}
        </Text>
  
        <StatusBar style="auto" />
      </View>
    );
  }

  if (showInstructions) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Measurement Instructions</Text>

        <Text style={styles.instruction}>
          1. Place your phone at the location you want to measure.
        </Text>

        <Text style={styles.instruction}>
          2. Keep the phone completely still during the measurement.
        </Text>

        <Text style={styles.instruction}>
          3. When prompted, clap once near the phone.
        </Text>

        <TouchableOpacity style={styles.startButton}
          onPress={startCountdown}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Acoustic Analyzer</Text>

      <Text style={styles.description}>
        Measure and analyze the acoustics of your room.
      </Text>

      <TouchableOpacity
        style={[styles.startButton, styles.firstButton]}
        onPress={startMeasurement}
      >
        <Text style={styles.buttonText}>New Room Measurement</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.startButton}
        onPress={viewRecordings}
      >
        <Text style={styles.buttonText}>View Recordings</Text>
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

  instruction: {
    fontSize: 17,
    marginBottom: 20,
    width: "100%",
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

  countdown: {
    fontSize: 80,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
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