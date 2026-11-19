import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt

# Load the acoustic measurement dataset
data = pd.read_csv("measurements.csv")


# Predicts RT60 at a given location using inverse distance weighting
def predict_idw(train_x, train_y, train_rt60, test_x, test_y, power=2):

    # Calculate distances between the target and known measurement locations
    distances = np.sqrt((train_x - test_x) ** 2 + (train_y - test_y) ** 2)

    # Return the measured RT60 if the coordinates match exactly
    if np.any(distances == 0):
        return train_rt60[np.argmin(distances)]

    
    weights = 1 / (distances ** power)

    # Calculate the weighted average RT60
    return np.sum(weights * train_rt60) / np.sum(weights)


# Store actual and predicted RT60 values across all rooms
actual_values = []
predicted_values = []

# Evaluate IDW using leave-one-out cross-validation within each room
for room in data["room"].unique():

    room_data = data[data["room"] == room].reset_index(drop=True)

    for i in range(len(room_data)):

        # Hold out one measurement for testing
        test_point = room_data.iloc[i]
        train_data = room_data.drop(i)

        # Predict RT60 using the remaining measurements
        prediction = predict_idw(
            train_data["x"].values,
            train_data["y"].values,
            train_data["rt60"].values,
            test_point["x"],
            test_point["y"]
        )

        actual_values.append(test_point["rt60"])
        predicted_values.append(prediction)


# Calculate overall IDW prediction errors
mae = mean_absolute_error(actual_values, predicted_values)
rmse = np.sqrt(mean_squared_error(actual_values, predicted_values))

print("IDW RESULTS")
print("MAE:", round(mae, 3))
print("RMSE:", round(rmse, 3))


# Generate an RT60 heatmap for each room
for room in data["room"].unique():

    room_data = data[data["room"] == room]

    # Retrieve the room dimensions
    width = room_data["width"].iloc[0]
    length = room_data["length"].iloc[0]

    # Create a grid of 10,000 prediction locations
    grid_x = np.linspace(0, width, 100)
    grid_y = np.linspace(0, length, 100)

    heatmap = np.zeros((100, 100))

    # Predict RT60 at every location in the grid
    for y_index, y_value in enumerate(grid_y):
        for x_index, x_value in enumerate(grid_x):

            heatmap[y_index, x_index] = predict_idw(
                room_data["x"].values,
                room_data["y"].values,
                room_data["rt60"].values,
                x_value,
                y_value
            )

    # Display predicted RT60 values across the room
    plt.figure()

    plt.imshow(
        heatmap,
        origin="lower",
        extent=[0, width, 0, length],
        aspect="auto"
    )

    plt.colorbar(label="Predicted RT60 (s)")

    # Overlay the actual measurement locations
    plt.scatter(room_data["x"], room_data["y"])

    plt.xlabel("Room width (m)")
    plt.ylabel("Room length (m)")
    plt.title(room + " RT60 Heatmap")

    plt.show()


print("\nPER-ROOM IDW RESULTS")

# Evaluate IDW prediction accuracy for each room individually
for room in data["room"].unique():

    room_data = data[data["room"] == room].reset_index(drop=True)

    room_actual = []
    room_predicted = []

    # Perform leave-one-out cross-validation
    for i in range(len(room_data)):

        test_point = room_data.iloc[i]
        train_data = room_data.drop(i)

        prediction = predict_idw(
            train_data["x"].values,
            train_data["y"].values,
            train_data["rt60"].values,
            test_point["x"],
            test_point["y"]
        )

        room_actual.append(test_point["rt60"])
        room_predicted.append(prediction)

    # Calculate prediction errors for the current room
    room_mae = mean_absolute_error(room_actual, room_predicted)
    room_rmse = np.sqrt(mean_squared_error(room_actual, room_predicted))

    print(room, "| MAE:", round(room_mae, 3), "| RMSE:", round(room_rmse, 3))


print("\nPER-ROOM BASELINE RESULTS")

# Evaluate the room-average baseline for comparison with IDW
for room in data["room"].unique():

    room_data = data[data["room"] == room].reset_index(drop=True)

    room_actual = []
    room_predicted = []

    # Perform leave-one-out cross-validation using the room average
    for i in range(len(room_data)):

        test_point = room_data.iloc[i]
        train_data = room_data.drop(i)

        # Predict RT60 using the mean of the remaining measurements
        prediction = train_data["rt60"].mean()

        room_actual.append(test_point["rt60"])
        room_predicted.append(prediction)

    # Calculate baseline prediction errors for the current room
    room_mae = mean_absolute_error(room_actual, room_predicted)
    room_rmse = np.sqrt(mean_squared_error(room_actual, room_predicted))

    print(room, "| MAE:", round(room_mae, 3), "| RMSE:", round(room_rmse, 3))