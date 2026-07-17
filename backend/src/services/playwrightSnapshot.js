/*
 * Standalone test implementation of Playwright-based screenshot service.
 * This is currently NOT wired into the queue/worker.
 */

import dotenv from 'dotenv'
dotenv.config()

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let browser = null

/**
 * Gets or initializes the singleton chromium browser instance.
 * Re-launches the browser if it has disconnected or crashed.
 */
async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return browser
}

/**
 * Captures a screenshot of the given URL and uploads it to Supabase.
 * Extracted page metadata (title, description, favicon) is returned along with the public URL.
 * 
 * @param {string} url - The URL to capture.
 * @param {string} linkId - The ID of the link, used to name the screenshot file.
 * @returns {Promise<{screenshotUrl: string, title: string|null, description: string|null, faviconUrl: string}>}
 */
export async function takeScreenshot(url, linkId) {
  let context = null
  let page = null

  try {
    const activeBrowser = await getBrowser()
    context = await activeBrowser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    page = await context.newPage()

    // Wait until network is idle (no connections for 500ms) with a 15 second timeout.
    let response
    try {
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
    } catch (gotoErr) {
      const nonRecoverableMessages = [
        'net::ERR_NAME_NOT_RESOLVED',
        'net::ERR_ADDRESS_UNREACHABLE',
        'net::ERR_CONNECTION_REFUSED',
        'NS_ERROR_UNKNOWN_HOST',
      ]
      const isDNSOrNetworkUnreachable = nonRecoverableMessages.some(msg => gotoErr.message.includes(msg))
      if (isDNSOrNetworkUnreachable) {
        gotoErr.isNonRecoverable = true
      }
      throw gotoErr
    }

    if (response && (response.status() === 404 || response.status() === 410)) {
      const err = new Error(`Page returned status ${response.status()}`)
      err.isNonRecoverable = true
      throw err
    }

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
      console.warn(`Failed to extract page metadata with Playwright:`, evalErr.message)
    }

    const screenshotBuffer = await page.screenshot({ type: 'png' })

    const identifier = linkId || `test-${Date.now()}`
    const filePath = `screenshots/${identifier}.png`

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

  } finally {
    if (page) await page.close()
    if (context) await context.close()
  }
}
