import numpy as np
import matplotlib.pyplot as plt

from scipy.io import wavfile
from scipy.signal import correlate, fftconvolve, butter, sosfiltfilt

from pyroomacoustics.experimental.rt60 import measure_rt60


# -------------------------
# Load recording
# -------------------------

sample_rate, audio = wavfile.read("test.wav")

audio = audio.astype(np.float64)

audio = audio / np.max(
    np.abs(audio)
)


# -------------------------
# Recreate exact sweep
# -------------------------

duration = 2.0

start_frequency = 200

end_frequency = 8000

length = int(
    duration *
    sample_rate
)

t = np.arange(
    length
) / sample_rate


frequency_ratio = (
    end_frequency /
    start_frequency
)

log_ratio = np.log(
    frequency_ratio
)


phase = (
    2
    * np.pi
    * start_frequency
    * duration
    / log_ratio
) * (
    np.exp(
        log_ratio
        * t
        / duration
    ) - 1
)


gain = np.ones(
    length
) * 0.5


fade_samples = int(
    0.02 *
    sample_rate
)


gain[:fade_samples] *= np.linspace(
    0,
    1,
    fade_samples
)


gain[-fade_samples:] *= np.linspace(
    1,
    0,
    fade_samples
)


sweep = (
    np.sin(phase)
    * gain
)


# -------------------------
# Find sweep in recording
# -------------------------

correlation = correlate(
    audio,
    sweep,
    mode="valid",
    method="fft"
)


sweep_start = np.argmax(
    np.abs(correlation)
)


print(
    "Sweep start:",
    sweep_start /
    sample_rate,
    "seconds"
)


# -------------------------
# Extract sweep + decay
# -------------------------

tail_duration = 3.0


segment_end = min(
    len(audio),

    sweep_start
    + len(sweep)
    + int(
        tail_duration
        * sample_rate
    )
)


recorded_segment = audio[
    sweep_start:
    segment_end
]


# -------------------------
# Farina inverse filter
# -------------------------

L = (
    duration /
    np.log(
        end_frequency /
        start_frequency
    )
)


inverse_filter = (
    sweep[::-1].copy()
)


inverse_time = (
    np.arange(
        len(inverse_filter)
    )
    / sample_rate
)


inverse_filter *= np.exp(
    -inverse_time /
    L
)


inverse_filter /= np.max(
    np.abs(
        inverse_filter
    )
)


# -------------------------
# Recover impulse response
# -------------------------

impulse_response = fftconvolve(
    recorded_segment,
    inverse_filter,
    mode="full"
)


peak_index = np.argmax(
    np.abs(
        impulse_response
    )
)


print(
    "Impulse peak:",
    peak_index /
    sample_rate,
    "seconds"
)


# -------------------------
# Crop impulse response
# -------------------------

pre_samples = int(
    0.01 *
    sample_rate
)


start = max(
    0,
    peak_index -
    pre_samples
)


end = min(
    len(
        impulse_response
    ),
    peak_index
    + int(
        2 *
        sample_rate
    )
)


impulse_response = (
    impulse_response[
        start:end
    ]
)


impulse_response /= np.max(
    np.abs(
        impulse_response
    )
)


# -------------------------
# Octave-band filter
# -------------------------

def octave_band(
    signal,
    center_frequency
):

    low = (
        center_frequency /
        np.sqrt(2)
    )

    high = (
        center_frequency *
        np.sqrt(2)
    )

    sos = butter(
        4,
        [low, high],
        btype="bandpass",
        fs=sample_rate,
        output="sos"
    )

    filtered = sosfiltfilt(
        sos,
        signal
    )

    return filtered


# -------------------------
# 500 Hz band
# -------------------------

ir_500 = octave_band(
    impulse_response,
    500
)


# -------------------------
# 1000 Hz band
# -------------------------

ir_1000 = octave_band(
    impulse_response,
    1000
)


# -------------------------
# RT60 from T20
# -------------------------

rt60_500 = measure_rt60(
    ir_500,
    fs=sample_rate,
    decay_db=20,
    plot=True
)


rt60_1000 = measure_rt60(
    ir_1000,
    fs=sample_rate,
    decay_db=20,
    plot=True
)


mid_rt60 = (
    rt60_500
    + rt60_1000
) / 2


print(
    "500 Hz RT60:",
    rt60_500,
    "seconds"
)


print(
    "1000 Hz RT60:",
    rt60_1000,
    "seconds"
)


print(
    "Mid RT60:",
    mid_rt60,
    "seconds"
)


# -------------------------
# Plot full impulse response
# -------------------------

time = (
    np.arange(
        len(
            impulse_response
        )
    )
    / sample_rate
)


plt.figure()

plt.plot(
    time,
    impulse_response
)

plt.xlabel(
    "Time after direct arrival (s)"
)

plt.ylabel(
    "Amplitude"
)

plt.title(
    "Impulse Response"
)

plt.xlim(
    0,
    2
)


# -------------------------
# Plot 500 Hz response
# -------------------------

plt.figure()

plt.plot(
    time,
    ir_500
)

plt.xlabel(
    "Time after direct arrival (s)"
)

plt.ylabel(
    "Amplitude"
)

plt.title(
    "500 Hz Impulse Response"
)

plt.xlim(
    0,
    2
)


# -------------------------
# Plot 1000 Hz response
# -------------------------

plt.figure()

plt.plot(
    time,
    ir_1000
)

plt.xlabel(
    "Time after direct arrival (s)"
)

plt.ylabel(
    "Amplitude"
)

plt.title(
    "1000 Hz Impulse Response"
)

plt.xlim(
    0,
    2
)


plt.show()