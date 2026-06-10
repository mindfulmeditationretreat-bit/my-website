const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ── Cloudinary (if credentials provided) ──────────────────────────────────────
let cloudinary = null;
let CloudinaryStorage = null;
const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
    console.log('[upload] Cloudinary configured — files will be uploaded to the cloud');
  } catch (e) {
    console.warn('[upload] cloudinary/multer-storage-cloudinary not installed; falling back to disk', e.message);
  }
}

// ── Local disk fallback ────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_').slice(0, 60);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// ── Multer instances ────────────────────────────────────────────────────────────
const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 25;

function makeUpload(folder, resourceType = 'auto') {
  if (hasCloudinary && CloudinaryStorage) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `mindful/${folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
    });
    return multer({ storage, limits: { fileSize: MAX_MB * 1024 * 1024 } });
  }
  return multer({ storage: diskStorage, limits: { fileSize: MAX_MB * 1024 * 1024 } });
}

// General resource upload (auto-detects images, video, audio, raw)
const upload = makeUpload('resources', 'auto');

// Profile photo upload (images only)
const uploadPhoto = makeUpload('photos', 'image');

// ── Delete helper ──────────────────────────────────────────────────────────────
async function deleteFile(url) {
  if (!url) return;
  if (url.startsWith('http') && hasCloudinary && cloudinary) {
    // Extract public_id and resource_type from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{ver}/{public_id}.{ext}
    const match = url.match(/cloudinary\.com\/[^/]+\/([^/]+)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      const resourceType = match[1]; // image | video | raw
      const publicId = match[2];
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (e) {
        console.warn('[upload] Cloudinary delete failed:', e.message);
      }
    }
  } else if (url.startsWith('/uploads/')) {
    const filepath = path.join(UPLOAD_DIR, path.basename(url));
    fs.promises.unlink(filepath).catch(() => {});
  }
}

module.exports = { upload, uploadPhoto, UPLOAD_DIR, deleteFile, hasCloudinary };
