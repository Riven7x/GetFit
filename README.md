# GetFit - Fitness Tracking Mobile App 🏋️‍♂️

A React Native mobile app that connects to Arduino Nano 33 BLE for real-time exercise detection using machine learning. Track your pushups, squats, and arm circles with automatic counting and calorie calculation!

## 🎯 Features

- **Real-time Exercise Detection**: Connects to Arduino Nano 33 BLE via Bluetooth
- **Automatic Exercise Counting**: ML-powered detection for Pushups, Squats, and Arm Circles
- **Calorie Tracking**: MET-based calorie calculation using user weight
- **User Authentication**: Secure JWT-based login/registration
- **Activity Dashboard**: View today's stats and weekly breakdown
- **Profile Management**: Track weight, height, and personal info
- **MongoDB Storage**: All workout data stored in database

## 📱 Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- Expo Router (file-based routing)
- Zustand (state management)
- react-native-ble-plx (Bluetooth Low Energy)
- Axios (API calls)

### Backend
- FastAPI (Python)
- MongoDB
- JWT Authentication
- Pydantic models

### Hardware
- Arduino Nano 33 BLE Sense
- Edge Impulse ML model for exercise detection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Expo account (free at expo.dev)
- Arduino Nano 33 BLE with GetFit firmware uploaded

### 1. Clone Repository

```bash
git clone https://github.com/Riven7x/GetFit.git
cd GetFit
```

### 2. Install Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 3. Build Development APK

**Important**: This app uses Bluetooth (BLE) which requires a development build - **Expo Go will NOT work**.

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --profile development --platform android
```

Wait 5-10 minutes for the build to complete. You'll receive a download link via email and in the terminal.

### 4. Install on Phone

1. Download the APK from the link provided
2. Transfer to your phone or download directly
3. Enable "Install from unknown sources" in Android settings
4. Install the APK
5. Open GetFit app

### 5. Connect Arduino

1. Power on your Arduino Nano 33 BLE (with GetFit firmware)
2. Open GetFit app → Register/Login
3. Go to **Workout** tab
4. Tap **"Scan for Device"**
5. Allow Location and Bluetooth permissions
6. Select "Get-Fit" device
7. Tap **"Start Workout"** and exercise!

## 🔧 Development Setup

### Backend (Optional - for local development)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Environment Variables

Backend `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=getfit_db
SECRET_KEY=your-secret-key-here
```

Frontend `.env`:
```
EXPO_PUBLIC_BACKEND_URL=http://your-backend-url
```

## 📊 Arduino BLE Protocol

### Service UUID
`e267751a-ae76-11eb-8529-0242ac130003`

### Characteristics

| Characteristic | UUID | Type | Description |
|---------------|------|------|-------------|
| Exercise | `2A19` | READ/NOTIFY | Sends exercise type: 0=Arm Circle, 1=Squats, 2=Pushup |
| Start | `19b10012-e8f2-537e-4f6c-d104768a1214` | READ/WRITE | Write 1 to start workout |
| Pause | `6995b940-b6f4-11eb-8529-0242ac130003` | READ/WRITE | Write 1 to pause workout |

## 🔥 Calorie Calculation

Uses MET (Metabolic Equivalent of Task) values:

- **Pushups**: 8.0 MET
- **Squats**: 5.5 MET
- **Arm Circles**: 4.0 MET

Formula: `Calories = MET × Weight(kg) × Time(hours)`

## 📁 Project Structure

```
GetFit/
├── frontend/                # React Native mobile app
│   ├── app/                # Expo Router screens
│   │   ├── (auth)/        # Login/Register
│   │   ├── (tabs)/        # Main app tabs
│   │   └── index.tsx      # Entry point
│   ├── src/
│   │   ├── services/      # API & BLE services
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Helper functions
│   ├── app.json           # Expo configuration
│   └── package.json
│
└── backend/                # FastAPI backend
    ├── server.py          # Main API server
    ├── requirements.txt
    └── .env
```

## 🐛 Troubleshooting

### BLE Not Working
- **Issue**: "BLE is not available on this platform"
- **Solution**: You must use a development build APK, not Expo Go

### Can't Find Arduino Device
- Check Arduino is powered on and running GetFit firmware
- Ensure phone Bluetooth is enabled
- Grant Location permission (required for BLE scanning on Android)
- Grant "Nearby devices" permission (Android 12+)
- Arduino should show "Bluetooth device active, waiting for connections..." in Serial Monitor

### Build Fails
- Make sure you're logged into Expo: `eas login`
- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `npm cache clean --force`

### Permissions Not Granted
- Go to Settings → Apps → GetFit → Permissions
- Enable: Location, Nearby devices (Bluetooth)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Profile
- `PUT /api/profile` - Update user profile

### Workouts
- `POST /api/workouts` - Create workout session
- `GET /api/workouts/today` - Get today's stats
- `GET /api/workouts/daily/{date}` - Get specific day stats
- `GET /api/workouts/weekly` - Get 7-day breakdown

## 🎨 Screenshots

*(Add screenshots here after building)*

## 🤝 Contributing

This is a personal project, but suggestions and issues are welcome!

## 📄 License

MIT License - feel free to use and modify

## 👤 Author

**Aneesh Karthick Arunagiri** (Riven7x)
- GitHub: [@Riven7x](https://github.com/Riven7x)
- Email: aneeshkarthick.arunagiri@gmail.com

## 🙏 Acknowledgments

- Arduino Nano 33 BLE Sense
- Edge Impulse for ML model
- Expo for amazing mobile development platform
- Original GetFit project inspiration from CodersCafeTech

---

**Built with ❤️ using React Native and Arduino**
