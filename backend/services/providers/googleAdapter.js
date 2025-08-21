import {google, createGoogleOAuthClient} from '../../config/google.js'
import streamifier from 'streamifier'
import {ensureAccessToken} from '../../utils/tokens.js'

async function driveClient(account){
    await ensureAccessToken(account)
    const oauth2 = createGoogleOAuthClient()
    oauth2.setCredentials({access_token : account.accessToken, refresh_token : account.refreshToken})
    return google.drive({version : 'v3', auth : oauth2})
}

export async function getQuotaGoogle(account){
    const drive = await driveClient(account)
    const {data} = await drive.about.get({fields : 'storageQuota'})
    const limit = Number(data.storageQuota.limit || 0)
    const usage = Number(data.storageQuota.usage || 0)
    const available = limit ? Math.max(0,limit-usage) : 0
    return {available, used : usage, total : limit}
}

export async function uploadChunkGoogle(account,{chunkBuffer,name,mimeType}){
    const drive = await driveClient(account)
    const requestBody = {name}
    const media = {mimeType : mimeType || 'application/octet-stream', body : streamifier.createReadStream(chunkBuffer)}
    const res = await drive.files.create({requestBody,media,fields : 'id,size'})
    return {remoteId : res.data.id, size : Number(res.data.size || chunkBuffer.length)}
}

export async function downloadChunkGoogle(account, remoteId){
    const drive = await driveClient(account)
    const res = await drive.files.get({fileId : remoteId, alt : 'media'}, {responseType : 'arraybuffer'})
    return Buffer.from(res.data)
}

export async function deleteChunkGoogle(account,remoteId){
    const drive = await driveClient(account)
    try{
        await drive.files.delete({fileId : remoteId})
    }catch(err){
        console.log('Error ', err)
    }
}