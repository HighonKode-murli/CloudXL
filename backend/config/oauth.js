export const PROVIDERS = {
  GOOGLE: 'google',
  ONEDRIVE: 'onedrive',
  DROPBOX: 'dropbox'
};

export const SCOPES = {
  [PROVIDERS.GOOGLE]: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
  
  [PROVIDERS.DROPBOX]: [
    // Dropbox scopes; use files.content.write/read and account info
    'files.content.write',
    'files.content.read',
    'account_info.read'
  ]
};