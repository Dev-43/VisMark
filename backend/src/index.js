import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import folderRoutes from './routes/folders.js'
import linksRouter from './routes/links.js'        
import authMiddleware from './middleware/auth.js'   

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/folders', folderRoutes)
app.use('/api/links', authMiddleware, linksRouter)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})