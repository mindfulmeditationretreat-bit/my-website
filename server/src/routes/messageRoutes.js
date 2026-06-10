const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { listConversations, listMessages, sendMessage } = require('../controllers/messageController');

const router = Router();
router.use(verifyToken);
router.get('/', listConversations);
router.get('/:peerId', listMessages);
// Allow optional file attachment; multer runs first, then sendMessage reads req.file
router.post('/', upload.single('file'), sendMessage);

module.exports = router;
