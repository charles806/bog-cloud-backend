const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const {
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
} = require('../controllers/adminController');

router.use(protect);
router.use(isAdmin);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.get('/stats', getAdminStats);

// Admin assignment (existing)
router.post('/users/:userId/assign-admin', assignAdmin);
router.post('/users/:userId/remove-admin', removeAdmin);

router.post('/users/:userId/invite-admin', sendAdminInvitation);
router.post('/invitations/:token/accept', acceptAdminInvitation);
router.post('/invitations/:token/reject', rejectAdminInvitation);
router.delete('/invitations/:invitationId/revoke', revokeAdminInvitation);
router.get('/invitations/pending', getPendingInvitations);

// User management
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/unsuspend', unsuspendUser);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/role', updateUserRole);

router.post('/users/:userId/reset-password', resetUserPassword);

module.exports = router;