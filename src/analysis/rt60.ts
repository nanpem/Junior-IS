import FFT from "fft.js";

const SWEEP_DURATION = 2;
const START_FREQUENCY = 200;
const END_FREQUENCY = 8000;

type SOS = [
  number,
  number,
  number,
  number,
  number,
  number
];

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

function nextPowerOfTwo(
  value: number
) {
  let size = 1;

  while (size < value) {
    size *= 2;
  }

  return size;
}

function normalize(
  signal: ArrayLike<number>
) {
  let maximum = 0;

  for (
    let i = 0;
    i < signal.length;
    i++
  ) {
    const value =
      Math.abs(signal[i]);

    if (value > maximum) {
      maximum = value;
    }
  }

  const result =
    new Float64Array(
      signal.length
    );

  if (maximum === 0) {
    return result;
  }

  for (
    let i = 0;
    i < signal.length;
    i++
  ) {
    result[i] =
      signal[i] /
      maximum;
  }

  return result;
}

function generateSweep(
  sampleRate: number
) {
  const length =
    Math.floor(
      SWEEP_DURATION *
        sampleRate
    );

  const sweep =
    new Float64Array(length);

  const frequencyRatio =
    END_FREQUENCY /
    START_FREQUENCY;

  const logRatio =
    Math.log(
      frequencyRatio
    );

  const fadeSamples =
    Math.floor(
      0.02 *
        sampleRate
    );

  for (
    let i = 0;
    i < length;
    i++
  ) {
    const time =
      i / sampleRate;

    const phase =
      (
        2 *
        Math.PI *
        START_FREQUENCY *
        SWEEP_DURATION /
        logRatio
      ) *
      (
        Math.exp(
          logRatio *
            time /
            SWEEP_DURATION
        ) - 1
      );

    let gain = 0.5;

    if (
      i < fadeSamples
    ) {
      gain *=
        i /
        fadeSamples;
    }

    if (
      i >=
      length -
        fadeSamples
    ) {
      gain *=
        (
          length -
          1 -
          i
        ) /
        fadeSamples;
    }

    sweep[i] =
      Math.sin(phase) *
      gain;
  }

  return sweep;
}

function fftConvolve(
  first: ArrayLike<number>,
  second: ArrayLike<number>
) {
  const outputLength =
    first.length +
    second.length -
    1;

  const fftSize =
    nextPowerOfTwo(
      outputLength
    );

  const fft =
    new FFT(fftSize);

  const firstInput =
    new Array<number>(
      fftSize
    ).fill(0);

  const secondInput =
    new Array<number>(
      fftSize
    ).fill(0);

  for (
    let i = 0;
    i < first.length;
    i++
  ) {
    firstInput[i] =
      first[i];
  }

  for (
    let i = 0;
    i < second.length;
    i++
  ) {
    secondInput[i] =
      second[i];
  }

  const firstSpectrum =
    fft.createComplexArray();

  const secondSpectrum =
    fft.createComplexArray();

  fft.realTransform(
    firstSpectrum,
    firstInput
  );

  fft.completeSpectrum(
    firstSpectrum
  );

  fft.realTransform(
    secondSpectrum,
    secondInput
  );

  fft.completeSpectrum(
    secondSpectrum
  );

  const resultSpectrum =
    fft.createComplexArray();

  for (
    let i = 0;
    i < fftSize;
    i++
  ) {
    const firstReal =
      firstSpectrum[
        2 * i
      ];

    const firstImaginary =
      firstSpectrum[
        2 * i + 1
      ];

    const secondReal =
      secondSpectrum[
        2 * i
      ];

    const secondImaginary =
      secondSpectrum[
        2 * i + 1
      ];

    resultSpectrum[
      2 * i
    ] =
      firstReal *
        secondReal -
      firstImaginary *
        secondImaginary;

    resultSpectrum[
      2 * i + 1
    ] =
      firstReal *
        secondImaginary +
      firstImaginary *
        secondReal;
  }

  const resultComplex =
    fft.createComplexArray();

  fft.inverseTransform(
    resultComplex,
    resultSpectrum
  );

  const result =
    new Float64Array(
      outputLength
    );

  for (
    let i = 0;
    i < outputLength;
    i++
  ) {
    result[i] =
      resultComplex[
        2 * i
      ];
  }

  return result;
}

function findSweepStart(
  recording:
    Float64Array,
  sweep:
    Float64Array
) {
  const reversedSweep =
    new Float64Array(
      sweep.length
    );

  for (
    let i = 0;
    i < sweep.length;
    i++
  ) {
    reversedSweep[i] =
      sweep[
        sweep.length -
        1 -
        i
      ];
  }

  const convolution =
    fftConvolve(
      recording,
      reversedSweep
    );

  const validLength =
    recording.length -
    sweep.length +
    1;

  if (
    validLength <= 0
  ) {
    return -1;
  }

  let bestIndex = 0;
  let bestValue = 0;

  for (
    let i = 0;
    i < validLength;
    i++
  ) {
    const convolutionIndex =
      i +
      sweep.length -
      1;

    const value =
      Math.abs(
        convolution[
          convolutionIndex
        ]
      );

    if (
      value >
      bestValue
    ) {
      bestValue = value;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function createInverseFilter(
  sweep:
    Float64Array,
  sampleRate: number
) {
  const inverse =
    new Float64Array(
      sweep.length
    );

  const L =
    SWEEP_DURATION /
    Math.log(
      END_FREQUENCY /
        START_FREQUENCY
    );

  let maximum = 0;

  for (
    let i = 0;
    i < sweep.length;
    i++
  ) {
    const time =
      i / sampleRate;

    const value =
      sweep[
        sweep.length -
        1 -
        i
      ] *
      Math.exp(
        -time / L
      );

    inverse[i] = value;

    const absolute =
      Math.abs(value);

    if (
      absolute >
      maximum
    ) {
      maximum = absolute;
    }
  }

  if (
    maximum > 0
  ) {
    for (
      let i = 0;
      i <
      inverse.length;
      i++
    ) {
      inverse[i] /=
        maximum;
    }
  }

  return inverse;
}

function getImpulseResponse(
  recording:
    Float32Array,
  sampleRate: number
) {
  const normalizedRecording =
    normalize(recording);

  const sweep =
    generateSweep(
      sampleRate
    );

  const sweepStart =
    findSweepStart(
      normalizedRecording,
      sweep
    );

  if (
    sweepStart < 0
  ) {
    return null;
  }

  const tailDuration = 3;

  const segmentEnd =
    Math.min(
      normalizedRecording.length,
      sweepStart +
        sweep.length +
        Math.floor(
          tailDuration *
            sampleRate
        )
    );

  const segment =
    normalizedRecording.slice(
      sweepStart,
      segmentEnd
    );

  const inverseFilter =
    createInverseFilter(
      sweep,
      sampleRate
    );

  const deconvolved =
    fftConvolve(
      segment,
      inverseFilter
    );

  let peakIndex = 0;
  let peakValue = 0;

  for (
    let i = 0;
    i <
    deconvolved.length;
    i++
  ) {
    const value =
      Math.abs(
        deconvolved[i]
      );

    if (
      value >
      peakValue
    ) {
      peakValue = value;
      peakIndex = i;
    }
  }

  const preSamples =
    Math.floor(
      0.01 *
        sampleRate
    );

  const start =
    Math.max(
      0,
      peakIndex -
        preSamples
    );

  const end =
    Math.min(
      deconvolved.length,
      peakIndex +
        Math.floor(
          2 *
            sampleRate
        )
    );

  const impulse =
    normalize(
      deconvolved.slice(
        start,
        end
      )
    );

  return {
    impulse:
      impulse,

    sweepStart:
      sweepStart /
      sampleRate,

    impulsePeak:
      peakIndex /
      sampleRate,
  };
}

function sosFilter(
  signal:
    Float64Array,
  sections:
    SOS[]
) {
  let current =
    Float64Array.from(
      signal
    );

  for (
    const section of
    sections
  ) {
    const [
      b0,
      b1,
      b2,
      a0,
      a1,
      a2,
    ] = section;

    const output =
      new Float64Array(
        current.length
      );

    let z1 = 0;
    let z2 = 0;

    for (
      let i = 0;
      i <
      current.length;
      i++
    ) {
      const input =
        current[i];

      const value =
        (
          b0 *
            input +
          z1
        ) /
        a0;

      z1 =
        b1 *
          input -
        a1 *
          value +
        z2;

      z2 =
        b2 *
          input -
        a2 *
          value;

      output[i] =
        value;
    }

    current =
      output;
  }

  return current;
}

function reverseSignal(
  signal:
    Float64Array
) {
  const result =
    new Float64Array(
      signal.length
    );

  for (
    let i = 0;
    i <
    signal.length;
    i++
  ) {
    result[i] =
      signal[
        signal.length -
        1 -
        i
      ];
  }

  return result;
}

function oddPad(
  signal:
    Float64Array,
  padLength: number
) {
  const padded =
    new Float64Array(
      signal.length +
      padLength * 2
    );

  for (
    let i = 0;
    i < padLength;
    i++
  ) {
    padded[i] =
      2 *
        signal[0] -
      signal[
        padLength -
        i
      ];
  }

  padded.set(
    signal,
    padLength
  );

  const last =
    signal.length -
    1;

  for (
    let i = 0;
    i < padLength;
    i++
  ) {
    padded[
      padLength +
        signal.length +
        i
    ] =
      2 *
        signal[last] -
      signal[
        last -
        1 -
        i
      ];
  }

  return padded;
}

function sosFiltFilt(
  signal:
    Float64Array,
  sections:
    SOS[]
) {
  if (
    signal.length < 30
  ) {
    return signal;
  }

  const padLength = 27;

  const padded =
    oddPad(
      signal,
      padLength
    );

  const forward =
    sosFilter(
      padded,
      sections
    );

  const reversed =
    reverseSignal(
      forward
    );

  const backward =
    sosFilter(
      reversed,
      sections
    );

  const restored =
    reverseSignal(
      backward
    );

  return restored.slice(
    padLength,
    padLength +
      signal.length
  );
}

function measureRT60(
  signal:
    Float64Array,
  sampleRate: number
) {
  const energy =
    new Float64Array(
      signal.length
    );

  let total = 0;

  for (
    let i =
      signal.length - 1;
    i >= 0;
    i--
  ) {
    total +=
      signal[i] *
      signal[i];

    energy[i] =
      total;
  }

  if (
    energy.length === 0 ||
    energy[0] <= 0
  ) {
    return null;
  }

  const decayDb =
    new Float64Array(
      energy.length
    );

  for (
    let i = 0;
    i <
    energy.length;
    i++
  ) {
    decayDb[i] =
      10 *
      Math.log10(
        energy[i] /
          energy[0]
      );
  }

  let startIndex = -1;
  let endIndex = -1;

  for (
    let i = 0;
    i <
    decayDb.length;
    i++
  ) {
    if (
      startIndex === -1 &&
      decayDb[i] <= -5
    ) {
      startIndex = i;
    }

    if (
      startIndex !== -1 &&
      decayDb[i] <= -25
    ) {
      endIndex = i;
      break;
    }
  }

  if (
    startIndex === -1 ||
    endIndex === -1 ||
    endIndex <=
      startIndex
  ) {
    return null;
  }

  let count = 0;

  let sumTime = 0;
  let sumDb = 0;

  let sumTimeDb = 0;

  let sumTimeSquared =
    0;

  for (
    let i = startIndex;
    i <= endIndex;
    i++
  ) {
    const time =
      i / sampleRate;

    const db =
      decayDb[i];

    count++;

    sumTime += time;

    sumDb += db;

    sumTimeDb +=
      time * db;

    sumTimeSquared +=
      time * time;
  }

  const denominator =
    count *
      sumTimeSquared -
    sumTime *
      sumTime;

  if (
    denominator === 0
  ) {
    return null;
  }

  const slope =
    (
      count *
        sumTimeDb -
      sumTime *
        sumDb
    ) /
    denominator;

  if (
    slope >= 0
  ) {
    return null;
  }

  const intercept =
    (
      sumDb -
      slope *
        sumTime
    ) /
    count;

  const meanDb =
    sumDb /
    count;

  let totalVariation = 0;

  let errorVariation = 0;

  for (
    let i = startIndex;
    i <= endIndex;
    i++
  ) {
    const time =
      i / sampleRate;

    const predicted =
      slope *
        time +
      intercept;

    totalVariation +=
      (
        decayDb[i] -
        meanDb
      ) *
      (
        decayDb[i] -
        meanDb
      );

    errorVariation +=
      (
        decayDb[i] -
        predicted
      ) *
      (
        decayDb[i] -
        predicted
      );
  }

  const rSquared =
    totalVariation === 0
      ? 0
      : 1 -
        errorVariation /
          totalVariation;

  const rt60 =
    -60 /
    slope;

  const decayPoints: {
    time: number;
    db: number;
  }[] = [];

  const step =
    Math.max(
      1,
      Math.floor(
        decayDb.length /
          100
      )
    );

  for (
    let i = 0;
    i <
    decayDb.length;
    i += step
  ) {
    decayPoints.push({
      time:
        i /
        sampleRate,

      db:
        Math.max(
          -60,
          decayDb[i]
        ),
    });
  }

  return {
    rt60:
      rt60,

    slope:
      slope,

    rSquared:
      rSquared,

    startTime:
      startIndex /
      sampleRate,

    endTime:
      endIndex /
      sampleRate,

    decayPoints:
      decayPoints,
  };
}

export function estimateRT60(
  recording:
    Float32Array,
  sampleRate: number
) {
  if (
    sampleRate !== 48000
  ) {
    return null;
  }

  const result =
    getImpulseResponse(
      recording,
      sampleRate
    );

  if (!result) {
    return null;
  }

  const impulse =
    result.impulse;

  const ir500 =
    sosFiltFilt(
      impulse,
      SOS_500
    );

  const ir1000 =
    sosFiltFilt(
      impulse,
      SOS_1000
    );

  const analysis500 =
    measureRT60(
      ir500,
      sampleRate
    );

  const analysis1000 =
    measureRT60(
      ir1000,
      sampleRate
    );

  if (
    !analysis500 ||
    !analysis1000
  ) {
    return null;
  }

  const midRT60 =
    (
      analysis500.rt60 +
      analysis1000.rt60
    ) /
    2;

  return {
    rt60500:
      analysis500.rt60,

    rt601000:
      analysis1000.rt60,

    midRT60:
      midRT60,

    rSquared500:
      analysis500.rSquared,

    rSquared1000:
      analysis1000.rSquared,

    sweepStart:
      result.sweepStart,

    impulsePeak:
      result.impulsePeak,

    decayPoints500:
      analysis500.decayPoints,

    decayPoints1000:
      analysis1000.decayPoints,
  };
}