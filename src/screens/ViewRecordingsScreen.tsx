import {
  useEffect,
  useState,
} from "react";

import {
  StatusBar,
} from "expo-status-bar";

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

import {
  File,
} from "expo-file-system";

import * as DocumentPicker from "expo-document-picker";

import {
  Measurement,
} from "../types/Measurement";

import {
  getMeasurements,
} from "../storage/measurementStorage";

import {
  getRecordingSamples,
} from "../analysis/audioAnalysis";

import {
  estimateRT60,
} from "../analysis/rt60";

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
    testAnalysisInfo,
    setTestAnalysisInfo,
  ] =
    useState("");

  const [
    analyzedMeasurementId,
    setAnalyzedMeasurementId,
  ] =
    useState("");

  const [
    analyzingMeasurementId,
    setAnalyzingMeasurementId,
  ] =
    useState("");

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

  function formatAnalysis(
    analysis: NonNullable<
      ReturnType<
        typeof estimateRT60
      >
    >
  ) {
    return (
      "500 Hz RT60: " +
      analysis.rt60500.toFixed(
        3
      ) +
      " s\n" +

      "1000 Hz RT60: " +
      analysis.rt601000.toFixed(
        3
      ) +
      " s\n" +

      "Mid RT60: " +
      analysis.midRT60.toFixed(
        3
      ) +
      " s\n\n" +

      "500 Hz R²: " +
      analysis.rSquared500.toFixed(
        3
      ) +
      "\n" +

      "1000 Hz R²: " +
      analysis.rSquared1000.toFixed(
        3
      ) +
      "\n\n" +

      "Sweep start: " +
      analysis.sweepStart.toFixed(
        3
      ) +
      " s\n" +

      "Impulse peak: " +
      analysis.impulsePeak.toFixed(
        3
      ) +
      " s"
    );
  }

  async function importTestRecording() {
    try {
      const result =
        await DocumentPicker
          .getDocumentAsync({
            type: [
              "audio/wav",
              "audio/x-wav",
              "audio/wave",
            ],

            copyToCacheDirectory:
              true,

            multiple: false,
          });

      if (result.canceled) {
        return;
      }

      const uri =
        result.assets[0].uri;

      setTestAnalysisInfo(
        "Analyzing..."
      );

      const audio =
        await getRecordingSamples(
          uri
        );

      const analysis =
        estimateRT60(
          audio.samples,
          audio.sampleRate
        );

      if (!analysis) {
        setTestAnalysisInfo(
          ""
        );

        Alert.alert(
          "Analysis Error",
          "The imported recording could not be analyzed."
        );

        return;
      }

      const formatted =
        formatAnalysis(
          analysis
        );

      setTestAnalysisInfo(
        formatted
      );

      Alert.alert(
        "Test Analysis Complete",
        "Mid RT60: " +
          analysis.midRT60.toFixed(
            3
          ) +
          " seconds"
      );
    } catch (error) {
      setTestAnalysisInfo(
        ""
      );

      Alert.alert(
        "Import Error",
        String(error)
      );
    }
  }

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
      setAnalyzingMeasurementId(
        measurement.id
      );

      const file =
        new File(
          measurement.uri
        );

      if (!file.exists) {
        setAnalyzingMeasurementId(
          ""
        );

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

      if (!analysis) {
        setAnalyzingMeasurementId(
          ""
        );

        Alert.alert(
          "Analysis Error",
          "The recording could not be analyzed."
        );

        return;
      }

      const result =
        formatAnalysis(
          analysis
        );

      setAnalysisInfo(
        result
      );

      setAnalyzedMeasurementId(
        measurement.id
      );

      setAnalyzingMeasurementId(
        ""
      );

      Alert.alert(
        "Analysis Complete",
        "Mid RT60: " +
          analysis.midRT60.toFixed(
            3
          ) +
          " seconds"
      );
    } catch (error) {
      setAnalyzingMeasurementId(
        ""
      );

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
        style={
          styles.title
        }
      >
        View Recordings
      </Text>

      <View
        style={
          styles.testSection
        }
      >
        <Text
          style={
            styles.testTitle
          }
        >
          Validation Test
        </Text>

        <Button
          title="Import Test Recording"
          onPress={
            importTestRecording
          }
        />

        {testAnalysisInfo !==
          "" && (
          <Text
            style={
              styles.analysisInfo
            }
          >
            {
              testAnalysisInfo
            }
          </Text>
        )}
      </View>

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
                  title={
                    analyzingMeasurementId ===
                    measurement.id
                      ? "Analyzing..."
                      : "Analyze Recording"
                  }
                  disabled={
                    analyzingMeasurementId ===
                    measurement.id
                  }
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
                  <View
                    style={
                      styles.resultBox
                    }
                  >
                    <Text
                      style={
                        styles.resultTitle
                      }
                    >
                      Acoustic Analysis
                    </Text>

                    <Text
                      style={
                        styles.analysisInfo
                      }
                    >
                      {
                        analysisInfo
                      }
                    </Text>
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
          onPress={
            onBack
          }
        />
      </View>

      <StatusBar
        style="auto"
      />
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

    testSection: {
      padding: 20,
      borderWidth: 1,
      borderRadius: 10,
      marginBottom: 30,
    },

    testTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 15,
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
      marginBottom: 12,
    },

    buttonSpacing: {
      marginTop: 15,
    },

    resultBox: {
      marginTop: 20,
      padding: 15,
      borderWidth: 1,
      borderRadius: 8,
    },

    resultTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },

    analysisInfo: {
      fontSize: 16,
      lineHeight: 25,
      marginTop: 15,
    },

    backButton: {
      marginTop: 30,
    },
  });