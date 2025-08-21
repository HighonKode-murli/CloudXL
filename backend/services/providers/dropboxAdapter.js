import { Dropbox } from 'dropbox';
import { ensureAccessToken } from '../../utils/tokens.js';


async function dbxClient(account) {
await ensureAccessToken(account);
return new Dropbox({ accessToken: account.accessToken, fetch });
}


export async function getQuotaDropbox(account) {
const dbx = await dbxClient(account);
const usage = await dbx.usersGetSpaceUsage();

let limit = 2 * 1024 * 1024 * 1024;
// if (alloc['.tag'] === 'individual') limit = alloc.individual.allocated;
// if (alloc['.tag'] === 'team') limit = alloc.team.allocated;
const used = usage.result.used;
const available = Math.max(0, Number(limit) - Number(used));
return { available, used, total: limit };
}


export async function uploadChunkDropbox(account, { chunkBuffer, name }) {
console.log(`Dropbox upload starting: ${name}, size: ${chunkBuffer.length} bytes`);
try {
  const dbx = await dbxClient(account);
  console.log('Dropbox client created, uploading...');
  const resp = await dbx.filesUpload({
    path: `/${name}`,
    contents: chunkBuffer,
    mode: { '.tag': 'overwrite' } // Use overwrite instead of add to handle existing files
  });
  console.log('Dropbox upload successful:', resp.result.id);
  return { remoteId: resp.result.id, size: chunkBuffer.length };
} catch (error) {
  console.error('Dropbox upload failed:', error);
  throw error;
}
}


export async function downloadChunkDropbox(account, remoteId) {
const dbx = await dbxClient(account);
const meta = await dbx.filesGetMetadata({ path: remoteId }); // if remoteId is id, we may need filesGetTemporaryLink
// Safer: get temp link using file path or id
const link = await dbx.filesGetTemporaryLink({ path: remoteId });
const r = await fetch(link.result.link);
const ab = await r.arrayBuffer();
return Buffer.from(ab);
}


export async function deleteChunkDropbox(account, remoteId) {
const dbx = await dbxClient(account);
try { await dbx.filesDeleteV2({ path: remoteId }); } catch {}
}