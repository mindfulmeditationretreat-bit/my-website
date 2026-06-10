const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ImageKit = require('@imagekit/nodejs');

// ── ImageKit setup ─────────────────────────────────────────────────────────────
const hasImageKit = !!(
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
);

let imagekit = null;
if (hasImageKit) {
  imagekit = new ImageKit({
    publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
  console.log('[upload] ImageKit configured — files will be uploaded to the cloud');
}

// ── Local disk fallback ────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_').slice(0, 60);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// ── ImageKit custom multer storage engine ──────────────────────────────────────
function makeImageKitStorage(folder) {
  return {
    _handleFile(_req, file, cb) {
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('error', cb);
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext)
            .replace(/[^a-z0-9-_]/gi, '_')
            .slice(0, 60);
          const fileName = `${Date.now()}-${base}${ext}`;

          const result = await imagekit.files.upload({
            file: buffer,
            fileName,
            folder: `/mindful/${folder}`,
            useUniqueFileName: false,
          });

          cb(null, {
            fieldname:    file.fieldname,
            originalname: file.originalname,
            mimetype:     file.mimetype,
            path:         result.url,    // full ImageKit URL — used by controllers
            fileId:       result.fileId, // used for deletion
            size:         result.size,
          });
        } catch (err) {
          cb(err);
        }
      });
    },
    _removeFile(_req, file, cb) {
      if (file.fileId && imagekit) {
        imagekit.files.delete(file.fileId).catch(() => {});
      }
      cb(null);
    },
  };
}

// ── Multer instances ───────────────────────────────────────────────────────────
const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 25;
const limits = { fileSize: MAX_MB * 1024 * 1024 };

// General resource uploads (pdf, video, audio, image, article attachments)
const upload = hasImageKit
  ? multer({ storage: makeImageKitStorage('resources'), limits })
  : multer({ storage: diskStorage, limits });

// Profile photo uploads
const uploadPhoto = hasImageKit
  ? multer({ storage: makeImageKitStorage('photos'), limits })
  : multer({ storage: diskStorage, limits });

// ── Delete helper ──────────────────────────────────────────────────────────────
async function deleteFile(url) {
  if (!url) return;

  if (url.startsWith('https://ik.imagekit.io') && imagekit) {
    try {
      const endpoint = new URL(process.env.IMAGEKIT_URL_ENDPOINT);
      const urlObj = new URL(url);
      // Strip the ImageKit account prefix to get /mindful/photos/filename.jpg
      const fullPath = urlObj.pathname.replace(endpoint.pathname, '');
      const folder   = fullPath.substring(0, fullPath.lastIndexOf('/'));  // /mindful/photos
      const name     = fullPath.substring(fullPath.lastIndexOf('/') + 1); // filename.jpg

      const result = await imagekit.assets.list({ path: folder, name, limit: 1 });
      const assets = result?.data || result || [];
      if (assets.length) {
        await imagekit.files.delete(assets[0].fileId);
      }
    } catch (e) {
      console.warn('[upload] ImageKit delete failed:', e.message);
    }
  } else if (url.startsWith('/uploads/')) {
    const filepath = path.join(UPLOAD_DIR, path.basename(url));
    fs.promises.unlink(filepath).catch(() => {});
  }
}

module.exports = { upload, uploadPhoto, UPLOAD_DIR, deleteFile, hasImageKit };
