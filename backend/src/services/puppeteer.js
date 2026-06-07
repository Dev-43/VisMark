import dotenv from 'dotenv'
dotenv.config()

import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function takeScreenshot(url, linkId) {
  let browser = null

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })

    const screenshotBuffer = await page.screenshot({ type: 'png' })
    await browser.close()

    const filePath = `screenshots/${linkId}.png`

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET)
      .upload(filePath, screenshotBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return data.publicUrl

  } catch (err) {
    if (browser) await browser.close()
    throw err
  }
}