import { AudioContext, AudioManager } from "react-native-audio-api";

AudioManager.disableSessionManagement();

const audioContext = new AudioContext();

export function playSweep() {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  const startTime = audioContext.currentTime;
  const duration = 2;

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(200, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    8000,
    startTime + duration
  );

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);

  gain.gain.setValueAtTime(0.5, startTime + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}