require("dotenv").config({ path: "~/.opengluck-apn" });
const https = require("https");
const apn = require("apn");

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
    apnProvider: apnProviderDev,
    app: "iOS",
  },
  {
    topic: process.env.TOPIC,
    apnProvider: apnProviderProd,
    app: "iOS.production",
  },
  // TODO: support watch app
];

const getDeviceTokens = (exports.getDeviceTokens =
  async function getDeviceTokens(app) {
    return new Promise((resolve, reject) => {
      const req = https.request(
        `${process.env.OPENGLUCK_URL}/opengluck/userdata/apn-${app}/zrange`,
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
        }
      );
      req.setHeader("Authorization", `Bearer ${process.env.OPENGLUCK_TOKEN}`);
      req.end();
    });
  });

exports.sendNotification = async function sendNotification({
  app: onlyApp,
  alert,
  contentAvailable,
  priority,
  sound,
  badge,
  payload,
}) {
  for (const { topic, apnProvider, app } of configs) {
    if (onlyApp && app !== onlyApp) {
      continue;
    }
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
    if (badge !== undefined) {
      notification.badge = badge;
    }
    if (payload !== undefined) {
      notification.payload = payload;
    }
    console.log("Notification to send", notification);

    const deviceTokens = await getDeviceTokens(app);
    if (!deviceTokens.length) {
      console.log(`Skip, no device tokens for ${app}`);
      continue;
    }
    const response = await apnProvider.send(notification, deviceTokens);
    console.log(response);
    for (const f of response.failed) {
      console.log(f);
    }
  }
};
