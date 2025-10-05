# 🌩️ CloudXL — One Cloud to Rule Them All  

CloudXL is a full-stack enterprise storage platform that lets you escape the limits of "just 15 GB" by pooling together multiple free cloud storage accounts (Google Drive, Dropbox).

When you upload a file, CloudXL automatically splits it into chunks and distributes those parts across your linked cloud accounts. On download, it seamlessly pulls the pieces back together — like magic. ✨

Now with **Team Collaboration** — create teams, invite members, manage role-based access, and share files across different team profiles (editors, content-writers, tech-devs). Perfect for distributed teams managing content and projects!

A **super-cloud** powered by all your free space. 🚀  

---

## Features

### Backend
- **Authentication**: JWT-based user authentication with secure password hashing
- **Team Management**: Multi-tenant architecture with role-based access control (RBAC)
- **Team Profiles**: Organize members into profiles (editors, content-writers, tech-devs, cross-section)
- **Invitation System**: Email invitations with secure tokens and automated notifications
- **File Management**: Upload, download, and delete files with automatic splitting/merging
- **Profile-Based Sharing**: Share files to specific team profiles or cross-sections
- **Cloud Integration**: OAuth integration with Google Drive and Dropbox
- **Distributed Storage**: Files are split into chunks and distributed across connected providers
- **Team Storage Pools**: Admins manage centralized cloud accounts for team usage
- **Security**: Optional encryption of file chunks at rest, admin permissions, access control

### Frontend
- **Modern React App**: Built with React 18, Vite, and Tailwind CSS
- **Authentication System**: Login/signup with form validation and error handling
- **Protected Routes**: Route protection with JWT token management
- **Dual-Context Views**: Switch between personal and team file management
- **Team Dashboard**: Create teams, manage members, invite users, assign profiles
- **Admin Controls**: Team admin interface for member management and cloud account pooling
- **Dashboard**: Cloud provider connection management and status display
- **File Management**: Drag & drop upload, file listing, search, download with team context
- **Profile Filtering**: View files based on team profile membership
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
- Nodemailer for email invitations

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
- SMTP credentials (Gmail, SendGrid, Mailgun, or AWS SES)

