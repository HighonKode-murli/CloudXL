import { PROVIDERS } from "../config/oauth.js";
import { maybeEncrypt, maybeDecrypt } from "../utils/crypto.js";
import { ensureAccessToken } from "../utils/tokens.js";
import {
  getQuotaGoogle,
  uploadChunkGoogle,
  downloadChunkGoogle,
  deleteChunkGoogle,
} from "./providers/googleAdapter.js";
import {
  getQuotaDropbox,
  uploadChunkDropbox,
  downloadChunkDropbox,
  deleteChunkDropbox,
} from "./providers/dropboxAdapter.js";

export function getLinkedAccountsByProvider(user) {
  const byProv = {};
  for (const acc of user.cloudAccounts) {
    byProv[acc.provider] = byProv[acc.provider] || [];
    byProv[acc.provider].push(acc);
  }
  return byProv;
}

export async function providerAvailableBytes(account) {
  if (account.provider === PROVIDERS.GOOGLE)
    return (await getQuotaGoogle(account)).available;
  if (account.provider === PROVIDERS.DROPBOX)
    return (await getQuotaDropbox(account)).available;
  return 0;
}

export async function getStorageInfoBefore(account){
  if (account.provider === PROVIDERS.GOOGLE)
    return await getQuotaGoogle(account);
  if (account.provider === PROVIDERS.DROPBOX)
    return await getQuotaDropbox(account);
}

export async function chooseTargetsForSize(user, totalSize) {
  const accounts = [...user.cloudAccounts];
  if (accounts.length === 0) throw new Error("No cloud accounts linked");

  const slots = [];
  let totalAvailable = 0;
  for (const acc of accounts) {
    await ensureAccessToken(acc);
    const avail = await providerAvailableBytes(acc).catch(() => 0);
    totalAvailable += avail;
    slots.push({ acc, avail });
  }
 
  
  slots.sort((a, b) => b.avail - a.avail);

  const CHUNK = Number(Math.min(slots[slots.length-1].avail,Math.max(totalSize/5,104857600)));  //100MB is the min chunk size
  let remaining = totalSize;
  const plan = [];
  let order = 0;

  while (remaining > 0) {
    const slot = slots.find((s) => s.avail >= CHUNK) || slots[0];
    const take = Math.min(CHUNK, remaining);
    plan.push({ account: slot.acc, bytes: take, order: order++ });
    slot.avail = Math.max(0, slot.avail - take);
    remaining -= take;
  }
  return plan;
}

export async function uploadSplitAcrossProviders(user, file) {
  const { buffer, originalname, mimetype } = file;
  const total = buffer.length;
  console.log(`Uploading file: ${originalname}, size: ${total} bytes, type: ${mimetype}`);

  let plan;
  try{
    plan = await chooseTargetsForSize(user, total);
    console.log(`Upload plan created with ${plan.length} chunks`);
  }catch(err){
    console.log('Error creating upload plan');
    throw err;
  }
  

  let offset = 0;
  const parts = [];

  for (const p of plan) {
    console.log(`Processing chunk ${p.order} for ${p.account.provider} (${p.bytes} bytes)`);
    const slice = buffer.subarray(offset, offset + p.bytes);
    offset += p.bytes;

    const { buf } = maybeEncrypt(slice);
    const timestamp = Date.now();
    const name = `${timestamp}_${originalname}.part${String(p.order).padStart(6, "0")}`;

    let uploaded;
    try {
      if (p.account.provider === PROVIDERS.GOOGLE) {
        console.log(`Uploading to Google Drive: ${name}`);
        uploaded = await uploadChunkGoogle(p.account, {
          chunkBuffer: buf,
          name,
          mimeType: mimetype,
        });
      } else if (p.account.provider === PROVIDERS.DROPBOX) {
        console.log(`Uploading to Dropbox: ${name}`);
        uploaded = await uploadChunkDropbox(p.account, {
          chunkBuffer: buf,
          name,
        });
      } else {
        throw new Error("Unknown provider");
      }
      console.log(`Chunk ${p.order} uploaded successfully, remoteId: ${uploaded.remoteId}`);
    } catch (error) {
      console.error(`Failed to upload chunk ${p.order} to ${p.account.provider}:`, error);
      throw error;
    }

    parts.push({
      provider: p.account.provider,
      accountEmail: p.account.accountEmail, // 🔑 NEW: track which account
      remoteId: uploaded.remoteId,
      size: uploaded.size || buf.length,
      order: p.order,
    });
  }
  console.log(`All chunks uploaded successfully, total parts: ${parts.length}`);
  return { parts, totalSize: total, mimeType: mimetype };
}

export async function downloadAndMerge(user, fileDoc) {
  //dowload each part and concatenate
  const ordered = [...fileDoc.parts].sort((a, b) => a.order - b.order);
  const bufs = [];

  for (const part of ordered) {
    const acc = user.cloudAccounts.find(
      (a) =>
        a.provider === part.provider && a.accountEmail === part.accountEmail
    );
    if (!acc)
      throw new Error(
        `Missing linked account for ${part.provider} (${part.accountEmail})`
      );

    let data;
    if (part.provider === PROVIDERS.GOOGLE) {
      data = await downloadChunkGoogle(acc, part.remoteId);
    } else if (part.provider === PROVIDERS.DROPBOX) {
      data = await downloadChunkDropbox(acc, part.remoteId);
    } else {
      throw new Error("Unknown provider");
    }

    bufs.push(maybeDecrypt(data));
  }

  return Buffer.concat(bufs);
}

export async function deleteAllParts(user, fileDoc) {
  for (const part of fileDoc.parts) {
    const acc = user.cloudAccounts.find(
      (a) =>
        a.provider === part.provider && a.accountEmail === part.accountEmail
    );
    if (!acc) continue;

    try {
      if (part.provider === PROVIDERS.GOOGLE) {
        await deleteChunkGoogle(acc, part.remoteId);
      } else if (part.provider === PROVIDERS.DROPBOX) {
        await deleteChunkDropbox(acc, part.remoteId);
      }
    } catch {}
  }
}


export async function uploadSplitAcrossProvidersTeam(team, user, file, targetProfiles) {
  // Use team's cloud accounts instead of user's personal accounts
  const { buffer, originalname, mimetype } = file;
  const total = buffer.length;
  
  if (team.cloudAccounts.length === 0) {
    throw new Error("Team has no linked cloud accounts");
  }
  
  // Use team.cloudAccounts instead of user.cloudAccounts
  const plan = await chooseTargetsForSizeTeam(team, total);
  
  // Same chunking logic but using team accounts
  let offset = 0;
  const parts = [];
  
  for (const p of plan) {
    const slice = buffer.subarray(offset, offset + p.bytes);
    offset += p.bytes;
    
    const { buf } = maybeEncrypt(slice);
    const timestamp = Date.now();
    const name = `team_${team._id}_${timestamp}_${originalname}.part${String(p.order).padStart(6, "0")}`;
    
    // Upload using team account
    let uploaded;
    if (p.account.provider === PROVIDERS.GOOGLE) {
      uploaded = await uploadChunkGoogle(p.account, {
        chunkBuffer: buf,
        name,
        mimeType: mimetype,
      });
    } else if (p.account.provider === PROVIDERS.DROPBOX) {
      uploaded = await uploadChunkDropbox(p.account, {
        chunkBuffer: buf,
        name,
      });
    }
    
    parts.push({
      provider: p.account.provider,
      accountEmail: p.account.accountEmail,
      remoteId: uploaded.remoteId,
      size: uploaded.size || buf.length,
      order: p.order,
    });
  }
  
  return { parts, totalSize: total, mimeType: mimetype };
}



async function chooseTargetsForSizeTeam(team, totalSize) {
  const accounts = [...team.cloudAccounts];
  if (accounts.length === 0) throw new Error("No cloud accounts linked to team");
  
  // Same logic as original but using team accounts
  const slots = [];
  for (const acc of accounts) {
    await ensureAccessToken(acc);
    const avail = await providerAvailableBytes(acc).catch(() => 0);
    slots.push({ acc, avail });
  }
  
  
  slots.sort((a, b) => b.avail - a.avail);

  const CHUNK = Number(Math.min(slots[slots.length-1].avail,Math.max(totalSize/5,104857600)));  //100MB is the min chunk size
  let remaining = totalSize;
  const plan = [];
  let order = 0;

  while (remaining > 0) {
    const slot = slots.find((s) => s.avail >= CHUNK) || slots[0];
    const take = Math.min(CHUNK, remaining);
    plan.push({ account: slot.acc, bytes: take, order: order++ });
    slot.avail = Math.max(0, slot.avail - take);
    remaining -= take;
  }
  return plan;
}