const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const generateSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `BOG Cloud (${email})`
  });
  return secret;
};

const generateQRCode = async (secret, email) => {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: email,
    issuer: 'BOG Cloud'
  });
  const qrCode = await QRCode.toDataURL(otpauthUrl);
  return qrCode;
};

const verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1
  });
};

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken
};