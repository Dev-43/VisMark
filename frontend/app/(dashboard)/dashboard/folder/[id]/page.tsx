'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'

type Link = {
  id: string
  url: string
  title: string | null
  description: string | null
  screenshot_url: string | null
  favicon_url: string | null
  snapshot_status: string
  created_at: string
}

export default function FolderPage() {
  const { id: folderId } = useParams()
  const [links, setLinks] = useState<Link[]>([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLinks = useCallback(async () => {
    const res = await apiFetch(`/api/links?folder_id=${folderId}`)
    const data = await res.json()
    setLinks(data)
  }, [folderId])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  // Polling — runs whenever links change, checks if any are still pending
  useEffect(() => {
    const hasPending = links.some(l => l.snapshot_status === 'pending')

    if (hasPending) {
      pollRef.current = setTimeout(fetchLinks, 3000)
    }

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [links, fetchLinks])

  async function handleSave() {
    if (!url.trim()) return
    setLoading(true)

    const res = await apiFetch('/api/links', {
      method: 'POST',
      body: JSON.stringify({ folder_id: folderId, url }),
    })

    const newLink = await res.json()
    setLinks(prev => [newLink, ...prev])
    setUrl('')
    setLoading(false)

    // Trigger screenshot job — fire and forget, don't await
    apiFetch('/api/snapshot', {
      method: 'POST',
      body: JSON.stringify({ linkId: newLink.id, url: newLink.url }),
    }).catch(err => console.error('Snapshot trigger failed:', err))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Folder</h1>

      <div className="flex gap-2 mb-8">
        <input
          type="url"
          placeholder="Paste a URL..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map(link => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>
    </div>
  )
}

// ── Link Card Component ───────────────────────────────────────────

function LinkCard({ link }: { link: Link }) {
  const domain = (() => {
    try { return new URL(link.url).hostname }
    catch { return link.url }
  })()

  // Pending state — show animated skeleton
  if (link.snapshot_status === 'pending') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="h-36 bg-gray-100 animate-pulse" />
        <div className="p-3">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
        </div>
      </div>
    )
  }

  // Screenshot available — show it
  if (link.screenshot_url) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer"
        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={link.screenshot_url}
          alt={link.title || domain}
          className="w-full h-36 object-cover object-top"
        />
        <div className="p-3">
          <p className="text-sm font-medium truncate">{link.title || domain}</p>
          <p className="text-xs text-gray-400 truncate">{domain}</p>
        </div>
      </a>
    )
  }

  // Failed — show generic card with favicon
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer"
      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-36 bg-gray-50 flex items-center justify-center">
        {link.favicon_url
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.favicon_url} alt="" className="w-10 h-10" onError={e => (e.currentTarget.style.display = 'none')} />
          ) : <span className="text-2xl font-bold text-gray-300">{domain[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">{link.title || domain}</p>
        <p className="text-xs text-gray-400 truncate">{domain}</p>
      </div>
    </a>
  )
}