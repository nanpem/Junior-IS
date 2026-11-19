import { useState } from "react";
import { Alert } from "react-native";
import { requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";

import HomeScreen from "./src/screens/HomeScreen";
import InstructionsScreen from "./src/screens/InstructionsScreen";
import CountdownScreen from "./src/screens/CountdownScreen";
import RecordingScreen from "./src/screens/RecordingScreen";
import ViewRecordingsScreen from "./src/screens/ViewRecordingsScreen";
import PositionScreen from "./src/screens/PositionScreen";
import RoomScreen from "./src/screens/RoomScreen";

// Defines the available application screens
type Screen = "home" | "instructions" | "room" | "position" | "countdown" | "recording" | "recordings";

// Manages application navigation and measurement information
export default function App() {
  // Track the currently displayed screen
  const [screen, setScreen] = useState<Screen>("home");

  // Store measurement coordinates and room information
  const [xPosition, setXPosition] = useState<number | null>(null);
  const [yPosition, setYPosition] = useState<number | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomWidth, setRoomWidth] = useState<number | null>(null);
  const [roomLength, setRoomLength] = useState<number | null>(null);

  // Begins a new measurement by displaying the instructions
  function startMeasurement() {
    setScreen("instructions");
  }

  // Requests microphone permission and configures the audio mode
  async function requestMicrophoneAccess() {
    const { granted } = await requestRecordingPermissionsAsync();

    // Continue to room information if permission is granted
    if (granted) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      setScreen("room");
    } else {
      Alert.alert(
        "Microphone Permission Required",
        "Microphone access is needed to record the room measurement."
      );
    }
  }

  // Opens the saved recordings screen
  function viewRecordings() {
    setScreen("recordings");
  }

  // Display measurement instructions
  if (screen === "instructions") {
    return (
      <InstructionsScreen onContinue={requestMicrophoneAccess} />
    );
  }

  // Display the countdown before recording begins
  if (screen === "countdown") {
    return (
      <CountdownScreen onFinished={() => setScreen("recording")} />
    );
  }

  // Pass room information and coordinates to the recording screen
  if (screen === "recording") {
    return (
      <RecordingScreen
        roomName={roomName}
        roomWidth={roomWidth!}
        roomLength={roomLength!}
        xPosition={xPosition!}
        yPosition={yPosition!}
        onRecordingComplete={(uri) => {
          console.log("Saved measurement:", uri);
        }}
        onViewRecording={() => setScreen("recordings")}
        onAddMeasurement={() => setScreen("position")}
      />
    );
  }

  // Display saved recordings and allow navigation back to the home screen
  if (screen === "recordings") {
    return (
      <ViewRecordingsScreen onBack={() => setScreen("home")} />
    );
  }

  // Collect room information before selecting a measurement position
  if (screen === "room") {
    return (
      <RoomScreen
        onContinue={(name, width, length) => {
          setRoomName(name);
          setRoomWidth(width);
          setRoomLength(length);
          setScreen("position");
        }}
      />
    );
  }

  // Store the measurement coordinates and begin the countdown
  if (screen === "position") {
    return (
      <PositionScreen
        onContinue={(x, y) => {
          setXPosition(x);
          setYPosition(y);
          setScreen("countdown");
        }}
      />
    );
  }

  // Display the home screen by default
  return (
    <HomeScreen
      onStartMeasurement={startMeasurement}
      onViewRecordings={viewRecordings}
    />
  );
}