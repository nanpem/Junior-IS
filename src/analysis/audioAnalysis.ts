import { decodeAudioData } from "react-native-audio-api";

// Decodes a recording and extracts its samples and audio information
export async function getRecordingSamples(uri: string) {
  const audioBuffer = await decodeAudioData(uri);

  // Extract audio samples from the first channel
  const samples = audioBuffer.getChannelData(0);

  return {
    samples: samples,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  };
}