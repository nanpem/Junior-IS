import { File, Paths } from "expo-file-system";
import { Measurement } from "../types/Measurement";

const measurementsFile = new File(
  Paths.document,
  "measurements.json"
);

export async function getMeasurements(): Promise<Measurement[]> {
  if (!measurementsFile.exists) {
    return [];
  }

  const text = await measurementsFile.text();

  if (text.trim() === "") {
    return [];
  }

  return JSON.parse(text);
}

export async function saveMeasurement(
  measurement: Measurement
) {
  const measurements = await getMeasurements();

  measurements.push(measurement);

  if (!measurementsFile.exists) {
    measurementsFile.create();
  }

  await measurementsFile.write(
    JSON.stringify(measurements, null, 2)
  );
}