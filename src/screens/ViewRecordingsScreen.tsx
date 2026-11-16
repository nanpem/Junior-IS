import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
} from "expo-audio";
import { File } from "expo-file-system";

import { Measurement } from "../types/Measurement";
import { getMeasurements } from "../storage/measurementStorage";
import { getRecordingSamples } from "../analysis/audioAnalysis";
import { estimateRT60 } from "../analysis/rt60";

type Props = {
  onBack: () => void;
};

export default function ViewRecordingsScreen({
  onBack,
}: Props) {
  const [
    measurements,
    setMeasurements,
  ] =
    useState<
      Measurement[]
    >([]);

  const [
    analysisInfo,
    setAnalysisInfo,
  ] =
    useState("");

  const [
    analyzedMeasurementId,
    setAnalyzedMeasurementId,
  ] =
    useState("");

  const [
    decayPoints,
    setDecayPoints,
  ] =
    useState<
      {
        time: number;
        db: number;
      }[]
    >([]);

  const player =
    useAudioPlayer(null);

  useEffect(() => {
    async function loadMeasurements() {
      const savedMeasurements =
        await getMeasurements();

      setMeasurements(
        savedMeasurements
      );
    }

    loadMeasurements();
  }, []);

  async function playRecording(
    uri: string
  ) {
    try {
      const file =
        new File(uri);

      if (!file.exists) {
        Alert.alert(
          "Playback Error",
          "The recording file does not exist."
        );

        return;
      }

      await setAudioModeAsync({
        allowsRecording:
          false,
        playsInSilentMode:
          true,
      });

      player.replace(uri);

      setTimeout(() => {
        player.play();
      }, 300);
    } catch (error) {
      Alert.alert(
        "Playback Error",
        String(error)
      );
    }
  }

  async function analyzeRecording(
    measurement:
      Measurement
  ) {
    try {
      const file =
        new File(
          measurement.uri
        );

      if (!file.exists) {
        Alert.alert(
          "Analysis Error",
          "The recording file does not exist."
        );

        return;
      }

      const audio =
        await getRecordingSamples(
          measurement.uri
        );

      const analysis =
        estimateRT60(
          audio.samples,
          audio.sampleRate
        );

      if (
        analysis === null
      ) {
        Alert.alert(
          "Analysis Error",
          "There was not enough usable decay to estimate RT60."
        );

        return;
      }

      const result =
        "Estimated RT60: " +
        analysis.rt60.toFixed(
          2
        ) +
        " seconds\n" +
        "Decay slope: " +
        analysis.slope.toFixed(
          2
        ) +
        " dB/s\n" +
        "R²: " +
        analysis.rSquared.toFixed(
          3
        ) +
        "\nT20 start: " +
        analysis.startTime.toFixed(
          2
        ) +
        " s\n" +
        "T20 end: " +
        analysis.endTime.toFixed(
          2
        ) +
        " s\n" +
        "Noise cutoff: " +
        analysis.noiseCutoffTime.toFixed(
          2
        ) +
        " s";

      setAnalysisInfo(
        result
      );

      setAnalyzedMeasurementId(
        measurement.id
      );

      setDecayPoints(
        analysis.decayPoints
      );

      Alert.alert(
        "Analysis Complete",
        result
      );
    } catch (error) {
      Alert.alert(
        "Analysis Error",
        String(error)
      );
    }
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text
        style={styles.title}
      >
        View Recordings
      </Text>

      {measurements.length ===
      0 ? (
        <Text>
          No recordings saved.
        </Text>
      ) : (
        measurements.map(
          (
            measurement,
            index
          ) => (
            <View
              key={
                measurement.id
              }
              style={
                styles.recordingCard
              }
            >
              <Text
                style={
                  styles.recordingTitle
                }
              >
                Measurement{" "}
                {index + 1}
              </Text>

              <Text
                style={
                  styles.recordingInfo
                }
              >
                {new Date(
                  measurement.createdAt
                ).toLocaleString()}
              </Text>

              <Text
                style={
                  styles.recordingInfo
                }
              >
                Position: (
                {measurement.x},{" "}
                {measurement.y})
                m
              </Text>

              <Text
                style={
                  styles.recordingInfo
                }
              >
                Room:{" "}
                {
                  measurement.roomName
                }
              </Text>

              <Text
                style={
                  styles.recordingInfo
                }
              >
                Size:{" "}
                {
                  measurement.roomWidth
                }{" "}
                m ×{" "}
                {
                  measurement.roomLength
                }{" "}
                m
              </Text>

              <Button
                title="Play Recording"
                onPress={() =>
                  playRecording(
                    measurement.uri
                  )
                }
              />

              <View
                style={
                  styles.buttonSpacing
                }
              >
                <Button
                  title="Analyze Recording"
                  onPress={() =>
                    analyzeRecording(
                      measurement
                    )
                  }
                />
              </View>

              {analyzedMeasurementId ===
                measurement.id &&
                analysisInfo !==
                  "" && (
                  <Text
                    style={
                      styles.analysisInfo
                    }
                  >
                    {
                      analysisInfo
                    }
                  </Text>
                )}

              {analyzedMeasurementId ===
                measurement.id &&
                decayPoints.length >
                  0 && (
                  <View
                    style={
                      styles.chartContainer
                    }
                  >
                    <Text
                      style={
                        styles.chartTitle
                      }
                    >
                      Energy
                      Decay Curve
                    </Text>

                    <View
                      style={
                        styles.chart
                      }
                    >
                      <Text
                        style={
                          styles.zeroLabel
                        }
                      >
                        0 dB
                      </Text>

                      <Text
                        style={
                          styles.minusFiveLabel
                        }
                      >
                        -5 dB
                      </Text>

                      <Text
                        style={
                          styles.minusTwentyFiveLabel
                        }
                      >
                        -25 dB
                      </Text>

                      <Text
                        style={
                          styles.minusSixtyLabel
                        }
                      >
                        -60 dB
                      </Text>

                      {decayPoints.map(
                        (
                          point,
                          pointIndex
                        ) => {
                          const maximumTime =
                            decayPoints[
                              decayPoints.length -
                                1
                            ].time;

                          const left =
                            maximumTime ===
                            0
                              ? 0
                              : (
                                  point.time /
                                  maximumTime
                                ) *
                                100;

                          const top =
                            (
                              Math.abs(
                                point.db
                              ) /
                              60
                            ) *
                            150;

                          return (
                            <View
                              key={
                                pointIndex
                              }
                              style={[
                                styles.decayPoint,
                                {
                                  left: `${left}%`,
                                  top:
                                    top,
                                },
                              ]}
                            />
                          );
                        }
                      )}
                    </View>
                  </View>
                )}
            </View>
          )
        )
      )}

      <View
        style={
          styles.backButton
        }
      >
        <Button
          title="Back"
          onPress={onBack}
        />
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
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

    buttonSpacing: {
      marginTop: 15,
    },

    analysisInfo: {
      fontSize: 16,
      marginTop: 20,
      lineHeight: 24,
    },

    chartContainer: {
      marginTop: 25,
    },

    chartTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },

    chart: {
      height: 170,
      borderLeftWidth: 1,
      borderBottomWidth: 1,
      marginLeft: 50,
      position: "relative",
    },

    decayPoint: {
      position: "absolute",
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor:
        "black",
    },

    zeroLabel: {
      position: "absolute",
      left: -42,
      top: -8,
      fontSize: 12,
    },

    minusFiveLabel: {
      position: "absolute",
      left: -42,
      top: 5,
      fontSize: 12,
    },

    minusTwentyFiveLabel: {
      position: "absolute",
      left: -48,
      top: 55,
      fontSize: 12,
    },

    minusSixtyLabel: {
      position: "absolute",
      left: -48,
      bottom: -7,
      fontSize: 12,
    },

    backButton: {
      marginTop: 30,
    },
  });