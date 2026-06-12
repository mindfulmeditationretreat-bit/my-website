const { Router } = require('express');
const multer = require('multer');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  stats,
  listUsers, getUser, createUser, updateUser, deleteUser,
  assignInstructor, assignProgram,
  listSubscriptions,
  listPrograms, updateProgram,
  broadcast,
} = require('../controllers/adminController');
const { assignResource, unassignResource, listUserResources } = require('../controllers/userResourceController');
const { bulkCreateUsers } = require('../controllers/bulkUserController');

const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(verifyToken, requireRole('admin'));

router.get('/stats', stats);

router.get('/users', listUsers);
router.post('/users', createUser);
router.post('/users/bulk', memUpload.single('csv'), bulkCreateUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/subscriptions', listSubscriptions);
router.post('/subscriptions/:id/assign-provider', assignInstructor);
router.post('/users/:id/assign-program', assignProgram);
router.get('/users/:id/resources', listUserResources);
router.post('/users/:id/resources', assignResource);
router.delete('/users/:id/resources/:resourceId', unassignResource);

router.get('/programs', listPrograms);
router.patch('/programs/:id', updateProgram);

router.post('/broadcast', broadcast);

module.exports = router;
