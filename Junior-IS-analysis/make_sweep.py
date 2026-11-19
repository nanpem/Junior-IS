import numpy as np
from scipy.io import wavfile

sample_rate = 48000

duration = 2.0
start_frequency = 200
end_frequency = 8000

length = int(
    duration * sample_rate
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

sweep = np.sin(
    phase
) * gain

sweep_int16 = np.int16(
    sweep * 32767
)

wavfile.write(
    "sweep.wav",
    sample_rate,
    sweep_int16
)

print(
    "Created sweep.wav"
)