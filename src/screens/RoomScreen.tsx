import { useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Defines the callback for passing room information to the next screen
type Props = {
  onContinue: (roomName: string, roomWidth: number, roomLength: number) => void;
};

// Collects the room name and dimensions before taking a measurement
export default function RoomScreen({ onContinue }: Props) {
  // Store the room information entered by the user
  const [roomName, setRoomName] = useState("");
  const [roomWidth, setRoomWidth] = useState("");
  const [roomLength, setRoomLength] = useState("");

  // Checks the room information and passes it to the next screen
  function continueMeasurement() {
    // Prevent continuation if any required field is empty
    if (roomName === "" || roomWidth === "" || roomLength === "") {
      return;
    }

    // Convert the room dimensions from strings to numbers
    const width = Number(roomWidth);
    const length = Number(roomLength);

    onContinue(roomName, width, length);
  }

  // Display the room information form with keyboard support
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Room Information</Text>

        {/* Collect the room name */}
        <Text style={styles.label}>Room Name</Text>
        <TextInput
          style={styles.input}
          value={roomName}
          onChangeText={setRoomName}
        />

        {/* Collect the room width in meters */}
        <Text style={styles.label}>Room Width (meters)</Text>
        <TextInput
          style={styles.input}
          value={roomWidth}
          onChangeText={setRoomWidth}
          keyboardType="decimal-pad"
        />

        {/* Collect the room length in meters */}
        <Text style={styles.label}>Room Length (meters)</Text>
        <TextInput
          style={styles.input}
          value={roomLength}
          onChangeText={setRoomLength}
          keyboardType="decimal-pad"
        />

        <Button title="Continue" onPress={continueMeasurement} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Defines the layout and appearance of the room information screen
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