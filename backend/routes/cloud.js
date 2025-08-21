import express from 'express'
import requireAuth from '../middleware/auth.js'
import { requireAuthForOAuth, requireAuthFromSession } from '../middleware/oauthAuth.js'
import User from '../models/User.js'
import File from '../models/File.js'
import {PROVIDERS,SCOPES} from '../config/oauth.js'
import {createGoogleOAuthClient} from '../config/google.js'
import { google } from 'googleapis'
import { dropboxAuth } from '../config/dropbox.js'
import axios from 'axios'
import { ensureAccessToken } from "../utils/tokens.js"
import { getQuotaGoogle } from "../services/providers/googleAdapter.js"
import { getQuotaDropbox } from "../services/providers/dropboxAdapter.js"

const router = express.Router()

//status of linked accounts
router.get('/status',requireAuth,async(req,res)=>{
    const user = await User.findById(req.user._id)
    res.json({
        linkedAccounts : user.cloudAccounts.map(a=>({provider : a.provider,accountEmail : a.accountEmail, expiresAt : a.expiresAt}))
    })
})

//GOOGLE
router.get('/connect/google', requireAuthForOAuth, (req,res)=>{
    const oauth = createGoogleOAuthClient()
    const url = oauth.generateAuthUrl({
        access_type : 'offline',
        prompt : 'consent',
        scope : SCOPES.google || SCOPES[PROVIDERS.GOOGLE]
    })
    res.redirect(url)
})



router.get("/callback/google", requireAuthFromSession, async (req, res, next) => {
  try {
    const { code } = req.query;
    const oauth2Client = createGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Get account email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const accountEmail = userInfo.data.email;

    const user = await User.findById(req.user._id);

    // check if this account already linked
    const existing = user.cloudAccounts.find(
      acc => acc.provider === "google" && acc.accountEmail === accountEmail
    );

    if (existing) {
      existing.accessToken = tokens.access_token;
      existing.refreshToken = tokens.refresh_token || existing.refreshToken;
      existing.expiresAt = new Date(tokens.expiry_date);
    } else {
      user.cloudAccounts.push({
        provider: "google",
        accountEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date)
      });
    }

    await user.save();
    // Clear session and redirect to frontend
    req.session.destroy();
    res.redirect('http://localhost:5173/dashboard?connected=google');
  } catch (err) {
    next(err);
  }
});




// ─── DROPBOX ─────────────────────────────────────────────────────────────────
router.get('/connect/dropbox', requireAuthForOAuth, (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.DROPBOX_REDIRECT_URI,
    token_access_type: 'offline',
    scope: SCOPES[PROVIDERS.DROPBOX].join(' ')
  });
  res.redirect(`${dropboxAuth.authorizeEndpoint}?${params.toString()}`);
});

router.get("/callback/dropbox", requireAuthFromSession, async (req, res, next) => {
  try {
    const { code } = req.query;

    const tokenRes = await axios.post("https://api.dropboxapi.com/oauth2/token", null, {
      params: {
        code,
        grant_type: "authorization_code",
        client_id: process.env.DROPBOX_CLIENT_ID,
        client_secret: process.env.DROPBOX_CLIENT_SECRET,
        redirect_uri: process.env.DROPBOX_REDIRECT_URI
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const tokens = tokenRes.data;

    // fetch email using fetch API - Dropbox expects empty JSON object
    const userInfoResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: 'null'
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('Dropbox API error response:', errorText);
      throw new Error(`Dropbox API error: ${userInfoResponse.status} ${userInfoResponse.statusText} - ${errorText}`);
    }

    const userInfo = {
      data: await userInfoResponse.json()
    };

    const accountEmail = userInfo.data.email;

    const user = await User.findById(req.user._id);

    const existing = user.cloudAccounts.find(
      acc => acc.provider === "dropbox" && acc.accountEmail === accountEmail
    );

    if (existing) {
      existing.accessToken = tokens.access_token;
      existing.refreshToken = tokens.refresh_token || existing.refreshToken;
      existing.expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    } else {
      user.cloudAccounts.push({
        provider: "dropbox",
        accountEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
      });
    }

    await user.save();
    // Clear session and redirect to frontend
    req.session.destroy();
    res.redirect('http://localhost:5173/dashboard?connected=dropbox');
  } catch (err) {
    next(err);
  }
});







// Get storage statistics for all connected providers
router.get('/storage/stats', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const storageStats = {
      totalAvailable: 0,
      totalUsed: 0,
      providers: []
    }

    // Get storage info for each connected account
    for (const account of user.cloudAccounts) {
      try {
        await ensureAccessToken(account)

        let quota = { available: 0, used: 0, total: 0 }

        if (account.provider === PROVIDERS.GOOGLE) {
          quota = await getQuotaGoogle(account)
        } else if (account.provider === PROVIDERS.DROPBOX) {
          quota = await getQuotaDropbox(account)
        }

        const providerStats = {
          provider: account.provider,
          accountEmail: account.accountEmail,
          available: quota.available || 0,
          used: quota.used || 0,
          total: quota.total || (quota.available + quota.used) || 0,
          expiresAt: account.expiresAt
        }

        storageStats.providers.push(providerStats)
        storageStats.totalAvailable += providerStats.available
        storageStats.totalUsed += providerStats.used

      } catch (error) {
        console.error(`Failed to get quota for ${account.provider} (${account.accountEmail}):`, error)
        // Add provider with error status
        storageStats.providers.push({
          provider: account.provider,
          accountEmail: account.accountEmail,
          available: 0,
          used: 0,
          total: 0,
          error: 'Failed to fetch quota',
          expiresAt: account.expiresAt
        })
      }
    }

    console.log(`Storage stats for user ${user._id}:`, {
      totalAvailable: storageStats.totalAvailable,
      totalUsed: storageStats.totalUsed,
      providerCount: storageStats.providers.length
    })

    res.json(storageStats)
  } catch (error) {
    console.error('Storage stats error:', error)
    next(error)
  }
})

// Check impact of disconnecting a specific account
router.get('/disconnect-impact/:provider/:accountEmail', requireAuth, async (req, res, next) => {
  try {
    const { provider, accountEmail } = req.params
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get all files for this user
    const allFiles = await File.find({ ownerId: req.user._id }).select('_id fileName parts')

    // Find files that would be affected (have chunks on this account)
    const affectedFiles = allFiles.filter(file => {
      return file.parts.some(part =>
        part.provider === provider && part.accountEmail === accountEmail
      )
    })

    const impact = {
      totalFiles: allFiles.length,
      affectedFiles: affectedFiles.length,
      affectedFileNames: affectedFiles.map(f => f.fileName),
      provider,
      accountEmail
    }

    res.json(impact)
  } catch (error) {
    console.error('Disconnect impact check error:', error)
    next(error)
  }
})

// Disconnect specific cloud account by provider and email
router.delete('/disconnect/:provider/:accountEmail', requireAuth, async (req, res, next) => {
  try {
    const { provider, accountEmail } = req.params
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Find and remove the specific account
    const initialCount = user.cloudAccounts.length
    user.cloudAccounts = user.cloudAccounts.filter(acc =>
      !(acc.provider === provider && acc.accountEmail === accountEmail)
    )
    const removedCount = initialCount - user.cloudAccounts.length

    if (removedCount === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    await user.save()

    console.log(`Disconnected ${provider} account ${accountEmail} for user ${user._id}`)

    res.json({
      message: `Disconnected ${provider} account ${accountEmail}`,
      removedCount,
      remainingAccounts: user.cloudAccounts.length
    })
  } catch (error) {
    console.error('Disconnect error:', error)
    next(error)
  }
})

// Disconnect cloud provider accounts (keep for backward compatibility)
router.delete('/disconnect/:provider', requireAuth, async (req, res, next) => {
  try {
    const { provider } = req.params
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Remove all accounts for the specified provider
    const initialCount = user.cloudAccounts.length
    user.cloudAccounts = user.cloudAccounts.filter(acc => acc.provider !== provider)
    const removedCount = initialCount - user.cloudAccounts.length

    await user.save()

    console.log(`Disconnected ${removedCount} ${provider} accounts for user ${user._id}`)

    res.json({
      message: `Disconnected ${removedCount} ${provider} account(s)`,
      removedCount,
      remainingAccounts: user.cloudAccounts.length
    })
  } catch (error) {
    console.error('Disconnect error:', error)
    next(error)
  }
})

export default router