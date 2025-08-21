import axios from 'axios';


export const dropboxAuth = {
tokenEndpoint: 'https://api.dropbox.com/oauth2/token',
authorizeEndpoint: 'https://www.dropbox.com/oauth2/authorize'
};


export async function refreshDropboxAccessToken(refreshToken) {
const params = new URLSearchParams();
params.set('grant_type', 'refresh_token');
params.set('refresh_token', refreshToken);
params.set('client_id', process.env.DROPBOX_CLIENT_ID);
params.set('client_secret', process.env.DROPBOX_CLIENT_SECRET);
const { data } = await axios.post(dropboxAuth.tokenEndpoint, params);
return data; // {access_token, token_type, expires_in}
}