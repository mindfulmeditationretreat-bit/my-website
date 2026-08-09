const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  listInstructors, getInstructor,
  myAssignedUsers, getAssignedUser, addNote, getAssignedUserProgress,
} = require('../controllers/instructorController');

const router = Router();

router.get('/', listInstructors);

// /me/* must be registered before /:id or "me" is captured as an id
router.get('/me/users',        verifyToken, requireRole('instructor'), myAssignedUsers);
router.get('/me/users/:id',    verifyToken, requireRole('instructor'), getAssignedUser);
router.post('/me/users/:id/notes',    verifyToken, requireRole('instructor'), addNote);
router.get('/me/users/:id/progress', verifyToken, requireRole('instructor'), getAssignedUserProgress);

router.get('/:id', getInstructor);

module.exports = router;
