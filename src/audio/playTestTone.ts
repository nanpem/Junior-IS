import { AudioContext, AudioManager } from "react-native-audio-api";

AudioManager.disableSessionManagement();

const audioContext = new AudioContext();

export function playTestTone() {
  const oscillator = audioContext.createOscillator();

  oscillator.frequency.value = 440;

  oscillator.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 1);
}