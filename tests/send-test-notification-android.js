const opengluckApn = require("..");

(async () => {
  const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const result = await opengluckApn.sendNotification({
    alert: { title: `Test Notification ${time}`, body: "This is a test notification" },
    contentAvailable: true,
    sound: "default",
  });
  for (const line of result.debugFailed) {
    console.log(line);
  }
  process.exit();
})();
