const opengluckApn = require("..");

(async () => {
  const app = process.argv[2] || "iOS";
  const deviceTokens = await opengluckApn.getDeviceTokens(app);
  console.log("Device tokens", deviceTokens);
})();
