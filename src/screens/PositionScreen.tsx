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

type Props = {
  onContinue: (x: number, y: number) => void;
};

export default function PositionScreen({ onContinue }: Props) {
  const [xPosition, setXPosition] = useState("");
  const [yPosition, setYPosition] = useState("");

  function continueMeasurement() {
    const x = Number(xPosition);
    const y = Number(yPosition);

    if (xPosition === "" || yPosition === "") {
      return;
    }

    onContinue(x, y);
  }

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
  
        <Text style={styles.label}>X Position (meters)</Text>
        <TextInput
          style={styles.input}
          value={xPosition}
          onChangeText={setXPosition}
          keyboardType="decimal-pad"
        />
  
        <Text style={styles.label}>Y Position (meters)</Text>
        <TextInput
          style={styles.input}
          value={yPosition}
          onChangeText={setYPosition}
          keyboardType="decimal-pad"
        />
  
        <Button
          title="Continue"
          onPress={continueMeasurement}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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