# Team Files Implementation Summary

## Changes Implemented

### Backend (Already Complete)
The backend already has full support for team files:

1. **File Upload with Team Context** (`POST /files/upload`)
   - Accepts `teamId` and `targetProfiles` parameters
   - Uses team's cloud accounts for storage
   - Automatically assigns user's profile if no targetProfiles specified

2. **File Listing with Team Filter** (`GET /files?teamId=xxx`)
   - Filters files by team membership
   - Shows only files accessible to user's profile
   - Admins see all team files

3. **File Download** (`GET /files/:fileId`)
   - Uses team cloud accounts for team files
   - Uses personal cloud accounts for personal files

4. **File Deletion** (`DELETE /files/:fileId`)
   - Team admins can delete any team file
   - File owners can delete their own files

### Frontend Changes

#### 1. Teams Page (`frontend/src/pages/Teams.jsx`)
**Added:**
- "View Team Files" button for member teams
- Navigation to Files page with team context
- Passes `teamId`, `teamName`, and `memberProfile` via navigation state

#### 2. Files Page (Needs Update)
**Required Changes:**
The Files page already has team selector UI, but needs to:
- Check for navigation state on mount
- Auto-select team if coming from Teams page
- Show team name in header when viewing team files
- Lock profile selector to user's profile for members
- Allow admins to select any profile

**Implementation needed in `frontend/src/pages/Files.jsx`:**

```javascript
import { useLocation } from 'react-router-dom'

// In the Files component:
const location = useLocation()

useEffect(() => {
  // Check if navigated from Teams page with team context
  if (location.state?.teamId) {
    setSelectedTeamId(location.state.teamId)
    // For members, lock to their profile
    if (location.state.memberProfile) {
      setSelectedProfiles([location.state.memberProfile])
    }
  }
}, [location.state])

// Update the team selector section to show team name if from navigation
{location.state?.teamName && (
  <div className="mb-4 p-3 bg-indigo-50 rounded-md">
    <p className="text-sm text-indigo-800">
      Viewing files for: <span className="font-semibold">{location.state.teamName}</span>
      {location.state.memberProfile && (
        <span className="ml-2">
          (Profile: {location.state.memberProfile})
        </span>
      )}
    </p>
  </div>
)}
```

## How It Works

### For Team Members:
1. User clicks "View Team Files" on their team card
2. Navigates to Files page with team context
3. Files page automatically:
   - Selects the team
   - Sets their profile
   - Loads team files they can access
4. When uploading:
   - File goes to team storage (using team's cloud accounts)
   - Automatically tagged with their profile
   - Uses team's cloud accounts for storage

### For Team Admins:
1. Admin can view team files from Files page team selector
2. Can see all team files regardless of profile
3. Can upload files and assign to any profile(s)
4. Can delete any team file

## Key Features

✅ **Profile-Based Access Control**
- Members only see files for their profile or "cross-section"
- Admins see all team files

✅ **Team Cloud Accounts**
- Team files use team's cloud accounts (managed by admin)
- Personal files use personal cloud accounts
- Completely separate storage contexts

✅ **Seamless Navigation**
- Click "View Team Files" → Automatically filtered view
- Upload context preserved
- Profile automatically set for members

✅ **Upload Context**
- Team selector shows "Personal Files" vs team names
- Profile selector (for team uploads)
- Automatic profile assignment for members

## Testing Checklist

### As Team Member:
- [ ] Click "View Team Files" from Teams page
- [ ] See only files for your profile
- [ ] Upload a file (should use team storage)
- [ ] Download a team file
- [ ] Cannot see files for other profiles (unless cross-section)

### As Team Admin:
- [ ] View all team files
- [ ] Upload file with specific profile(s)
- [ ] Upload file to "cross-section"
- [ ] Delete team files
- [ ] See team members can access appropriate files

### Storage Verification:
- [ ] Team files use team cloud accounts
- [ ] Personal files use personal cloud accounts
- [ ] Team admin manages team cloud connections
- [ ] Members don't need personal cloud accounts for team files

## Notes

- The backend is fully implemented and working
- Frontend Teams page is complete with navigation
- Files page needs minor updates to handle navigation state
- All team file operations use team's cloud accounts automatically
- Profile-based filtering happens on backend
