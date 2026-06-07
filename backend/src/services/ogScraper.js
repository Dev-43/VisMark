import * as cheerio from 'cheerio'

export async function scrapeOGData(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisMark/1.0)' },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`)

  const html = await response.text()
  const $ = cheerio.load(html)

  const getMeta = (property) =>
    $(`meta[property="${property}"]`).attr('content') ||
    $(`meta[name="${property}"]`).attr('content') ||
    null

  const ogImage = getMeta('og:image')
  const ogTitle = getMeta('og:title') || $('title').text() || null
  const ogDescription = getMeta('og:description') || getMeta('description') || null

  const { hostname, protocol } = new URL(url)
  const faviconUrl = `${protocol}//${hostname}/favicon.ico`

  return { ogImage, ogTitle, ogDescription, faviconUrl }
}