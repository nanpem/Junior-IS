import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {Button, ScrollView, StyleSheet, Text, View,} from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
} from "expo-audio";
import { Measurement } from "../types/Measurement";
import { getMeasurements } from "../storage/measurementStorage";

type Props = {
  onBack: () => void;
};

export default function ViewRecordingsScreen({
  onBack,
}: Props) {

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const player = useAudioPlayer(null);
  
  useEffect(() => {
    async function loadMeasurements() {
      const savedMeasurements = await getMeasurements();
      setMeasurements(savedMeasurements);
    }
  
    loadMeasurements();
  }, []);
  
  async function playRecording(uri: string) {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  
    player.replace(uri);
    player.play();
  }

  return (
    <ScrollView 
    contentContainerStyle={styles.container}
    contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>View Recordings</Text>

      {measurements.length === 0 ? (
        <Text>No recordings saved.</Text>
      ) : (
        measurements.map((measurement, index) => (
          <View
            key={measurement.id}
            style={styles.recordingCard}
          >
            <Text style={styles.recordingTitle}>
              Measurement {index + 1}
            </Text>

            <Text style={styles.recordingInfo}>
              {new Date(measurement.createdAt).toLocaleString()}
            </Text>

            <Text style={styles.recordingInfo}>
              Position: ({measurement.x}, {measurement.y}) m
            </Text>

            <Text style={styles.recordingInfo}>
              Room: {measurement.roomName}
            </Text>

            <Text style={styles.recordingInfo}>
              Size: {measurement.roomWidth} m × {measurement.roomLength} m
            </Text>

            <Button
              title="Play Recording"
              onPress={() => playRecording(measurement.uri)}
            />
          </View>
        ))
      )}

      <View style={styles.backButton}>
        <Button
          title="Back"
          onPress={onBack}
        />
      </View>

      <StatusBar style="auto" />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  recordingCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
  },

  recordingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  recordingInfo: {
    fontSize: 16,
    marginBottom: 20,
  },

  backButton: {
    marginTop: 30,
  },
});