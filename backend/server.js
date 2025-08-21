import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import connectToDB from './config/mongodb.js'
import authRoutes from './routes/auth-routes.js'
import cloudRoutes from './routes/cloud.js'
import fileRoutes from './routes/files.js'
import cors from 'cors'
import errorHandler from './middleware/error.js'
const app = express()

app.use(express.json())
connectToDB()

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Enable CORS for all routes
app.use(cors({
  origin: 'https://cloud-xl.vercel.app', // Your frontend URL
  credentials: true
}))



app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth',authRoutes)
app.use('/cloud',cloudRoutes)
app.use('/files',fileRoutes)

app.use(errorHandler)

const port = process.env.PORT
app.listen(port,()=>{
    console.log(`server started at port ${port}`)
})