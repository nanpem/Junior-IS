import FFT from "fft.js";

function nextPowerOfTwo(
  value: number
) {
  let size = 1;

  while (size < value) {
    size *= 2;
  }

  return size;
}

function generateSweep(
  sampleRate: number
) {
  const duration = 2;

  const startFrequency =
    200;

  const endFrequency =
    8000;

  const length =
    Math.floor(
      duration *
      sampleRate
    );

  const sweep =
    new Array<number>(
      length
    );

  const frequencyRatio =
    endFrequency /
    startFrequency;

  const logRatio =
    Math.log(
      frequencyRatio
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
        startFrequency *
        duration /
        logRatio
      ) *
      (
        Math.exp(
          logRatio *
          time /
          duration
        ) - 1
      );

    let gain = 0.5;

    if (time < 0.02) {
      gain =
        0.5 *
        (time / 0.02);
    }

    if (
      time >
      duration - 0.02
    ) {
      gain =
        0.5 *
        (
          (duration - time) /
          0.02
        );
    }

    sweep[i] =
      Math.sin(phase) *
      gain;
  }

  return sweep;
}

function getImpulseResponse(
  recording: Float32Array,
  sampleRate: number
) {
  const sweep =
    generateSweep(
      sampleRate
    );

  const fftSize =
    nextPowerOfTwo(
      recording.length +
      sweep.length
    );

  const fft =
    new FFT(
      fftSize
    );

  const recordingInput =
    new Array(
      fftSize
    ).fill(0);

  const sweepInput =
    new Array(
      fftSize
    ).fill(0);

  for (
    let i = 0;
    i < recording.length;
    i++
  ) {
    recordingInput[i] =
      recording[i];
  }

  for (
    let i = 0;
    i < sweep.length;
    i++
  ) {
    sweepInput[i] =
      sweep[i];
  }

  const recordingSpectrum =
    fft.createComplexArray();

  const sweepSpectrum =
    fft.createComplexArray();

  fft.realTransform(
    recordingSpectrum,
    recordingInput
  );

  fft.completeSpectrum(
    recordingSpectrum
  );

  fft.realTransform(
    sweepSpectrum,
    sweepInput
  );

  fft.completeSpectrum(
    sweepSpectrum
  );

  let maximumPower = 0;

  for (
    let i = 0;
    i < fftSize;
    i++
  ) {
    const real =
      sweepSpectrum[
        2 * i
      ];

    const imaginary =
      sweepSpectrum[
        2 * i + 1
      ];

    const power =
      real * real +
      imaginary *
      imaginary;

    if (
      power >
      maximumPower
    ) {
      maximumPower =
        power;
    }
  }

  const epsilon =
    maximumPower *
    0.00000001;

  const responseSpectrum =
    fft.createComplexArray();

  for (
    let i = 0;
    i < fftSize;
    i++
  ) {
    const recordingReal =
      recordingSpectrum[
        2 * i
      ];

    const recordingImaginary =
      recordingSpectrum[
        2 * i + 1
      ];

    const sweepReal =
      sweepSpectrum[
        2 * i
      ];

    const sweepImaginary =
      sweepSpectrum[
        2 * i + 1
      ];

    const denominator =
      sweepReal *
        sweepReal +
      sweepImaginary *
        sweepImaginary +
      epsilon;

    responseSpectrum[
      2 * i
    ] =
      (
        recordingReal *
          sweepReal +
        recordingImaginary *
          sweepImaginary
      ) /
      denominator;

    responseSpectrum[
      2 * i + 1
    ] =
      (
        recordingImaginary *
          sweepReal -
        recordingReal *
          sweepImaginary
      ) /
      denominator;
  }

  const impulseComplex =
    fft.createComplexArray();

  fft.inverseTransform(
    impulseComplex,
    responseSpectrum
  );

  const impulse =
    new Float32Array(
      fftSize
    );

  for (
    let i = 0;
    i < fftSize;
    i++
  ) {
    impulse[i] =
      impulseComplex[
        2 * i
      ];
  }

  return impulse;
}

export function estimateRT60(
  recording: Float32Array,
  sampleRate: number
) {
  const impulse =
    getImpulseResponse(
      recording,
      sampleRate
    );

  let peakIndex = 0;
  let peakValue = 0;

  const peakSearchLength =
    Math.min(
      recording.length,
      impulse.length
    );

  for (
    let i = 0;
    i < peakSearchLength;
    i++
  ) {
    const value =
      Math.abs(
        impulse[i]
      );

    if (
      value >
      peakValue
    ) {
      peakValue =
        value;

      peakIndex = i;
    }
  }

  const maxLength =
    Math.floor(
      sampleRate * 5
    );

  const endIndex =
    Math.min(
      peakIndex +
        maxLength,
      recording.length,
      impulse.length
    );

  const response =
    impulse.slice(
      peakIndex,
      endIndex
    );

  if (
    response.length === 0
  ) {
    return null;
  }

  const noiseStart =
    Math.floor(
      response.length *
      0.9
    );

  let noiseEnergy = 0;
  let noiseCount = 0;

  for (
    let i =
      noiseStart;
    i <
      response.length;
    i++
  ) {
    noiseEnergy +=
      response[i] *
      response[i];

    noiseCount++;
  }

  if (
    noiseCount === 0
  ) {
    return null;
  }

  const averageNoiseEnergy =
    noiseEnergy /
    noiseCount;

  const blockSize =
    Math.max(
      1,
      Math.floor(
        sampleRate *
        0.02
      )
    );

  const minimumCutoffIndex =
    Math.floor(
      sampleRate *
      0.2
    );

  const noiseThreshold =
    averageNoiseEnergy *
    10;

  const blockEnergies:
    number[] = [];

  const blockStarts:
    number[] = [];

  for (
    let start =
      minimumCutoffIndex;
    start <
      noiseStart;
    start +=
      blockSize
  ) {
    const end =
      Math.min(
        start +
          blockSize,
        response.length
      );

    let blockEnergy = 0;

    for (
      let i = start;
      i < end;
      i++
    ) {
      blockEnergy +=
        response[i] *
        response[i];
    }

    const averageBlockEnergy =
      blockEnergy /
      (end - start);

    blockEnergies.push(
      averageBlockEnergy
    );

    blockStarts.push(
      start
    );
  }

  const smoothingBlocks =
    5;

  const smoothedEnergies:
    number[] = [];

  for (
    let i = 0;
    i <
      blockEnergies.length;
    i++
  ) {
    const start =
      Math.max(
        0,
        i -
          smoothingBlocks +
          1
      );

    let sum = 0;
    let count = 0;

    for (
      let j = start;
      j <= i;
      j++
    ) {
      sum +=
        blockEnergies[j];

      count++;
    }

    smoothedEnergies.push(
      sum / count
    );
  }

  const requiredQuietBlocks =
    5;

  let quietBlocks = 0;
  let cutoffIndex = -1;

  for (
    let i = 0;
    i <
      smoothedEnergies.length;
    i++
  ) {
    if (
      smoothedEnergies[i] <=
      noiseThreshold
    ) {
      quietBlocks++;
    } else {
      quietBlocks = 0;
    }

    if (
      quietBlocks >=
      requiredQuietBlocks
    ) {
      const firstQuietBlock =
        i -
        requiredQuietBlocks +
        1;

      cutoffIndex =
        blockStarts[
          firstQuietBlock
        ];

      break;
    }
  }

  if (
    cutoffIndex === -1
  ) {
    return null;
  }

  const cutoffResponse =
    response.slice(
      0,
      cutoffIndex
    );

  if (
    cutoffResponse.length ===
    0
  ) {
    return null;
  }

  const energy =
    new Float64Array(
      cutoffResponse.length
    );

  let totalEnergy = 0;

  for (
    let i =
      cutoffResponse.length -
      1;
    i >= 0;
    i--
  ) {
    totalEnergy +=
      cutoffResponse[i] *
      cutoffResponse[i];

    energy[i] =
      totalEnergy;
  }

  if (
    energy[0] <= 0
  ) {
    return null;
  }

  const decayDb =
    new Float64Array(
      cutoffResponse.length
    );

  for (
    let i = 0;
    i <
      decayDb.length;
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
  let endIndexT20 = -1;

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
      endIndexT20 = i;

      break;
    }
  }

  if (
    startIndex === -1 ||
    endIndexT20 === -1
  ) {
    return null;
  }

  const startTime =
    startIndex /
    sampleRate;

  const endTime =
    endIndexT20 /
    sampleRate;

  let count = 0;
  let sumTime = 0;
  let sumDb = 0;
  let sumTimeDb = 0;
  let sumTimeSquared = 0;

  for (
    let i =
      startIndex;
    i <=
      endIndexT20;
    i++
  ) {
    const time =
      i / sampleRate;

    count++;

    sumTime +=
      time;

    sumDb +=
      decayDb[i];

    sumTimeDb +=
      time *
      decayDb[i];

    sumTimeSquared +=
      time *
      time;
  }

  if (
    count < 2
  ) {
    return null;
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
  let unexplainedVariation =
    0;

  for (
    let i =
      startIndex;
    i <=
      endIndexT20;
    i++
  ) {
    const time =
      i / sampleRate;

    const predictedDb =
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

    unexplainedVariation +=
      (
        decayDb[i] -
        predictedDb
      ) *
      (
        decayDb[i] -
        predictedDb
      );
  }

  if (
    totalVariation === 0
  ) {
    return null;
  }

  const rSquared =
    1 -
    unexplainedVariation /
      totalVariation;

  const rt60 =
    -60 /
    slope;

  const decayPoints = [];

  const numberOfPoints =
    80;

  const pointStep =
    Math.max(
      1,
      Math.floor(
        decayDb.length /
        numberOfPoints
      )
    );

  for (
    let i = 0;
    i <
      decayDb.length;
    i +=
      pointStep
  ) {
    decayPoints.push({
      time:
        i /
        sampleRate,

      db:
        Math.max(
          decayDb[i],
          -60
        ),
    });
  }

  return {
    rt60: rt60,
    slope: slope,
    rSquared:
      rSquared,
    startTime:
      startTime,
    endTime:
      endTime,
    noiseCutoffTime:
      cutoffIndex /
      sampleRate,
    decayPoints:
      decayPoints,
  };
}