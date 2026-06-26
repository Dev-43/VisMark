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

    let metadata = { title: null, description: null, favicon: null }
    try {
      metadata = await page.evaluate(() => {
        const getMeta = (property) => {
          const element = document.querySelector(`meta[property="${property}"]`) || 
                          document.querySelector(`meta[name="${property}"]`);
          return element ? element.getAttribute('content') : null;
        };

        const title = getMeta('og:title') || document.title || null;
        const description = getMeta('og:description') || getMeta('description') || null;

        let favicon = null;
        const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
        for (const rel of rels) {
          const link = document.querySelector(`link[rel*="${rel}"]`);
          if (link && link.href) {
            favicon = link.href;
            break;
          }
        }

        return { title, description, favicon };
      });
    } catch (evalErr) {
      console.warn(`Failed to extract page metadata with Puppeteer:`, evalErr.message)
    }

    const screenshotBuffer = await page.screenshot({ type: 'png' })
    await browser.close()
    browser = null

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

    let faviconUrl = metadata.favicon
    if (!faviconUrl) {
      try {
        const { origin } = new URL(url)
        faviconUrl = `${origin}/favicon.ico`
      } catch {
        // ignore
      }
    }

    return {
      screenshotUrl: data.publicUrl,
      title: metadata.title,
      description: metadata.description,
      faviconUrl,
    }

  } catch (err) {
    if (browser) await browser.close()
    throw err
  }
}