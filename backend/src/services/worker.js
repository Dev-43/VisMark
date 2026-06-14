import dotenv from 'dotenv'
dotenv.config()

import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import { takeScreenshot } from './puppeteer.js'
import { scrapeOGData } from './ogScraper.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
})

async function updateLink(linkId, data) {
  const { error } = await supabase.from('links').update(data).eq('id', linkId)
  if (error) throw error
}

const worker = new Worker(
  'screenshots',
  async (job) => {
    const { linkId, url } = job.data
    console.log(`Processing job for link ${linkId}: ${url}`)

    try {
      const screenshotUrl = await takeScreenshot(url, linkId)
      await updateLink(linkId, { screenshot_url: screenshotUrl, snapshot_status: 'done' })
      console.log(`✅ Puppeteer succeeded for ${url}`)
      return
    } catch (puppeteerErr) {
      console.warn(`⚠️ Puppeteer failed for ${url}:`, puppeteerErr.message)
    }

    try {
      const { ogImage, ogTitle, ogDescription, faviconUrl } = await scrapeOGData(url)
      await updateLink(linkId, {
        screenshot_url: ogImage,
        favicon_url: faviconUrl,
        title: ogTitle,
        description: ogDescription,
        snapshot_status: ogImage ? 'done' : 'failed',
      })
      console.log(`✅ OG scraper succeeded for ${url}`)
      return
    } catch (ogErr) {
      console.warn(`⚠️ OG scraper failed for ${url}:`, ogErr.message)
    }

    try {
      const domain = new URL(url).hostname
      const faviconUrl = `https://${domain}/favicon.ico`
      await updateLink(linkId, { screenshot_url: null, favicon_url: faviconUrl, snapshot_status: 'failed' })
      console.log(`⚠️ Generic card fallback used for ${url}`)
    } catch (finalErr) {
      console.error(`❌ All fallbacks failed for ${linkId}:`, finalErr.message)
    }
  },
  { connection }
)

worker.on('completed', (job) => console.log(`Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message))

export { worker }