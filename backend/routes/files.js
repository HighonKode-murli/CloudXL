import express from "express";
import multer from "multer";
import requireAuth from "../middleware/auth.js";
import User from "../models/User.js";
import File from "../models/File.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import {
  uploadSplitAcrossProviders,
  downloadAndMerge,
  deleteAllParts,
  getStorageInfoBefore,
  uploadSplitAcrossProvidersTeam,
  
} from "../services/storageManager.js";

const router = express.Router();
const upload = multer();

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res, next) => {
    try {
      console.log("Upload request received");
      console.log(
        "File:",
        req.file
          ? `${req.file.originalname} (${req.file.size} bytes)`
          : "No file"
      );

      if (!req.file) return res.status(400).json({ error: "File is required" });

      const { teamId, targetProfiles } = req.body; // NEW: Accept team context

      let parts, totalSize, mimeType;

      if (teamId) {
        // TEAM UPLOAD
        const team = await Team.findById(teamId);
        const membership = await TeamMember.findOne({
          teamId,
          userId: req.user._id,
        });

        if (!team || !membership) {
          return res.status(403).json({ error: "Not a member of this team" });
        }

        ({ parts, totalSize, mimeType } = await uploadSplitAcrossProvidersTeam(
          team,
          req.user,
          req.file,
          targetProfiles
        ));

        const fileDoc = await File.create({
          ownerId: req.user._id,
          fileName: req.file.originalname,
          size: totalSize,
          mimeType,
          parts,
          teamId, // NEW
          targetProfiles: targetProfiles || [membership.profile], // NEW
        });

        console.log("Upload completed successfully:", fileDoc._id);
        res.json({
          message: "Uploaded successfully",
          fileId: fileDoc._id,
          parts,
        });
      } else {
        const user = await User.findById(req.user._id);
        console.log(
          "User found:",
          user
            ? `${user._id} with ${user.cloudAccounts.length} cloud accounts`
            : "No user"
        );

        if (!user || user.cloudAccounts.length === 0)
          return res.status(400).json({ error: "Link atleast one provider" });

        console.log("Starting file upload split across providers...");
        ({ parts, totalSize, mimeType } = await uploadSplitAcrossProviders(
          user,
          req.file
        ));

        console.log("File split completed, creating database record...");
        const fileDoc = await File.create({
          ownerId: user._id,
          fileName: req.file.originalname,
          size: totalSize,
          mimeType,
          parts,
          // teamId remains null here
        });

        console.log("Upload completed successfully:", fileDoc._id);
        res.json({
          message: "Uploaded successfully",
          fileId: fileDoc._id,
          parts,
        });
      }
    } catch (e) {
      console.error("Upload error:", e);
      next(e);
    }
  });

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { teamId } = req.query;

    if (teamId) {
      // ═══════════════════════════════════════════════════════════════
      // TEAM FILES LOGIC
      // ═══════════════════════════════════════════════════════════════
      
      // Verify user is a member of this team
      const membership = await TeamMember.findOne({ 
        teamId, 
        userId: req.user._id 
      });
      
      if (!membership) {
        return res.status(403).json({ error: "Not a member of this team" });
      }

      // Get the team with its cloud accounts
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Check if user is admin (admins can see all team files)
      const isAdmin = team.adminId.toString() === req.user._id.toString();

      // Get all team files based on access rights
      const query = {
        teamId,
        $or: isAdmin 
          ? [{}] // Admin sees all files
          : [
              { targetProfiles: membership.profile },
              { targetProfiles: 'cross-section' }
            ]
      };

      const allFiles = await File.find(query)
        .sort({ createdAt: -1 })
        .select("_id fileName size createdAt parts targetProfiles ownerId");

      // Create a set of team's linked cloud account identifiers
      const linkedAccountKeys = new Set(
        team.cloudAccounts.map((acc) => `${acc.provider}:${acc.accountEmail}`)
      );

      // Filter files to only include those where ALL chunks are accessible
      const accessibleFiles = allFiles.filter((file) => {
        return file.parts.every((part) => {
          const accountKey = `${part.provider}:${part.accountEmail}`;
          return linkedAccountKeys.has(accountKey);
        });
      });

      // Return file list with team context
      const fileList = accessibleFiles.map((file) => ({
        _id: file._id,
        fileName: file.fileName,
        size: file.size,
        createdAt: file.createdAt,
        targetProfiles: file.targetProfiles,
        isOwner: file.ownerId.toString() === req.user._id.toString()
      }));

      console.log(
        `Team file listing: ${allFiles.length} total files, ${accessibleFiles.length} accessible files for team ${teamId}, user ${req.user._id}`
      );
      
      res.json(fileList);

    } else {
      // ═══════════════════════════════════════════════════════════════
      // PERSONAL FILES LOGIC (EXISTING)
      // ═══════════════════════════════════════════════════════════════
      
      // Get user with linked accounts
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all personal files (teamId is null)
      const allFiles = await File.find({ 
        ownerId: req.user._id,
        teamId: null  // Only personal files
      })
        .sort({ createdAt: -1 })
        .select("_id fileName size createdAt parts");

      // Create a set of linked account identifiers for quick lookup
      const linkedAccountKeys = new Set(
        user.cloudAccounts.map((acc) => `${acc.provider}:${acc.accountEmail}`)
      );

      // Filter files to only include those where ALL chunks are accessible
      const accessibleFiles = allFiles.filter((file) => {
        return file.parts.every((part) => {
          const accountKey = `${part.provider}:${part.accountEmail}`;
          return linkedAccountKeys.has(accountKey);
        });
      });

      // Return only the necessary fields for the file list
      const fileList = accessibleFiles.map((file) => ({
        _id: file._id,
        fileName: file.fileName,
        size: file.size,
        createdAt: file.createdAt,
      }));

      console.log(
        `File listing: ${allFiles.length} total files, ${accessibleFiles.length} accessible files for user ${user._id}`
      );
      
      res.json(fileList);
    }
  } catch (e) {
    console.error("File listing error:", e);
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
      user.cloudAccounts.map((acc) => `${acc.provider}:${acc.accountEmail}`)
    );

    const inaccessibleParts = fileDoc.parts.filter((part) => {
      const accountKey = `${part.provider}:${part.accountEmail}`;
      return !linkedAccountKeys.has(accountKey);
    });

    if (inaccessibleParts.length > 0) {
      console.log(
        `File ${fileDoc._id} has ${inaccessibleParts.length} inaccessible parts:`,
        inaccessibleParts.map((p) => `${p.provider}:${p.accountEmail}`)
      );
      return res.status(410).json({
        error:
          "File cannot be downloaded - some chunks are stored on unlinked accounts",
        inaccessibleParts: inaccessibleParts.length,
        totalParts: fileDoc.parts.length,
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
    console.error("File download error:", e);
    next(e);
  }
});

router.delete("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) return res.status(404).json({ error: "Not found" });
    
    // Check permissions
    const isOwner = fileDoc.ownerId.toString() === req.user._id.toString();
    let isTeamAdmin = false;
    
    if (fileDoc.teamId) {
      // For team files, check if user is team admin
      const team = await Team.findById(fileDoc.teamId);
      isTeamAdmin = team && team.adminId.toString() === req.user._id.toString();
    }
    
    // Only owner or team admin can delete
    if (!isOwner && !isTeamAdmin) {
      return res.status(403).json({ error: "Only file owner or team admin can delete this file" });
    }
    
    // Determine which cloud accounts to use
    let cloudAccounts;
    if (fileDoc.teamId) {
      const team = await Team.findById(fileDoc.teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      cloudAccounts = team.cloudAccounts;
    } else {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ error: "User not found" });
      cloudAccounts = user.cloudAccounts;
    }
    
    // Check chunk accessibility
    const linkedAccountKeys = new Set(
      cloudAccounts.map(acc => `${acc.provider}:${acc.accountEmail}`)
    );
    
    const inaccessibleParts = fileDoc.parts.filter(part => {
      const accountKey = `${part.provider}:${part.accountEmail}`;
      return !linkedAccountKeys.has(accountKey);
    });
    
    if (inaccessibleParts.length > 0) {
      console.log(`Warning: Deleting file ${fileDoc._id} with ${inaccessibleParts.length} inaccessible parts`);
    }
    
    // Create a temporary user-like object for deleteAllParts function
    const accountHolder = { cloudAccounts };
    
    // Attempt to delete all accessible parts
    await deleteAllParts(accountHolder, fileDoc);
    await File.deleteOne({ _id: fileDoc._id });
    
    const message = inaccessibleParts.length > 0
      ? `File deleted (${inaccessibleParts.length} chunks on unlinked accounts could not be cleaned up)`
      : "File deleted successfully";
    
    res.json({ 
      message, 
      inaccessibleParts: inaccessibleParts.length,
      deletedBy: isTeamAdmin ? 'team-admin' : 'owner'
    });
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
      user.cloudAccounts.map((acc) => `${acc.provider}:${acc.accountEmail}`)
    );

    // Find files with missing chunks
    const orphanedFiles = allFiles
      .filter((file) => {
        return file.parts.some((part) => {
          const accountKey = `${part.provider}:${part.accountEmail}`;
          return !linkedAccountKeys.has(accountKey);
        });
      })
      .map((file) => {
        const missingParts = file.parts.filter((part) => {
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
          missingAccounts: [
            ...new Set(
              missingParts.map((p) => `${p.provider}:${p.accountEmail}`)
            ),
          ],
        };
      });

    res.json({
      orphanedFiles,
      count: orphanedFiles.length,
      totalFiles: allFiles.length,
    });
  } catch (e) {
    console.error("Orphaned files listing error:", e);
    next(e);
  }
});

// GET storage usage summary
router.get("/storage/info", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let total = 0;
    let available = 0;

    // Iterate over each linked cloud account and fetch storage info
    for (const account of user.cloudAccounts) {
      try {
        // Assuming you have a function to get storage info for each provider
        // This function should return an object with `total` and `available` properties in bytes
        const storageInfo = await getStorageInfoBefore(account);

        total += storageInfo.total;
        available += storageInfo.available;
      } catch (error) {
        console.error(
          `Failed to fetch storage info for ${account.provider}:${account.accountEmail}:`,
          error
        );
        // Optionally, you might want to handle this error differently, e.g., by skipping the account
        // or returning a specific error message to the client.
      }
    }

    res.json({
      total,
      available,
    });
  } catch (e) {
    console.error("Storage info error:", e);
    next(e);
  }
});



// Share file to different profiles (Admin or file owner only)
router.post('/:fileId/share', requireAuth, async (req, res, next) => {
  try {
    const { targetProfiles } = req.body;
    
    if (!targetProfiles || !Array.isArray(targetProfiles)) {
      return res.status(400).json({ error: 'targetProfiles array is required' });
    }
    
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if file belongs to a team
    if (!fileDoc.teamId) {
      return res.status(400).json({ error: 'Only team files can be shared to profiles' });
    }
    
    // Check if user is team admin or file owner
    const team = await Team.findById(fileDoc.teamId);
    const isAdmin = team && team.adminId.toString() === req.user._id.toString();
    const isOwner = fileDoc.ownerId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Only team admin or file owner can share files' });
    }
    
    // Validate profiles against team's available profiles
    const invalidProfiles = targetProfiles.filter(p => !team.profiles.includes(p));
    if (invalidProfiles.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid profiles',
        invalidProfiles,
        availableProfiles: team.profiles
      });
    }
    
    fileDoc.targetProfiles = targetProfiles;
    await fileDoc.save();
    
    res.json({ 
      message: 'File shared successfully',
      fileId: fileDoc._id,
      fileName: fileDoc.fileName,
      targetProfiles: fileDoc.targetProfiles
    });
  } catch (error) {
    console.error('Share file error:', error);
    next(error);
  }
});


export default router;
