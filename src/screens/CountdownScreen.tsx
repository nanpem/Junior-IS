import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";

// Defines the callback for completing the countdown
type Props = {
  onFinished: () => void;
};

// Displays a countdown before starting the room measurement
export default function CountdownScreen({ onFinished }: Props) {
  const [countdown, setCountdown] = useState(3);

  // Decrease the countdown every second
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Transition to the recording screen after the countdown finishes
    const timer = setTimeout(() => {
      onFinished();
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onFinished]);

  // Display the current countdown value or the start message
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Ready</Text>

      <Text style={styles.countdown}>
        {countdown > 0 ? countdown : "START"}
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

// Defines the layout and appearance of the countdown screen
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

  countdown: {
    fontSize: 80,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },
});