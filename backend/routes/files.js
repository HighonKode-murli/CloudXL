import express from "express";
import multer from "multer";
import requireAuth from "../middleware/auth.js";
import User from "../models/User.js";
import File from "../models/File.js";
import {
  uploadSplitAcrossProviders,
  downloadAndMerge,
  deleteAllParts,
} from "../services/storageManager.js";

const router = express.Router();
const upload = multer();

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res, next) => {
    try {
      console.log('Upload request received');
      console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

      if (!req.file) return res.status(400).json({ error: "File is required" });

      const user = await User.findById(req.user._id);
      console.log('User found:', user ? `${user._id} with ${user.cloudAccounts.length} cloud accounts` : 'No user');

      if (!user || user.cloudAccounts.length === 0)
        return res.status(400).json({ error: "Link atleast one provider" });

      console.log('Starting file upload split across providers...');
      const { parts, totalSize, mimeType } = await uploadSplitAcrossProviders(
        user,
        req.file
      );

      console.log('File split completed, creating database record...');
      const fileDoc = await File.create({
        ownerId: user._id,
        fileName: req.file.originalname,
        size: totalSize,
        mimeType,
        parts,
      });

      console.log('Upload completed successfully:', fileDoc._id);
      res.json({
        message: "Uploaded successfully",
        fileId: fileDoc._id,
        parts,
      });
    } catch (e) {
      console.error('Upload error:', e);
      next(e);
    }
  }
);



router.get("/", requireAuth, async (req, res, next) => {
  try {
    // Get user with linked accounts
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all files with their parts
    const allFiles = await File.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .select("_id fileName size createdAt parts");

    // Create a set of linked account identifiers for quick lookup
    const linkedAccountKeys = new Set(
      user.cloudAccounts.map(acc => `${acc.provider}:${acc.accountEmail}`)
    );

    // Filter files to only include those where ALL chunks are accessible
    const accessibleFiles = allFiles.filter(file => {
      return file.parts.every(part => {
        const accountKey = `${part.provider}:${part.accountEmail}`;
        return linkedAccountKeys.has(accountKey);
      });
    });

    // Return only the necessary fields for the file list
    const fileList = accessibleFiles.map(file => ({
      _id: file._id,
      fileName: file.fileName,
      size: file.size,
      createdAt: file.createdAt
    }));

    console.log(`File listing: ${allFiles.length} total files, ${accessibleFiles.length} accessible files for user ${user._id}`);
    res.json(fileList);
  } catch (e) {
    console.error('File listing error:', e);
    next(e);
  }
});



router.get("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const fileDoc = await File.findOne({
      _id: req.params.fileId,
      ownerId: req.user._id,
    });
    if (!fileDoc) return res.status(404).json({ error: "Not found" });

    // Get user with linked accounts
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if all chunks are accessible (all required accounts are still linked)
    const linkedAccountKeys = new Set(
      user.cloudAccounts.map(acc => `${acc.provider}:${acc.accountEmail}`)
    );

    const inaccessibleParts = fileDoc.parts.filter(part => {
      const accountKey = `${part.provider}:${part.accountEmail}`;
      return !linkedAccountKeys.has(accountKey);
    });

    if (inaccessibleParts.length > 0) {
      console.log(`File ${fileDoc._id} has ${inaccessibleParts.length} inaccessible parts:`,
        inaccessibleParts.map(p => `${p.provider}:${p.accountEmail}`));
      return res.status(410).json({
        error: "File cannot be downloaded - some chunks are stored on unlinked accounts",
        inaccessibleParts: inaccessibleParts.length,
        totalParts: fileDoc.parts.length
      });
    }

    // Stream via buffer concat (for simplicity). For very large files, stream sequentially.
    const merged = await downloadAndMerge(user, fileDoc);

    res.setHeader(
      "Content-Type",
      fileDoc.mimeType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileDoc.fileName)}"`
    );
    res.setHeader("Content-Length", String(merged.length));
    res.end(merged);
  } catch (e) {
    console.error('File download error:', e);
    next(e);
  }
});



router.delete("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const fileDoc = await File.findOne({
      _id: req.params.fileId,
      ownerId: req.user._id,
    });
    if (!fileDoc) return res.status(404).json({ error: "Not found" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if all chunks are accessible for proper cleanup
    const linkedAccountKeys = new Set(
      user.cloudAccounts.map(acc => `${acc.provider}:${acc.accountEmail}`)
    );

    const inaccessibleParts = fileDoc.parts.filter(part => {
      const accountKey = `${part.provider}:${part.accountEmail}`;
      return !linkedAccountKeys.has(accountKey);
    });

    if (inaccessibleParts.length > 0) {
      console.log(`Warning: Deleting file ${fileDoc._id} with ${inaccessibleParts.length} inaccessible parts`);
      // Still allow deletion but warn about incomplete cleanup
    }

    // Attempt to delete all accessible parts
    await deleteAllParts(user, fileDoc);
    await File.deleteOne({ _id: fileDoc._id });

    const message = inaccessibleParts.length > 0
      ? `File deleted (${inaccessibleParts.length} chunks on unlinked accounts could not be cleaned up)`
      : "File deleted successfully";

    res.json({ message, inaccessibleParts: inaccessibleParts.length });
  } catch (e) {
    console.error('File deletion error:', e);
    next(e);
  }
});


// Get files with missing chunks (for cleanup/diagnostic purposes)
router.get("/orphaned/list", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all files with their parts
    const allFiles = await File.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .select("_id fileName size createdAt parts");

    // Create a set of linked account identifiers
    const linkedAccountKeys = new Set(
      user.cloudAccounts.map(acc => `${acc.provider}:${acc.accountEmail}`)
    );

    // Find files with missing chunks
    const orphanedFiles = allFiles.filter(file => {
      return file.parts.some(part => {
        const accountKey = `${part.provider}:${part.accountEmail}`;
        return !linkedAccountKeys.has(accountKey);
      });
    }).map(file => {
      const missingParts = file.parts.filter(part => {
        const accountKey = `${part.provider}:${part.accountEmail}`;
        return !linkedAccountKeys.has(accountKey);
      });

      return {
        _id: file._id,
        fileName: file.fileName,
        size: file.size,
        createdAt: file.createdAt,
        totalParts: file.parts.length,
        missingParts: missingParts.length,
        missingAccounts: [...new Set(missingParts.map(p => `${p.provider}:${p.accountEmail}`))]
      };
    });

    res.json({
      orphanedFiles,
      count: orphanedFiles.length,
      totalFiles: allFiles.length
    });
  } catch (e) {
    console.error('Orphaned files listing error:', e);
    next(e);
  }
});

export default router