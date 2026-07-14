const User = require('../models/User');
const AdminInvitation = require('../models/AdminInvitation');
const { logAction } = require('../services/auditService');
const { sendAdminInvitationEmail, sendAdminWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash -refreshTokens -devices')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-passwordHash -refreshTokens -devices');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'User details retrieved',
      data: user
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const assignAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot assign yourself as admin'
      });
    }

    targetUser.role = 'admin';
    targetUser.assignedBy = adminUser._id;
    await targetUser.save();

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'admin_assign',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { assignedUser: targetUser.email, assignedBy: req.user.email }
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} is now an admin`,
      data: targetUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Assign admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser.role !== 'admin' && targetUser.role !== 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself as admin'
      });
    }

    targetUser.role = 'user';
    targetUser.assignedBy = null;
    await targetUser.save();

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'admin_remove',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { removedUser: targetUser.email, removedBy: req.user.email }
    });

    res.status(200).json({
      success: true,
      message: `Admin privileges removed from ${targetUser.email}`,
      data: targetUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'No reason provided' } = req.body;
    const adminUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend yourself'
      });
    }

    targetUser.suspendedAt = new Date();
    targetUser.suspendedReason = reason;
    await targetUser.save();

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_suspended',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { reason }
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} has been suspended`,
      data: targetUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    targetUser.suspendedAt = null;
    targetUser.suspendedReason = '';
    await targetUser.save();

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_unsuspended',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} has been unsuspended`,
      data: targetUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    await User.findByIdAndDelete(userId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_deleted',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { deletedUser: targetUser.email }
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} has been deleted`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminUser = req.user;

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, admin, or super_admin'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    targetUser.role = role;
    await targetUser.save();

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_role_updated',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { newRole: role }
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} role updated to ${role}`,
      data: targetUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });
    const totalActive = await User.countDocuments({ isActive: true });
    const totalSuspended = await User.countDocuments({ suspendedAt: { $ne: null } });

    res.status(200).json({
      success: true,
      message: 'Admin statistics retrieved',
      data: {
        totalUsers,
        totalAdmins,
        totalActive,
        totalSuspended
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const sendAdminInvitation = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    const existingInvitation = await AdminInvitation.findOne({
      invitedUser: userId,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An invitation is already pending for this user'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const invitation = await AdminInvitation.create({
      invitedBy: adminUser._id,
      invitedByEmail: adminUser.email,
      invitedUser: targetUser._id,
      invitedUserEmail: targetUser.email,
      token,
      expiresAt
    });

    const emailResult = await sendAdminInvitationEmail(
      targetUser.email,
      targetUser.firstName,
      adminUser.firstName,
      token
    );

    if (!emailResult.success) {
      await AdminInvitation.findByIdAndDelete(invitation._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send invitation email',
        error: emailResult.error
      });
    }

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'admin_invitation_sent',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { invitedUser: targetUser.email }
    });

    res.status(200).json({
      success: true,
      message: 'Admin invitation sent successfully',
      data: {
        invitation,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Send admin invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const acceptAdminInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const user = req.user;

    const invitation = await AdminInvitation.findOne({
      token,
      invitedUser: user._id,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    user.role = 'admin';
    user.assignedBy = invitation.invitedBy;
    await user.save();

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    await sendAdminWelcomeEmail(user.email, user.firstName);

    await logAction({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'admin_invitation_accepted',
      resourceType: 'admin_action',
      resourceName: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Admin invitation accepted! You are now an admin.',
      data: {
        user: user.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Accept admin invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const rejectAdminInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const user = req.user;

    const invitation = await AdminInvitation.findOne({
      token,
      invitedUser: user._id,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();

    await logAction({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'admin_invitation_rejected',
      resourceType: 'admin_action',
      resourceName: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Admin invitation rejected'
    });

  } catch (error) {
    console.error('Reject admin invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const revokeAdminInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await AdminInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invitation is already ' + invitation.status
      });
    }

    invitation.status = 'revoked';
    await invitation.save();

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'admin_invitation_revoked',
      resourceType: 'admin_action',
      resourceName: invitation.invitedUserEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Admin invitation revoked'
    });

  } catch (error) {
    console.error('Revoke admin invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await AdminInvitation.find({
      status: 'pending'
    })
    .populate('invitedBy', 'email firstName lastName')
    .populate('invitedUser', 'email firstName lastName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Pending invitations retrieved',
      data: invitations
    });

  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    targetUser.passwordHash = newPassword;
    await targetUser.save();

    const emailResult = await sendPasswordResetEmail(
      targetUser.email,
      targetUser.firstName,
      newPassword
    );

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_password_reset',
      resourceType: 'admin_action',
      resourceName: targetUser.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { resetBy: req.user.email }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. New password sent to user email.',
      data: {
        user: targetUser.email,
        passwordSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  assignAdmin,
  removeAdmin,
  suspendUser,
  unsuspendUser,
  deleteUser,
  updateUserRole,
  getAdminStats,
  sendAdminInvitation,
  acceptAdminInvitation,
  rejectAdminInvitation,
  revokeAdminInvitation,
  getPendingInvitations,
  resetUserPassword
};