import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as Sharing from "expo-sharing";

import {
  AudioManager,
  AudioRecorder,
  FileDirectory,
  FileFormat,
  FilePreset,
} from "react-native-audio-api";

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

AudioManager.setAudioSessionOptions({
  iosCategory: "record",
  iosMode: "measurement",
  iosOptions: [],
});

const audioRecorder =
  new AudioRecorder();

audioRecorder.enableFileOutput({
  format: FileFormat.Wav,
  preset: FilePreset.Lossless,
  directory: FileDirectory.Document,
  channelCount: 1,
});

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
  const [
    recordingComplete,
    setRecordingComplete,
  ] = useState(false);

  const [
    recordingError,
    setRecordingError,
  ] = useState(false);

  const [
    recordingUri,
    setRecordingUri,
  ] = useState<string | null>(
    null
  );

  const hasStarted =
    useRef(false);

  async function exportRecording() {
    if (!recordingUri) {
      return;
    }

    const available =
      await Sharing.isAvailableAsync();

    if (!available) {
      return;
    }

    await Sharing.shareAsync(
      recordingUri,
      {
        mimeType: "audio/wav",
        UTI: "com.microsoft.waveform-audio",
      }
    );
  }

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    let recordingTimer:
      ReturnType<typeof setTimeout>;

    async function startRecording() {
      try {
        await AudioManager
          .setAudioSessionActivity(
            true
          );

        const startResult =
          await audioRecorder.start();

        if (
          startResult.status ===
          "error"
        ) {
          setRecordingError(true);

          return;
        }

        recordingTimer =
          setTimeout(
            async () => {
              try {
                const stopResult =
                  await audioRecorder.stop();

                if (
                  stopResult.status ===
                  "error"
                ) {
                  await AudioManager
                    .setAudioSessionActivity(
                      false
                    );

                  setRecordingError(
                    true
                  );

                  return;
                }

                const path =
                  stopResult.paths[0];

                if (!path) {
                  await AudioManager
                    .setAudioSessionActivity(
                      false
                    );

                  setRecordingError(
                    true
                  );

                  return;
                }

                const uri =
                  path.startsWith(
                    "file://"
                  )
                    ? path
                    : "file://" +
                      path;

                await saveMeasurement({
                  id:
                    Date.now()
                      .toString(),
                  uri: uri,
                  createdAt:
                    new Date()
                      .toISOString(),
                  roomName:
                    roomName,
                  roomWidth:
                    roomWidth,
                  roomLength:
                    roomLength,
                  x: xPosition,
                  y: yPosition,
                });

                await AudioManager
                  .setAudioSessionActivity(
                    false
                  );

                setRecordingUri(
                  uri
                );

                setRecordingComplete(
                  true
                );

                onRecordingComplete(
                  uri
                );
              } catch (error) {
                setRecordingError(
                  true
                );
              }
            },
            8000
          );
      } catch (error) {
        setRecordingError(true);
      }
    }

    startRecording();

    return () => {
      if (recordingTimer) {
        clearTimeout(
          recordingTimer
        );
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

  if (recordingError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Recording Error
        </Text>

        <Text
          style={styles.description}
        >
          The room measurement
          could not be recorded.
        </Text>

        <StatusBar style="auto" />
      </View>
    );
  }

  if (recordingComplete) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Recording Complete
        </Text>

        <Text
          style={styles.description}
        >
          The room measurement was
          successfully recorded.
        </Text>

        <Button
          title="Export Recording"
          onPress={
            exportRecording
          }
        />

        <View
          style={
            styles.buttonSpacing
          }
        >
          <Button
            title="View Recording"
            onPress={
              onViewRecording
            }
          />
        </View>

        <View
          style={
            styles.buttonSpacing
          }
        >
          <Button
            title="Add Another Measurement"
            onPress={
              onAddMeasurement
            }
          />
        </View>

        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.clap}>
        MEASURING
      </Text>

      <Text
        style={styles.description}
      >
        Recording the room response.
        Play the test signal from
        the Mac.
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: 30,
    },

    title: {
      fontSize: 30,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 25,
      fontFamily:
        Platform.select({
          ios: "Courier",
          android:
            "sans-serif-medium",
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
      fontFamily:
        Platform.select({
          ios: "Courier",
          android:
            "sans-serif-medium",
        }),
    },

    description: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 25,
      fontFamily:
        Platform.select({
          ios: "Courier",
          android:
            "sans-serif-medium",
        }),
    },
  });