# opengluck-apn

This module is used to send push notifications to devices registered with OpenGlück. Supports both Apple Push Notifications (APNS) for iOS and Firebase Cloud Messaging (FCM) for Android.

## Configuration

Create a file `~/.opengluck-apn` with the following:

```
OPENGLUCK_URL=https://opengluck.example.com
OPENGLUCK_TOKEN=abcdef01234567890abcdef012345678
```

### APNS Configuration (iOS)

[Create a key](https://developer.apple.com/account/resources/authkeys/list) and
download the matching `*.p8` file. Store it somewhere on your system.

Add to `~/.opengluck-apn`:

```
KEY_ID=ABCDEF1234
TEAM_ID=GHIJKL12345
KEY_FILE=/Users/user/file.p8
TOPIC=com.example.app
```

iOS device tokens are fetched from `/opengluck/userdata/apn-iOS/zrange` (dev) and `/opengluck/userdata/apn-iOS.production/zrange` (prod).

### FCM Configuration (Android)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key" and save the JSON file

Add to `~/.opengluck-apn`:

```
FCM_SERVICE_ACCOUNT_FILE=/path/to/firebase-service-account.json
```

Android device tokens are fetched from `/opengluck/userdata/fcm-Android/zrange` (dev) and `/opengluck/userdata/fcm-Android.production/zrange` (prod).

## Usage

```javascript
const opengluck = require("opengluck-apn");

// Send to all configured platforms (iOS and Android)
await opengluck.sendNotification({
  alert: { title: "Hello", body: "World" },
  sound: "default",
});

// Send to iOS only
await opengluck.sendNotification({
  app: "iOS",
  alert: { title: "Hello", body: "World" },
});

// Send to Android only
await opengluck.sendNotification({
  app: "Android",
  alert: { title: "Hello", body: "World" },
});
```

## FAQ

### Notifications not working on macOS with XCode

Restart the `apsd` daemon:

```bash
sudo killall apsd
```
