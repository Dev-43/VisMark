import dotenv from 'dotenv'
import express from 'express'
import folderRoutes from './routes/folders.js'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/folders', folderRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})