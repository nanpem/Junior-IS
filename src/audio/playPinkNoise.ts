import { AudioContext } from "react-native-audio-api";

const audioContext = new AudioContext();

export function playPinkNoise() {
  const duration = 4;
  const sampleRate = audioContext.sampleRate;

  const length = Math.floor(
    duration * sampleRate
  );

  const buffer = audioContext.createBuffer(
    1,
    length,
    sampleRate
  );

  const samples =
    buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;

  for (let i = 0; i < length; i++) {
    const white =
      Math.random() * 2 - 1;

    b0 =
      0.99765 * b0 +
      white * 0.099046;

    b1 =
      0.963 * b1 +
      white * 0.2965164;

    b2 =
      0.57 * b2 +
      white * 1.0526913;

    let pink =
      (
        b0 +
        b1 +
        b2 +
        white * 0.1848
      ) * 0.11;

    const time =
      i / sampleRate;

    if (time < 0.05) {
      pink *=
        time / 0.05;
    }

    samples[i] =
      Math.max(
        -1,
        Math.min(
          1,
          pink * 0.5
        )
      );
  }

  const source =
    audioContext.createBufferSource();

  source.buffer = buffer;

  source.connect(
    audioContext.destination
  );

  source.start();
}