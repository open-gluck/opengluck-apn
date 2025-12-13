require("dotenv").config({ path: "~/.opengluck-apn" });
const https = require("https");
const apn = require("apn");
const admin = require("firebase-admin");

// Initialize FCM if configured
let fcmApp = null;
if (process.env.FCM_SERVICE_ACCOUNT_FILE) {
  const serviceAccount = require(process.env.FCM_SERVICE_ACCOUNT_FILE);
  fcmApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const optionsDev = {
  token: {
    key: process.env.KEY_FILE,
    keyId: process.env.KEY_ID,
    teamId: process.env.TEAM_ID,
  },
  production: false,
};
const optionsProd = {
  token: {
    key: process.env.KEY_FILE,
    keyId: process.env.KEY_ID,
    teamId: process.env.TEAM_ID,
  },
  production: true,
};
const apnProviderDev = new apn.Provider(optionsDev);
const apnProviderProd = new apn.Provider(optionsProd);

const configs = [
  {
    topic: process.env.TOPIC,
    apnProvider: apnProviderProd,
    app: "iOS.production",
    platform: "apns",
  },
  {
    topic: process.env.TOPIC,
    apnProvider: apnProviderDev,
    app: "iOS",
    platform: "apns",
  },
  // TODO: support watch app
  // FCM configs for Android (only if FCM is configured)
  ...(fcmApp
    ? [
        { app: "Android.production", platform: "fcm" },
        { app: "Android", platform: "fcm" },
      ]
    : []),
];

const getDeviceTokens = (exports.getDeviceTokens =
  async function getDeviceTokens(app, prefix = "apn") {
    return new Promise((resolve, reject) => {
      const req = https.request(
        `${process.env.OPENGLUCK_URL}/opengluck/userdata/${prefix}-${app}/zrange`,
        (res) => {
          let chunks = [];
          res.on("data", (chunk) => {
            chunks.push(chunk);
          });
          res.on("end", () => {
            const data = Buffer.concat(chunks).toString();
            const deviceTokens = JSON.parse(data);
            resolve(deviceTokens);
          });
          res.on("error", reject);
        },
      );
      req.setHeader("Authorization", `Bearer ${process.env.OPENGLUCK_TOKEN}`);
      req.end();
    });
  });

// Build FCM message from notification options
// Uses data-only messages (no notification payload) so the Android app's
// onMessageReceived handles display, even when app is killed/background.
function buildFcmMessage({
  alert,
  contentAvailable,
  priority,
  sound,
  category,
  badge,
  payload,
}) {
  // For FCM, default to 'high' priority for reliable delivery when app is killed.
  // Only use 'normal' if explicitly requested (priority <= 5 maps to APNS "normal").
  const fcmPriority =
    priority !== undefined && priority <= 5 ? "normal" : "high";

  const message = {
    android: {
      priority: fcmPriority,
    },
    data: {},
  };

  // Put alert info in data payload instead of notification payload
  if (alert) {
    if (typeof alert === "string") {
      message.data.body = alert;
    } else {
      if (alert.title) message.data.title = alert.title;
      if (alert.body) message.data.body = alert.body;
    }
  }

  if (sound) {
    message.data.sound = sound === "default" ? "default" : sound;
  }

  if (category) {
    message.data.category = category;
  }

  if (contentAvailable) {
    message.data.contentAvailable = "true";
  }

  if (payload) {
    for (const [key, value] of Object.entries(payload)) {
      message.data[key] =
        typeof value === "string" ? value : JSON.stringify(value);
    }
  }

  if (badge !== undefined) {
    message.data.badge = String(badge);
  }

  return message;
}

exports.sendNotification = async function sendNotification({
  app: onlyApp,
  alert,
  contentAvailable,
  priority,
  sound,
  category,
  badge,
  payload,
}) {
  const results = {
    debugFailed: [],
  };
  for (const { topic, apnProvider, app, platform } of configs) {
    if (onlyApp && app !== onlyApp) {
      continue;
    }

    const storagePrefix = platform === "fcm" ? "fcm" : "apn";
    const deviceTokens = await getDeviceTokens(app, storagePrefix);
    if (!deviceTokens.length) {
      console.log(`Skip, no device tokens for ${app}`);
      continue;
    }

    if (platform === "apns") {
      // APNS sending logic
      let notification = new apn.Notification();
      notification.topic = topic;
      if (alert !== undefined) {
        notification.alert = alert;
      }
      if (contentAvailable !== undefined) {
        notification.contentAvailable = contentAvailable;
      }
      if (priority !== undefined) {
        notification.priority = priority;
      }
      if (sound !== undefined) {
        notification.sound = sound;
      }
      if (category !== undefined) {
        notification.category = category;
      }
      if (badge !== undefined) {
        notification.badge = badge;
      }
      if (payload !== undefined) {
        notification.payload = payload;
      }
      console.log("APNS Notification to send for app " + app, notification);

      const response = await apnProvider.send(notification, deviceTokens);
      console.log(response);
      for (const f of response.failed) {
        console.log(f);
        if (f.status === "410") {
          results.debugFailed.push(`zrem userdata:apn-${app} ${f.device}`);
        }
      }
    } else if (platform === "fcm") {
      // FCM sending logic
      const fcmMessage = buildFcmMessage({
        alert,
        contentAvailable,
        priority,
        sound,
        category,
        badge,
        payload,
      });
      console.log("FCM Notification to send for app " + app, fcmMessage);

      for (const token of deviceTokens) {
        console.log("Token:       ", token);
        try {
          const response = await admin.messaging().send({
            ...fcmMessage,
            token: token,
          });
          console.log("FCM success:", response);
        } catch (error) {
          console.log(`FCM error for token ${token}:`, error);
          if (
            error.code === "messaging/registration-token-not-registered" ||
            error.code === "messaging/invalid-registration-token"
          ) {
            results.debugFailed.push(`zrem userdata:fcm-${app} ${token}`);
          }
        }
      }
    }
  }
  return results;
};
