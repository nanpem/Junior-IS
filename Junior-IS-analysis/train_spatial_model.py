import pandas as pd
import numpy as np
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.callbacks import EarlyStopping


data = pd.read_csv("measurements.csv")

data["x_normalized"] = data["x"] / data["width"]
data["y_normalized"] = data["y"] / data["length"]


def predict_idw(
    train_x,
    train_y,
    train_rt60,
    test_x,
    test_y,
    power=2
):
    distances = np.sqrt(
        (train_x - test_x) ** 2 +
        (train_y - test_y) ** 2
    )

    if np.any(distances == 0):
        return train_rt60[np.argmin(distances)]

    weights = 1 / (distances ** power)

    return np.sum(
        weights * train_rt60
    ) / np.sum(weights)


def create_synthetic_points(
    train_data,
    points_per_room=200,
    seed=1
):
    rng = np.random.default_rng(seed)

    synthetic_rows = []

    for room in train_data["room"].unique():

        room_data = train_data[
            train_data["room"] == room
        ]

        width = room_data["width"].iloc[0]
        length = room_data["length"].iloc[0]

        train_x = room_data["x"].values
        train_y = room_data["y"].values
        train_rt60 = room_data["rt60"].values

        for _ in range(points_per_room):

            x = rng.uniform(
                0,
                width
            )

            y = rng.uniform(
                0,
                length
            )

            rt60 = predict_idw(
                train_x,
                train_y,
                train_rt60,
                x,
                y
            )

            synthetic_rows.append({
                "room": room,
                "x": x,
                "y": y,
                "width": width,
                "length": length,
                "rt60": rt60
            })

    return pd.DataFrame(
        synthetic_rows
    )


augmentation_sizes = [
    0,
    50,
    100,
    200,
    500
]

seeds = [
    1, 2, 3, 4, 5,
    6, 7, 8, 9, 10
]

results = []


for points_per_room in augmentation_sizes:

    mlp_maes = []
    mlp_rmses = []

    for seed in seeds:

        train_data, test_data = train_test_split(
            data,
            test_size=0.25,
            random_state=seed,
            stratify=data["room"]
        )

        if points_per_room == 0:

            combined_train = train_data.copy()

        else:

            synthetic_data = create_synthetic_points(
                train_data,
                points_per_room=points_per_room,
                seed=seed
            )

            combined_train = pd.concat(
                [
                    train_data,
                    synthetic_data
                ],
                ignore_index=True
            )


        combined_train["x_normalized"] = (
            combined_train["x"] /
            combined_train["width"]
        )

        combined_train["y_normalized"] = (
            combined_train["y"] /
            combined_train["length"]
        )


        test_data = test_data.copy()

        test_data["x_normalized"] = (
            test_data["x"] /
            test_data["width"]
        )

        test_data["y_normalized"] = (
            test_data["y"] /
            test_data["length"]
        )


        all_rooms = sorted(
            data["room"].unique()
        )


        for room in all_rooms:

            combined_train[
                "room_" + room
            ] = (
                combined_train["room"] == room
            ).astype(int)

            test_data[
                "room_" + room
            ] = (
                test_data["room"] == room
            ).astype(int)


        feature_columns = [
            "x_normalized",
            "y_normalized",
            "width",
            "length"
        ] + [
            "room_" + room
            for room in all_rooms
        ]


        X_train = combined_train[
            feature_columns
        ]

        y_train = combined_train[
            "rt60"
        ]


        X_test = test_data[
            feature_columns
        ]

        y_test = test_data[
            "rt60"
        ]


        scaler = StandardScaler()

        X_train_scaled = scaler.fit_transform(
            X_train
        )

        X_test_scaled = scaler.transform(
            X_test
        )


        tf.random.set_seed(seed)
        np.random.seed(seed)


        model = Sequential([
            Dense(
                16,
                activation="relu",
                input_shape=(
                    X_train_scaled.shape[1],
                )
            ),

            Dense(
                8,
                activation="relu"
            ),

            Dense(1)
        ])


        model.compile(
            optimizer="adam",
            loss="mse"
        )


        early_stop = EarlyStopping(
            monitor="val_loss",
            patience=30,
            restore_best_weights=True
        )


        model.fit(
            X_train_scaled,
            y_train,
            epochs=500,
            batch_size=16,
            validation_split=0.2,
            callbacks=[early_stop],
            verbose=0
        )


        predictions = model.predict(
            X_test_scaled,
            verbose=0
        ).flatten()


        mae = mean_absolute_error(
            y_test,
            predictions
        )

        rmse = np.sqrt(
            mean_squared_error(
                y_test,
                predictions
            )
        )


        mlp_maes.append(mae)
        mlp_rmses.append(rmse)


    average_mae = np.mean(
        mlp_maes
    )

    average_rmse = np.mean(
        mlp_rmses
    )


    results.append({
        "points": points_per_room,
        "mae": average_mae,
        "rmse": average_rmse
    })


    print(
        "Synthetic points per room:",
        points_per_room,
        "| MAE:",
        round(average_mae, 3),
        "| RMSE:",
        round(average_rmse, 3)
    )


print("\nFINAL RESULTS")

for result in results:

    print(
        result["points"],
        "points per room",
        "| MAE:",
        round(result["mae"], 3),
        "| RMSE:",
        round(result["rmse"], 3)
    )


import matplotlib.pyplot as plt


points = [
    result["points"]
    for result in results
]

maes = [
    result["mae"]
    for result in results
]

rmses = [
    result["rmse"]
    for result in results
]


plt.figure()

plt.plot(
    points,
    maes,
    marker="o",
    label="MAE"
)

plt.plot(
    points,
    rmses,
    marker="o",
    label="RMSE"
)

plt.axhline(
    y=0.050,
    linestyle="--",
    label="Baseline MAE"
)

plt.xlabel(
    "Synthetic Points per Room"
)

plt.ylabel(
    "Prediction Error (seconds)"
)

plt.title(
    "Effect of Synthetic Training Data on MLP Performance"
)

plt.legend()

plt.grid()

plt.show()