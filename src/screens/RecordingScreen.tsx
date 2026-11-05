import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  RecordingPresets,
  useAudioRecorder,
  setAudioModeAsync
} from "expo-audio";
import { playSweep } from "../audio/playSweep";
import { saveMeasurement } from "../storage/measurementStorage";

type Props = {
  roomName: string;
  roomWidth: number;
  roomLength: number;
  xPosition: number;
  yPosition: number;
  onRecordingComplete: (uri: string) => void;
  onViewRecording: () => void;
  onAddMeasurement: () => void;
};

export default function RecordingScreen({
  roomName,
  roomWidth,
  roomLength,
  xPosition,
  yPosition,
  onRecordingComplete,
  onViewRecording,
  onAddMeasurement
}: Props) {
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingError, setRecordingError] = useState(false);

  const hasStarted = useRef(false);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: "document",
  });

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    let timer: ReturnType<typeof setTimeout>;

    async function startRecording() {
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();

        recorder.record();
        setTimeout(() => {
          playSweep();
        }, 500);

        console.log("Recording started");

        timer = setTimeout(async () => {
          try {
            await recorder.stop();

            const uri = recorder.uri;

            if (uri) {
              await saveMeasurement({
                id: Date.now().toString(),
                uri: uri,
                createdAt: new Date().toISOString(),
                roomName: roomName,
                roomWidth: roomWidth,
                roomLength: roomLength,
                x: xPosition,
                y: yPosition,
              });

              setRecordingComplete(true);
              onRecordingComplete(uri);
            } 
            else {
              setRecordingError(true);
            }
          } catch (error) {
            console.log("Error stopping recording:", error);
            setRecordingError(true);
          }
        }, 5000);
      } catch (error) {
        console.log("Error starting recording:", error);
        setRecordingError(true);
      }
    }

    startRecording();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    recorder,
    onRecordingComplete,
    roomName,
    roomWidth,
    roomLength,
    xPosition,
    yPosition
  ]);

  if (recordingError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recording Error</Text>

        <Text style={styles.description}>
          The room measurement could not be recorded.
        </Text>

        <StatusBar style="auto" />
      </View>
    );
  }

  if (recordingComplete) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recording Complete</Text>
  
        <Text style={styles.description}>
          The room measurement was successfully recorded.
        </Text>
  
        <Button
          title="View Recording"
          onPress={onViewRecording}
        />

      <View style={styles.buttonSpacing}>
        <Button
          title="Add Another Measurement"
          onPress={onAddMeasurement}
        />
      </View>
  
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
     <Text style={styles.clap}>MEASURING</Text>

    <Text style={styles.description}>
      Playing the test signal and recording the room response...
    </Text>

      <Text style={styles.description}>
        Recording the sound that follows...
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
    textAlign: "center",
    marginBottom: 25,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },

  buttonSpacing: {
    marginTop: 20,
  },

  clap: {
    fontSize: 70,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },

  description: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },
});