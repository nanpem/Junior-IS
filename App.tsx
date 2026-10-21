import { useState } from "react";
import { Alert } from "react-native";
import { requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";


import HomeScreen from "./src/screens/HomeScreen";
import InstructionsScreen from "./src/screens/InstructionsScreen";
import CountdownScreen from "./src/screens/CountdownScreen";
import RecordingScreen from "./src/screens/RecordingScreen";


type Screen =
  | "home"
  | "instructions"
  | "countdown"
  | "recording";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

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
  
      setScreen("countdown");
    } else {
      Alert.alert(
        "Microphone Permission Required",
        "Microphone access is needed to record the clap for room measurement."
      );
    }
  }

  function viewRecordings() {
    console.log("Viewing past recordings");
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
        onRecordingComplete={(uri) => {
          setRecordingUri(uri);
          console.log("Saved measurement:", uri);
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