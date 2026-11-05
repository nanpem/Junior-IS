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


type Screen =
  | "home"
  | "instructions"
  | "room"
  | "position"
  | "countdown"
  | "recording"
  | "recordings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [xPosition, setXPosition] = useState<number | null>(null);
  const [yPosition, setYPosition] = useState<number | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomWidth, setRoomWidth] = useState<number | null>(null);
  const [roomLength, setRoomLength] = useState<number | null>(null);

  function startMeasurement() {
    setScreen("instructions");
  }

  async function requestMicrophoneAccess() {
    const { granted } = await requestRecordingPermissionsAsync();
  
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

  function viewRecordings() {
    setScreen("recordings");
  }

  

  if (screen === "instructions") {
    return (
      <InstructionsScreen
        onContinue={requestMicrophoneAccess}
      />
    );
  }

  if (screen === "countdown") {
    return (
      <CountdownScreen
        onFinished={() => setScreen("recording")}
      />
    );
  }

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

  if (screen === "recordings") {
    return (
      <ViewRecordingsScreen
        onBack={() => setScreen("home")}
      />
    );
  }

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

  return (
    <HomeScreen
      onStartMeasurement={startMeasurement}
      onViewRecordings={viewRecordings}
    />
  );
}