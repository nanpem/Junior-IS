import matplotlib.pyplot as plt


my_rooms = {
    "Bathroom1": (18.03, 0.346),
    "Bathroom2": (17.02, 0.348),
    "Bathroom3": (14.89, 0.487),
    "Bedroom": (32.43, 0.212),
    "Taylor200": (204.15, 0.599)
}


ace_rooms = {
    "ACE Office 1": (3.32 * 4.83 * 2.95, 0.332),
    "ACE Office 2": (3.22 * 5.10 * 2.94, 0.390),
    "ACE Meeting Room 1": (6.61 * 5.11 * 2.95, 0.437),
    "ACE Meeting Room 2": (10.3 * 9.07 * 2.63, 0.371),
    "ACE Lecture Room 1": (6.93 * 9.73 * 3.00, 0.638),
    "ACE Lecture Room 2": (13.6 * 9.29 * 2.94, 1.220),
    "ACE Building Lobby": (4.47 * 5.13 * 3.18, 0.646)
}


my_offsets = {
    "Bathroom1": (8, -8),
    "Bathroom2": (8, 8),
    "Bathroom3": (8, 8),
    "Bedroom": (8, 8),
    "Taylor200": (8, 8)
}


ace_offsets = {
    "ACE Office 1": (8, -14),
    "ACE Office 2": (8, 10),
    "ACE Meeting Room 1": (8, 8),
    "ACE Meeting Room 2": (8, -12),
    "ACE Lecture Room 1": (8, -10),
    "ACE Lecture Room 2": (8, -10),
    "ACE Building Lobby": (8, 8)
}


first = True

for name, (volume, rt60) in my_rooms.items():

    plt.scatter(
        volume,
        rt60,
        marker="o",
        s=70,
        label="Measured rooms" if first else None
    )

    plt.annotate(
        name,
        (volume, rt60),
        xytext=my_offsets[name],
        textcoords="offset points",
        fontsize=9
    )

    first = False


first = True

for name, (volume, rt60) in ace_rooms.items():

    plt.scatter(
        volume,
        rt60,
        marker="x",
        s=70,
        label="ACE reference rooms" if first else None
    )

    plt.annotate(
        name,
        (volume, rt60),
        xytext=ace_offsets[name],
        textcoords="offset points",
        fontsize=9
    )

    first = False


plt.xlabel("Room Volume (m³)")
plt.ylabel("RT60 (seconds)")

plt.title(
    "Measured RT60 Compared with ACE Reference Rooms"
)

plt.legend()

plt.grid()

plt.tight_layout()

plt.show()