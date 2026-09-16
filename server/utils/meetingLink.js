/**
 * Generates standard Google Meet link in the official format: https://meet.google.com/xxx-yyyy-zzz
 */
const generateGoogleMeetLink = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const getPart = (len) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return res;
  };

  return `https://meet.google.com/${getPart(3)}-${getPart(4)}-${getPart(3)}`;
};

module.exports = { generateGoogleMeetLink };
