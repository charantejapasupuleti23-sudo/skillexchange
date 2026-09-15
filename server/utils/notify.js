const Notification = require('../models/Notification');

/**
 * Creates an in-app notification and emits a real-time socket event if recipient is connected.
 * @param {Object} io - Socket.io instance (optional)
 * @param {Object} data - Notification fields { recipient, sender, type, title, message, referenceId, referenceType }
 */
const createNotification = async (io, data) => {
  try {
    const notification = await Notification.create(data);

    // If socket server is available, emit to recipient room/user
    if (io) {
      io.to(`user_${data.recipient}`).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Helper Error]', error);
    return null;
  }
};

module.exports = { createNotification };
