import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import * as Sharing from "expo-sharing";

import {
  AudioManager,
  AudioRecorder,
  FileDirectory,
  FileFormat,
  FilePreset,
} from "react-native-audio-api";

import { saveMeasurement } from "../storage/measurementStorage";
import { getRecordingSamples } from "../analysis/audioAnalysis";
import { estimateRT60 } from "../analysis/rt60";

// Defines the room information and callbacks received from the parent component
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

// Defines the acoustic analysis results stored by the screen
type AnalysisResult = {
  rt60500: number;
  rt601000: number;
  midRT60: number;
  rSquared500: number;
  rSquared1000: number;
  sweepStart: number;
  impulsePeak: number;
};

// Configure the iOS audio session to minimize audio processing
AudioManager.setAudioSessionOptions({
  iosCategory: "record",
  iosMode: "measurement",
  iosOptions: [],
});

// Create the recorder and configure lossless mono WAV output
const audioRecorder = new AudioRecorder();

audioRecorder.enableFileOutput({
  format: FileFormat.Wav,
  preset: FilePreset.Lossless,
  directory: FileDirectory.Document,
  channelCount: 1,
});

// Records, saves, analyzes and displays a room measurement
export default function RecordingScreen({
  roomName,
  roomWidth,
  roomLength,
  xPosition,
  yPosition,
  onRecordingComplete,
  onViewRecording,
  onAddMeasurement,
}: Props) {

  // Track recording status, file location and analysis results
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingError, setRecordingError] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Prevent multiple recordings from starting
  const hasStarted = useRef(false);

  // Exports the recorded WAV file through the native sharing menu
  async function exportRecording() {
    if (!recordingUri) {
      return;
    }

    const available = await Sharing.isAvailableAsync();

    if (!available) {
      return;
    }

    await Sharing.shareAsync(recordingUri, {
      mimeType: "audio/wav",
      UTI: "com.microsoft.waveform-audio",
    });
  }

  // Extracts audio samples and calculates the RT60 measurements
  async function analyzeRecording(uri: string) {
    setAnalyzing(true);

    try {
      const audio = await getRecordingSamples(uri);
      const result = estimateRT60(audio.samples, audio.sampleRate);

      // Store the results if analysis is successful
      if (result) {
        setAnalysis(result);
      }
    } catch (error) {
      console.log("Analysis error:", error);
    }

    setAnalyzing(false);
  }

  // Automatically starts recording when the screen opens
  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    let recordingTimer: ReturnType<typeof setTimeout>;

    // Activates the audio session and records the room response
    async function startRecording() {
      try {
        await AudioManager.setAudioSessionActivity(true);

        const startResult = await audioRecorder.start();

        if (startResult.status === "error") {
          setRecordingError(true);
          return;
        }

        // Stop and save the recording after 15 seconds
        recordingTimer = setTimeout(async () => {
          try {
            const stopResult = await audioRecorder.stop();

            // Handle errors that occur when stopping the recorder
            if (stopResult.status === "error") {
              await AudioManager.setAudioSessionActivity(false);
              setRecordingError(true);
              return;
            }

            // Retrieve and validate the saved recording path
            const path = stopResult.paths[0];

            if (!path) {
              await AudioManager.setAudioSessionActivity(false);
              setRecordingError(true);
              return;
            }

            // Ensure the recording path uses the correct URI format
            const uri = path.startsWith("file://") ? path : "file://" + path;

            // Save the recording location and associated room information
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

            // Deactivate the audio session after recording
            await AudioManager.setAudioSessionActivity(false);

            // Update the recording status and notify the parent component
            setRecordingUri(uri);
            setRecordingComplete(true);

            onRecordingComplete(uri);

            // Perform acoustic analysis on the saved recording
            await analyzeRecording(uri);

          } catch (error) {
            setRecordingError(true);
          }
        }, 15000);

      } catch (error) {
        setRecordingError(true);
      }
    }

    startRecording();

    // Clear the recording timer when the effect is cleaned up
    return () => {
      if (recordingTimer) {
        clearTimeout(recordingTimer);
      }
    };

  }, [
    onRecordingComplete,
    roomName,
    roomWidth,
    roomLength,
    xPosition,
    yPosition,
  ]);

  // Display an error message if recording fails
  if (recordingError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Recording Error
        </Text>

        <Text style={styles.description}>
          The room measurement could not be recorded.
        </Text>

        <StatusBar style="auto" />
      </View>
    );
  }

  // Display the completed measurement and analysis results
  if (recordingComplete) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Measurement Complete
        </Text>

        {/* Display a message while acoustic analysis is running */}
        {analyzing && (
          <Text style={styles.description}>
            Analyzing room response...
          </Text>
        )}

        {/* Display the calculated RT60 measurements */}
        {!analyzing && analysis && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              Acoustic Analysis
            </Text>

            <Text style={styles.resultValue}>
              500 Hz RT60: {analysis.rt60500.toFixed(3)} s
            </Text>

            <Text style={styles.resultValue}>
              1000 Hz RT60: {analysis.rt601000.toFixed(3)} s
            </Text>

            <Text style={styles.midResult}>
              Mid RT60: {analysis.midRT60.toFixed(3)} s
            </Text>
          </View>
        )}

        {/* Display a message if acoustic analysis fails */}
        {!analyzing && !analysis && (
          <Text style={styles.description}>
            Analysis could not be completed.
          </Text>
        )}

        {/* Provide options to export, view or add measurements */}
        <Button
          title="Export Recording"
          onPress={exportRecording}
        />

        <View style={styles.buttonSpacing}>
          <Button
            title="View Recordings"
            onPress={onViewRecording}
          />
        </View>

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

  // Display instructions while the room response is being recorded
  return (
    <View style={styles.container}>
      <Text style={styles.clap}>
        MEASURING
      </Text>

      <Text style={styles.description}>
        Recording the room response. Play the test signal from the Mac.
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

// Defines the layout, typography and appearance of the recording screen
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

  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },

  clap: {
    fontSize: 55,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },

  resultBox: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 30,
  },

  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  resultValue: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },

  midResult: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },

  buttonSpacing: {
    marginTop: 20,
  },
});