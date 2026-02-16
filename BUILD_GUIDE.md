# 🚀 Quick Build Guide - GetFit APK

## Step-by-Step Instructions for Building APK

### 1️⃣ Prerequisites
✅ Node.js installed (download from https://nodejs.org)
✅ Expo account (email: aneeshkarthick.arunagiri@gmail.com)

### 2️⃣ Clone Repository on Your Computer

Open Terminal/Command Prompt:

```bash
git clone https://github.com/Riven7x/GetFit.git
cd GetFit/frontend
```

### 3️⃣ Install Dependencies

```bash
npm install
```

⏳ This will take 2-3 minutes

### 4️⃣ Install EAS CLI

```bash
npm install -g eas-cli
```

### 5️⃣ Login to Expo

```bash
eas login
```

Enter:
- Email: `aneeshkarthick.arunagiri@gmail.com`
- Password: `Pineapple123%`

### 6️⃣ Build the APK

```bash
eas build --profile development --platform android
```

**What happens:**
- EAS uploads your code to Expo cloud servers
- Builds a native Android APK with BLE support
- Takes 5-10 minutes
- You'll get a download link

### 7️⃣ Download & Install

Once build completes:
1. Click the download link (or check email)
2. Transfer APK to your phone
3. Install it (enable "Install from unknown sources")
4. Open GetFit app!

---

## 📱 Using the App

### First Time Setup:
1. Open GetFit app
2. Tap "Sign Up"
3. Enter:
   - Name
   - Email
   - Password
   - **Weight in kg** (needed for calorie calculation!)
   - Height (optional)

### Connect Arduino:
1. Power on Arduino Nano 33 BLE
2. In app, go to **Workout** tab
3. Tap **"Scan for Device"**
4. Allow permissions when asked
5. Select "Get-Fit"
6. Tap **"Start Workout"**
7. Exercise and watch it count! 💪

---

## 🐛 Troubleshooting

### Build fails?
```bash
# Clear cache and try again
npm cache clean --force
npm install
eas build --profile development --platform android --clear-cache
```

### Can't find Arduino?
- Check Arduino Serial Monitor shows: "Bluetooth device active..."
- Enable Bluetooth on phone
- Grant Location + Nearby devices permissions
- Move closer to Arduino

### App crashes on launch?
- Make sure you installed the **development build APK**, not production
- Check you're using the APK from EAS build, not Expo Go

---

## 📞 Need Help?

Repository: https://github.com/Riven7x/GetFit
Issues: https://github.com/Riven7x/GetFit/issues

---

**That's it! Enjoy tracking your workouts! 🎉**
