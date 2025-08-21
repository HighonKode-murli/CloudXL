import { configureStore } from '@reduxjs/toolkit'
import authSlice from './authSlice'
import cloudSlice from './cloudSlice'
import filesSlice from './filesSlice'
import storageSlice from './storageSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cloud: cloudSlice,
    files: filesSlice,
    storage: storageSlice,
  },
})

export default store
