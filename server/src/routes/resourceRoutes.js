const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  listResources, getResource, createResource, deleteResource,
} = require('../controllers/resourceController');
const jwt = require('jsonwebtoken');

function attachUserIfPresent(req, _res, next) {
  const token = req.cookies?.token;
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); }
    catch { /* ignore */ }
  }
  next();
}

const router = Router();
router.get('/', listResources);
router.get('/:id', attachUserIfPresent, getResource);
router.post('/', verifyToken, requireRole('instructor', 'admin'), upload.single('file'), createResource);
router.delete('/:id', verifyToken, requireRole('instructor', 'admin'), deleteResource);

module.exports = router;
