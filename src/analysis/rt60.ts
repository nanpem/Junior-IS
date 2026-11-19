import FFT from "fft.js";

// Frequency sweep settings
const SWEEP_DURATION = 2;
const START_FREQUENCY = 200;
const END_FREQUENCY = 8000;

// Coefficients of a second-order filter section
type SOS = [number, number, number, number, number, number];

// SOS coefficients for the 500 Hz bandpass filter
const SOS_500: SOS[] = [
  [
    2.7008539643187137e-7,
    5.4017079286374275e-7,
    2.7008539643187137e-7,
    1,
    -1.9467977986638063,
    0.9523568057434735,
  ],
  [
    1,
    2,
    1,
    1,
    -1.9607827914789351,
    0.9639455998661062,
  ],
  [
    1,
    -2,
    1,
    1,
    -1.968945254948772,
    0.9770301487236029,
  ],
  [
    1,
    -2,
    1,
    1,
    -1.9856711353336083,
    0.9878993191713733,
  ],
];

// SOS coefficients for the 1000 Hz bandpass filter
const SOS_1000: SOS[] = [
  [
    4.076353113570579e-6,
    8.152706227141158e-6,
    4.076353113570579e-6,
    1,
    -1.8852476795739006,
    0.9069483987680177,
  ],
  [
    1,
    2,
    1,
    1,
    -1.9166859881097214,
    0.9291065993944077,
  ],
  [
    1,
    -2,
    1,
    1,
    -1.9227527407359077,
    0.9546647771369348,
  ],
  [
    1,
    -2,
    1,
    1,
    -1.9670646099666076,
    0.9759188943038697,
  ],
];

// Finds the smallest power of two greater than or equal to a value
function nextPowerOfTwo(value: number) {
  let size = 1;

  while (size < value) {
    size *= 2;
  }

  return size;
}

// Normalizes a signal to a maximum absolute amplitude of 1
function normalize(signal: ArrayLike<number>) {
  let maximum = 0;

  // Find the largest absolute sample value
  for (let i = 0; i < signal.length; i++) {
    const value = Math.abs(signal[i]);

    if (value > maximum) {
      maximum = value;
    }
  }

  const result = new Float64Array(signal.length);

  // Avoid division by zero for a silent signal
  if (maximum === 0) {
    return result;
  }

  // Scale each sample relative to the maximum amplitude
  for (let i = 0; i < signal.length; i++) {
    result[i] = signal[i] / maximum;
  }

  return result;
}

// Generates a logarithmic frequency sweep from 200 Hz to 8000 Hz
function generateSweep(sampleRate: number) {
  const length = Math.floor(SWEEP_DURATION * sampleRate);
  const sweep = new Float64Array(length);

  const frequencyRatio = END_FREQUENCY / START_FREQUENCY;
  const logRatio = Math.log(frequencyRatio);
  const fadeSamples = Math.floor(0.02 * sampleRate);

  // Generate each sample of the logarithmic sweep
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;

    const phase = (2 * Math.PI * START_FREQUENCY * SWEEP_DURATION / logRatio) * (Math.exp(logRatio * time / SWEEP_DURATION) - 1);

    let gain = 0.5;

    // Apply a fade-in and fade-out to prevent abrupt transitions
    if (i < fadeSamples) {
      gain *= i / fadeSamples;
    }

    if (i >= length - fadeSamples) {
      gain *= (length - 1 - i) / fadeSamples;
    }

    sweep[i] = Math.sin(phase) * gain;
  }

  return sweep;
}

// Performs convolution using the Fast Fourier Transform
function fftConvolve(first: ArrayLike<number>, second: ArrayLike<number>) {
  const outputLength = first.length + second.length - 1;
  const fftSize = nextPowerOfTwo(outputLength);

  const fft = new FFT(fftSize);

  // Zero-pad both signals to the required FFT size
  const firstInput = new Array<number>(fftSize).fill(0);
  const secondInput = new Array<number>(fftSize).fill(0);

  for (let i = 0; i < first.length; i++) {
    firstInput[i] = first[i];
  }

  for (let i = 0; i < second.length; i++) {
    secondInput[i] = second[i];
  }

  // Transform both signals into the frequency domain
  const firstSpectrum = fft.createComplexArray();
  const secondSpectrum = fft.createComplexArray();

  fft.realTransform(firstSpectrum, firstInput);
  fft.completeSpectrum(firstSpectrum);

  fft.realTransform(secondSpectrum, secondInput);
  fft.completeSpectrum(secondSpectrum);

  const resultSpectrum = fft.createComplexArray();

  // Multiply the complex frequency spectra
  for (let i = 0; i < fftSize; i++) {
    const firstReal = firstSpectrum[2 * i];
    const firstImaginary = firstSpectrum[2 * i + 1];

    const secondReal = secondSpectrum[2 * i];
    const secondImaginary = secondSpectrum[2 * i + 1];

    resultSpectrum[2 * i] = firstReal * secondReal - firstImaginary * secondImaginary;
    resultSpectrum[2 * i + 1] = firstReal * secondImaginary + firstImaginary * secondReal;
  }

  // Transform the result back into the time domain
  const resultComplex = fft.createComplexArray();

  fft.inverseTransform(resultComplex, resultSpectrum);

  const result = new Float64Array(outputLength);

  // Extract the real samples and remove excess padding
  for (let i = 0; i < outputLength; i++) {
    result[i] = resultComplex[2 * i];
  }

  return result;
}

// Locates the beginning of the sweep in a recording using cross-correlation
function findSweepStart(recording: Float64Array, sweep: Float64Array) {
  const reversedSweep = new Float64Array(sweep.length);

  // Reverse the sweep for cross-correlation
  for (let i = 0; i < sweep.length; i++) {
    reversedSweep[i] = sweep[sweep.length - 1 - i];
  }

  const convolution = fftConvolve(recording, reversedSweep);

  const validLength = recording.length - sweep.length + 1;

  if (validLength <= 0) {
    return -1;
  }

  let bestIndex = 0;
  let bestValue = 0;

  // Find the recording position with the strongest correlation
  for (let i = 0; i < validLength; i++) {
    const convolutionIndex = i + sweep.length - 1;
    const value = Math.abs(convolution[convolutionIndex]);

    if (value > bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }

  return bestIndex;
}

// Creates an inverse filter for deconvolution of the logarithmic sweep
function createInverseFilter(sweep: Float64Array, sampleRate: number) {
  const inverse = new Float64Array(sweep.length);

  const L = SWEEP_DURATION / Math.log(END_FREQUENCY / START_FREQUENCY);

  let maximum = 0;

  // Reverse the sweep and apply exponential amplitude compensation
  for (let i = 0; i < sweep.length; i++) {
    const time = i / sampleRate;

    const value = sweep[sweep.length - 1 - i] * Math.exp(-time / L);

    inverse[i] = value;

    const absolute = Math.abs(value);

    if (absolute > maximum) {
      maximum = absolute;
    }
  }

  // Normalize the inverse filter
  if (maximum > 0) {
    for (let i = 0; i < inverse.length; i++) {
      inverse[i] /= maximum;
    }
  }

  return inverse;
}

// Extracts the room's impulse response from the recorded sweep
function getImpulseResponse(recording: Float32Array, sampleRate: number) {
  const normalizedRecording = normalize(recording);
  const sweep = generateSweep(sampleRate);

  // Locate the sweep within the recording
  const sweepStart = findSweepStart(normalizedRecording, sweep);

  if (sweepStart < 0) {
    return null;
  }

  // Extract the sweep and up to three seconds of reverberation
  const tailDuration = 3;

  const segmentEnd = Math.min(normalizedRecording.length, sweepStart + sweep.length + Math.floor(tailDuration * sampleRate));

  const segment = normalizedRecording.slice(sweepStart, segmentEnd);

  // Perform deconvolution to recover the impulse response
  const inverseFilter = createInverseFilter(sweep, sampleRate);
  const deconvolved = fftConvolve(segment, inverseFilter);

  let peakIndex = 0;
  let peakValue = 0;

  // Locate the strongest peak in the deconvolved signal
  for (let i = 0; i < deconvolved.length; i++) {
    const value = Math.abs(deconvolved[i]);

    if (value > peakValue) {
      peakValue = value;
      peakIndex = i;
    }
  }

  // Extract the region around the impulse peak
  const preSamples = Math.floor(0.01 * sampleRate);

  const start = Math.max(0, peakIndex - preSamples);
  const end = Math.min(deconvolved.length, peakIndex + Math.floor(2 * sampleRate));

  const impulse = normalize(deconvolved.slice(start, end));

  return {
    impulse: impulse,
    sweepStart: sweepStart / sampleRate,
    impulsePeak: peakIndex / sampleRate,
  };
}

// Filters a signal through a series of second-order sections
function sosFilter(signal: Float64Array, sections: SOS[]) {
  let current = Float64Array.from(signal);

  // Apply each filter section sequentially
  for (const section of sections) {
    const [b0, b1, b2, a0, a1, a2] = section;

    const output = new Float64Array(current.length);

    // Initialize the filter's internal states
    let z1 = 0;
    let z2 = 0;

    // Filter each sample and update the internal states
    for (let i = 0; i < current.length; i++) {
      const input = current[i];

      const value = (b0 * input + z1) / a0;

      z1 = b1 * input - a1 * value + z2;
      z2 = b2 * input - a2 * value;

      output[i] = value;
    }

    // Pass the filtered signal to the next section
    current = output;
  }

  return current;
}

// Reverses the order of samples in a signal
function reverseSignal(signal: Float64Array) {
  const result = new Float64Array(signal.length);

  for (let i = 0; i < signal.length; i++) {
    result[i] = signal[signal.length - 1 - i];
  }

  return result;
}

// Extends both ends of a signal using odd reflection
function oddPad(signal: Float64Array, padLength: number) {
  const padded = new Float64Array(signal.length + padLength * 2);

  // Reflect samples around the first sample
  for (let i = 0; i < padLength; i++) {
    padded[i] = 2 * signal[0] - signal[padLength - i];
  }

  // Copy the original signal between the padded regions
  padded.set(signal, padLength);

  const last = signal.length - 1;

  // Reflect samples around the last sample
  for (let i = 0; i < padLength; i++) {
    padded[padLength + signal.length + i] = 2 * signal[last] - signal[last - 1 - i];
  }

  return padded;
}

// Applies forward-backward filtering to eliminate phase distortion
function sosFiltFilt(signal: Float64Array, sections: SOS[]) {
  if (signal.length < 30) {
    return signal;
  }

  // Pad the signal to reduce boundary effects
  const padLength = 27;
  const padded = oddPad(signal, padLength);

  // Filter forward and then backward to cancel phase shifts
  const forward = sosFilter(padded, sections);
  const reversed = reverseSignal(forward);
  const backward = sosFilter(reversed, sections);

  // Restore the original sample order and remove the padding
  const restored = reverseSignal(backward);

  return restored.slice(padLength, padLength + signal.length);
}

// Estimates RT60 from a filtered impulse response using the T20 method
function measureRT60(signal: Float64Array, sampleRate: number) {
  const energy = new Float64Array(signal.length);

  let total = 0;

  // Calculate remaining energy using Schroeder backward integration
  for (let i = signal.length - 1; i >= 0; i--) {
    total += signal[i] * signal[i];
    energy[i] = total;
  }

  if (energy.length === 0 || energy[0] <= 0) {
    return null;
  }

  // Convert the energy decay curve to normalized decibels
  const decayDb = new Float64Array(energy.length);

  for (let i = 0; i < energy.length; i++) {
    decayDb[i] = 10 * Math.log10(energy[i] / energy[0]);
  }

  let startIndex = -1;
  let endIndex = -1;

  // Find the -5 dB and -25 dB boundaries for T20 regression
  for (let i = 0; i < decayDb.length; i++) {
    if (startIndex === -1 && decayDb[i] <= -5) {
      startIndex = i;
    }

    if (startIndex !== -1 && decayDb[i] <= -25) {
      endIndex = i;
      break;
    }
  }

  // Reject measurements without a valid decay range
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  let count = 0;

  let sumTime = 0;
  let sumDb = 0;

  let sumTimeDb = 0;
  let sumTimeSquared = 0;

  // Accumulate the values required for least-squares regression
  for (let i = startIndex; i <= endIndex; i++) {
    const time = i / sampleRate;
    const db = decayDb[i];

    count++;

    sumTime += time;
    sumDb += db;
    sumTimeDb += time * db;
    sumTimeSquared += time * time;
  }

  // Calculate the slope of the regression line
  const denominator = count * sumTimeSquared - sumTime * sumTime;

  if (denominator === 0) {
    return null;
  }

  const slope = (count * sumTimeDb - sumTime * sumDb) / denominator;

  // Reject slopes that do not represent decreasing energy
  if (slope >= 0) {
    return null;
  }

  const intercept = (sumDb - slope * sumTime) / count;

  const meanDb = sumDb / count;

  let totalVariation = 0;
  let errorVariation = 0;

  // Calculate the total variation and regression prediction error
  for (let i = startIndex; i <= endIndex; i++) {
    const time = i / sampleRate;

    const predicted = slope * time + intercept;

    totalVariation += (decayDb[i] - meanDb) * (decayDb[i] - meanDb);

    errorVariation += (decayDb[i] - predicted) * (decayDb[i] - predicted);
  }

  // Calculate R-squared to evaluate the regression fit
  const rSquared = totalVariation === 0 ? 0 : 1 - errorVariation / totalVariation;

  // Extrapolate the decay slope to estimate a 60 dB decay
  const rt60 = -60 / slope;

  const decayPoints: {
    time: number;
    db: number;
  }[] = [];

  const step = Math.max(1, Math.floor(decayDb.length / 100));

  // Sample the decay curve for visualization and limit it to -60 dB
  for (let i = 0; i < decayDb.length; i += step) {
    decayPoints.push({
      time: i / sampleRate,
      db: Math.max(-60, decayDb[i]),
    });
  }

  return {
    rt60: rt60,
    slope: slope,
    rSquared: rSquared,
    startTime: startIndex / sampleRate,
    endTime: endIndex / sampleRate,
    decayPoints: decayPoints,
  };
}

// Estimates RT60 at 500 Hz and 1000 Hz from an audio recording
export function estimateRT60(recording: Float32Array, sampleRate: number) {
  // Ensure the sample rate matches the filter coefficients
  if (sampleRate !== 48000) {
    return null;
  }

  // Extract the impulse response from the recording
  const result = getImpulseResponse(recording, sampleRate);

  if (!result) {
    return null;
  }

  const impulse = result.impulse;

  // Isolate the 500 Hz and 1000 Hz frequency bands
  const ir500 = sosFiltFilt(impulse, SOS_500);
  const ir1000 = sosFiltFilt(impulse, SOS_1000);

  // Calculate RT60 independently for each frequency band
  const analysis500 = measureRT60(ir500, sampleRate);
  const analysis1000 = measureRT60(ir1000, sampleRate);

  if (!analysis500 || !analysis1000) {
    return null;
  }

  // Calculate the average mid-frequency reverberation time
  const midRT60 = (analysis500.rt60 + analysis1000.rt60) / 2;

  // Return the acoustic measurements and visualization data
  return {
    rt60500: analysis500.rt60,
    rt601000: analysis1000.rt60,
    midRT60: midRT60,
    rSquared500: analysis500.rSquared,
    rSquared1000: analysis1000.rSquared,
    sweepStart: result.sweepStart,
    impulsePeak: result.impulsePeak,
    decayPoints500: analysis500.decayPoints,
    decayPoints1000: analysis1000.decayPoints,
  };
}