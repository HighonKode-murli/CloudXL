# CloudStore - Distributed File Storage System

A full-stack application that splits uploaded files into parts and distributes them across multiple cloud storage providers (Google Drive, Dropbox) for redundancy and security.

## Features

### Backend
- **Authentication**: JWT-based user authentication with secure password hashing
- **File Management**: Upload, download, and delete files with automatic splitting/merging
- **Cloud Integration**: OAuth integration with Google Drive and Dropbox
- **Distributed Storage**: Files are split into chunks and distributed across connected providers
- **Security**: Optional encryption of file chunks at rest

### Frontend
- **Modern React App**: Built with React 18, Vite, and Tailwind CSS
- **Authentication System**: Login/signup with form validation and error handling
- **Protected Routes**: Route protection with JWT token management
- **Dashboard**: Cloud provider connection management and status display
- **File Management**: Drag & drop upload, file listing, search, and download
- **Responsive Design**: Mobile-friendly interface with accessibility features
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Toast Notifications**: Real-time user feedback for actions

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Google APIs and Dropbox SDK
- Multer for file uploads
- bcrypt for password hashing

### Frontend
- React 18 with Vite
- Redux Toolkit for state management
- React Router for navigation
- React Hook Form for form handling
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Google Cloud Console project with Drive API enabled
- Dropbox App with OAuth configured

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET_KEY=your_jwt_secret
   PORT=5000
   CHUNK_SIZE_BYTES=10485760
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/cloud/callback/google
   
   # Dropbox OAuth
   DROPBOX_CLIENT_ID=your_dropbox_client_id
   DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
   DROPBOX_REDIRECT_URI=http://localhost:5000/cloud/callback/dropbox
   
   # Optional encryption
   ENABLE_ENCRYPTION=false
   ENCRYPTION_SECRET=32byteshexstring000000000000000000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Login**: Sign in to access the dashboard
3. **Connect Cloud Providers**: Link your Google Drive and/or Dropbox accounts
4. **Upload Files**: Use the Files page to upload files via drag & drop or file picker
5. **Manage Files**: View, search, sort, download, and delete your files
6. **Download Files**: Files are automatically reassembled from distributed chunks

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Cloud Providers
- `GET /cloud/status` - Get linked account status
- `GET /cloud/connect/google` - Initiate Google OAuth
- `GET /cloud/callback/google` - Handle Google OAuth callback
- `GET /cloud/connect/dropbox` - Initiate Dropbox OAuth
- `GET /cloud/callback/dropbox` - Handle Dropbox OAuth callback

### Files
- `POST /files/upload` - Upload file
- `GET /files` - List user files
- `GET /files/:fileId` - Download file
- `DELETE /files/:fileId` - Delete file

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Optional file encryption at rest
- Secure OAuth flows

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
