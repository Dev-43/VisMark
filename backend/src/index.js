import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import folderRoutes from './routes/folders.js'
import linksRouter from './routes/links.js'
import authMiddleware from './middleware/auth.js'
import snapshotRoute from './routes/snapshot.js'
import searchRouter from './routes/search.js'
import './services/worker.js'
import tagsRouter from './routes/tags.js'
import { shareRouter, publicRouter } from './routes/share.js'

const app = express()
const PORT = process.env.PORT || 4000
const url = process.env.FRONTEND_URL

const allowedOrigins = [
  "http://localhost:3000",
  url
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true
}))

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})


app.use('/api/folders', authMiddleware, folderRoutes)
app.use('/api/links', authMiddleware, linksRouter)
app.use('/api/snapshot', authMiddleware, snapshotRoute)
app.use('/api/search', authMiddleware, searchRouter)
app.use('/api/tags', authMiddleware, tagsRouter)
app.use('/api/folders', authMiddleware, shareRouter)
app.use('/api/public', publicRouter) // public share endpoints — unauthenticated

app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({ error: "CORS: origin not allowed" })
    }
    next(err)
  })

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})