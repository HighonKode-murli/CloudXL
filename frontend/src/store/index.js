import { configureStore } from '@reduxjs/toolkit'
import authSlice from './authSlice'
import cloudSlice from './cloudSlice'
import filesSlice from './filesSlice'
import storageSlice from './storageSlice'
import teamsSlice from './teamsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cloud: cloudSlice,
    files: filesSlice,
    storage: storageSlice,
    teams: teamsSlice,
  },
})

export default store
