import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import folderRoutes from './routes/folders.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:3000'
}))

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/folders', folderRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})