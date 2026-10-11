import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";

type Props = {
  onFinished: () => void;
};

export default function CountdownScreen({
  onFinished,
}: Props) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      onFinished();
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onFinished]);

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