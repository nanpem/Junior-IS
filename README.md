# Room Acoustic Analyzer

## Overview

The Room Acoustic Analyzer is a smartphone-based application developed for my Junior Independent Study at The College of Wooster. The project investigates how smartphones, digital signal processing and spatial prediction techniques can be used to measure and visualize room acoustics.

The application records a logarithmic frequency sweep played from an external sound source, extracts the room impulse response and estimates reverberation time (RT60).

## Features

- Record and save lossless WAV audio files.
- Record room dimensions and measurement coordinates.
- Calculate RT60 for the 500 Hz and 1000 Hz frequency bands.
- Calculate mid-frequency RT60.
- View, play and analyze previously saved measurements.
- Export audio recordings for external analysis.
- Import WAV files for algorithm validation.
- Generate acoustic heatmaps through spatial interpolation in Python.

## Signal Processing Pipeline

1. Record a logarithmic frequency sweep from 200 Hz to 8000 Hz.
2. Locate the sweep within the recording using cross-correlation.
3. Extract the room impulse response through FFT-based deconvolution.
4. Apply bandpass filters using Second-Order Sections (SOS).
5. Calculate energy decay using Schroeder backward integration.
6. Perform linear regression over the −5 dB to −25 dB decay range.
7. Estimate RT60 using the T20 method.

## Machine Learning and Spatial Interpolation

A Multilayer Perceptron (MLP) was developed to investigate whether RT60 could be predicted at unmeasured locations within a room.

The experiments used 47 real acoustic measurements collected across five rooms. Synthetic data generated using Inverse Distance Weighting (IDW) was used to investigate the effectiveness of data augmentation.

Prediction performance was evaluated using Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).

Although data augmentation improved neural network performance, the room-average baseline remained more accurate.

IDW was used to generate acoustic heatmaps by predicting RT60 across a 100 × 100 grid for each room.

## Technologies Used

**Mobile Application**

- React Native
- Expo
- TypeScript
- React Native Audio API
- Expo Audio
- Expo File System
- FFT.js

**Data Analysis**

- Python
- NumPy
- Pandas
- Scikit-learn
- Matplotlib
- SciPy

## Installation

Clone the repository:

```bash
git clone https://github.com/katari433/Junior-IS.git
cd Junior-IS
```

Install the application dependencies:

```bash
npm install
```

Build and run the application on a connected iPhone:

```bash
npx expo run:ios --device --configuration Release
```

Running the application on a physical iPhone requires macOS, Xcode and appropriate iOS development signing.

## Taking a Room Measurement

1. Select New Room Measurement.
2. Grant microphone permission.
3. Enter the room name and dimensions.
4. Enter the measurement coordinates.
5. Wait for the countdown to finish.
6. Play the test sweep from an external device while the application records.
7. Wait for the RT60 results to be displayed.

Previously saved measurements can be accessed through the View Recordings screen.

## Python Analysis

The `Junior-IS-analysis` directory contains the acoustic analysis dataset, spatial prediction experiments and heatmap generation scripts.

Navigate to the analysis directory:

```bash
cd Junior-IS-analysis
```

Create a Python virtual environment and install the required packages:

```bash
python3 -m venv venv
source venv/bin/activate
pip install numpy pandas scikit-learn matplotlib scipy
```

Run the machine learning experiments:

```bash
python train_spatial_model.py
```

Generate IDW heatmaps and evaluate spatial interpolation:

```bash
python spatial_interpolation.py
```

## Validation

The TypeScript RT60 implementation was compared against an independent Python implementation to evaluate consistency.

The application also supports importing external test recordings to evaluate the accuracy of its RT60 estimation algorithm.

## Limitations

- Measurements may be affected by background noise and smartphone microphone characteristics.
- The current implementation requires an external device to play the frequency sweep.
- The machine learning model is limited by the size of the collected dataset.
- Acoustic heatmaps are generated externally using Python rather than directly within the mobile application.

## Future Work

- Collect more acoustic measurements across a wider variety of rooms.
- Improve spatial prediction accuracy.
- Integrate acoustic heatmap generation into the mobile application.
- Investigate additional acoustic metrics and frequency bands.
