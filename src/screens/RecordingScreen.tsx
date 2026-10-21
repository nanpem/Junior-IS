import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  RecordingPresets,
  useAudioRecorder,
} from "expo-audio";

type Props = {
  onRecordingComplete: (uri: string) => void;
};

export default function RecordingScreen({
  onRecordingComplete,
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
        await recorder.prepareToRecordAsync();

        recorder.record();

        console.log("Recording started");

        timer = setTimeout(async () => {
          try {
            await recorder.stop();

            const uri = recorder.uri;

            if (uri) {
              console.log("Recording saved:", uri);

              setRecordingComplete(true);
              onRecordingComplete(uri);
            } else {
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
  }, [recorder, onRecordingComplete]);

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

        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.clap}>CLAP!</Text>

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