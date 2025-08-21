import express from 'express'
const router = express.Router()
import {Login,Signup} from '../controller/auth-controller.js'

router.post('/login',Login)
router.post('/signup',Signup)

export default router