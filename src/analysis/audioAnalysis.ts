import { decodeAudioData } from "react-native-audio-api";

export async function getRecordingSamples(uri: string) {
  const audioBuffer = await decodeAudioData(uri);

  const samples = audioBuffer.getChannelData(0);

  return {
    samples: samples,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  };
}