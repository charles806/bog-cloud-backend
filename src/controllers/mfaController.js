const User = require('../models/User');
const { generateSecret, generateQRCode, verifyToken } = require('../utils/mfa');

const setupMfa = async (req, res) => {
  try {
    const user = req.user;

    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA already enabled'
      });
    }

    const secret = generateSecret(user.email);
    const qrCode = await generateQRCode(secret, user.email);

    user.mfaSecret = secret.base32;
    user.mfaEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'MFA setup initiated',
      data: {
        secret: secret.base32,
        qrCode,
        manualEntry: secret.otpauth_url
      }
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const verifyMfa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not set up yet'
      });
    }

    const isValid = verifyToken(user.mfaSecret, token);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA token'
      });
    }

    user.mfaEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const disableMfa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled'
      });
    }

    const isValid = verifyToken(user.mfaSecret, token);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA token'
      });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  setupMfa,
  verifyMfa,
  disableMfa
};