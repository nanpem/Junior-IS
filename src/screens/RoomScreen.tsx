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

type Props = {
  onContinue: (
    roomName: string,
    roomWidth: number,
    roomLength: number
  ) => void;
};

export default function RoomScreen({ onContinue }: Props) {
  const [roomName, setRoomName] = useState("");
  const [roomWidth, setRoomWidth] = useState("");
  const [roomLength, setRoomLength] = useState("");

  function continueMeasurement() {
    if (
      roomName === "" ||
      roomWidth === "" ||
      roomLength === ""
    ) {
      return;
    }

    const width = Number(roomWidth);
    const length = Number(roomLength);

    onContinue(roomName, width, length);
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
        <Text style={styles.title}>Room Information</Text>
  
        <Text style={styles.label}>Room Name</Text>
        <TextInput
          style={styles.input}
          value={roomName}
          onChangeText={setRoomName}
        />
  
        <Text style={styles.label}>Room Width (meters)</Text>
        <TextInput
          style={styles.input}
          value={roomWidth}
          onChangeText={setRoomWidth}
          keyboardType="decimal-pad"
        />
  
        <Text style={styles.label}>Room Length (meters)</Text>
        <TextInput
          style={styles.input}
          value={roomLength}
          onChangeText={setRoomLength}
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