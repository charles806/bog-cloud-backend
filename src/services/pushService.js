const User = require('../models/User');

// Send push notification to user
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return { success: false, message: 'No push tokens found' };
    }

    // For each device token, send notification
    const results = [];
    for (const token of user.pushTokens) {
      try {
        // Here you would integrate with FCM (Firebase) or APNS (Apple)
        // This is a placeholder for actual push notification implementation
        console.log(` Sending push to ${token.deviceType}: ${title} - ${body}`);
        results.push({ success: true, token: token.token });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send password changed notification
const notifyPasswordChanged = async (userId, siteName) => {
  return await sendPushNotification(
    userId,
    ' Password Changed',
    `Password for ${siteName} was updated`,
    { type: 'password_updated', siteName }
  );
};

// Send file uploaded notification
const notifyFileUploaded = async (userId, fileName) => {
  return await sendPushNotification(
    userId,
    ' File Uploaded',
    `${fileName} uploaded successfully`,
    { type: 'file_uploaded', fileName }
  );
};

// Send login notification
const notifyLogin = async (userId, deviceName) => {
  return await sendPushNotification(
    userId,
    ' New Login',
    `New login from ${deviceName || 'unknown device'}`,
    { type: 'login', deviceName }
  );
};

module.exports = {
  sendPushNotification,
  notifyPasswordChanged,
  notifyFileUploaded,
  notifyLogin
};