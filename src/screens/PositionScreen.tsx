import { useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

// Defines the callback for passing measurement coordinates
type Props = {
  onContinue: (x: number, y: number) => void;
};

// Collects the coordinates of the measurement location
export default function PositionScreen({ onContinue }: Props) {
  // Store the coordinates entered by the user
  const [xPosition, setXPosition] = useState("");
  const [yPosition, setYPosition] = useState("");

  // Converts and passes the measurement coordinates to the next screen
  function continueMeasurement() {
    const x = Number(xPosition);
    const y = Number(yPosition);

    // Prevent continuation if either coordinate is empty
    if (xPosition === "" || yPosition === "") {
      return;
    }

    onContinue(x, y);
  }

  // Display the measurement position form with keyboard support
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Measurement Position</Text>

        {/* Collect the x-coordinate in meters */}
        <Text style={styles.label}>X Position (meters)</Text>
        <TextInput
          style={styles.input}
          value={xPosition}
          onChangeText={setXPosition}
          keyboardType="decimal-pad"
        />

        {/* Collect the y-coordinate in meters */}
        <Text style={styles.label}>Y Position (meters)</Text>
        <TextInput
          style={styles.input}
          value={yPosition}
          onChangeText={setYPosition}
          keyboardType="decimal-pad"
        />

        <Button title="Continue" onPress={continueMeasurement} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Defines the layout and appearance of the measurement position screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
});