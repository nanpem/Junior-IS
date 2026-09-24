import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View, Platform} from "react-native";

export default function App() {
  function startMeasurement() {
    console.log("New room measurement started");
  }

  function viewRecordings() {
    console.log("Viewing past recordings")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Acoustic Analyzer</Text>

      <Text style={styles.description}>
        Measure and analyze the acoustics of your room.
      </Text>

      <TouchableOpacity
        style={styles.startButton}
        onPress={startMeasurement}
      >
        <Text style={styles.buttonText}>New Room Measurement</Text>
      </TouchableOpacity>


    
      <TouchableOpacity
        style={styles.startButton}
        onPress={viewRecordings}
      >
        <Text style={styles.buttonText}>View Recordings</Text>
      </TouchableOpacity>
    

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
    textAlign: "center",
    marginBottom: 15,
  },

  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },

  startButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderRadius: 10,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Courier",
      android: "sans-serif-medium",
    }),
  },
});