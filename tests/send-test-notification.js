const opengluckApn = require("..");

(async () => {
  const result = await opengluckApn.sendNotification({
    alert: { title: "Test Notification", body: "This is a test notification" },
    contentAvailable: true,
    sound: "default",
    category: "LOW",
  });
  for (const line of result.debugFailed) {
    console.log(line);
  }
  process.exit();
})();
