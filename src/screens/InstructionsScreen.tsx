import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

type Props = {
  onContinue: () => void;
};

export default function InstructionsScreen({
  onContinue,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Measurement Instructions
      </Text>

      <Text style={styles.instruction}>
        1. Place your phone at the location you want to measure.
      </Text>

      <Text style={styles.instruction}>
        2. Keep the phone completely still during the measurement.
      </Text>

      <Text style={styles.instruction}>
        3. When prompted, clap once near the phone.
      </Text>

      <TouchableOpacity
        style={styles.startButton}
        onPress={onContinue}
      >
        <Text style={styles.buttonText}>
          Continue
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

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },
});