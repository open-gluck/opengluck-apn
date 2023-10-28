const opengluckApn = require("..");

(async () => {
  await opengluckApn.sendNotification({
    alert: { title: "Test Notification", body: "This is a test notification" },
    sound: "default",
  });
  process.exit();
})();
