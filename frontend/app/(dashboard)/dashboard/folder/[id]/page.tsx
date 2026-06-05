'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'

type Link = {
  id: string
  url: string
  title: string | null
  snapshot_status: string
  created_at: string
}

export default function FolderPage() {
  const { id: folderId } = useParams()
  const [links, setLinks] = useState<Link[]>([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    async function fetchLinks() {
      const res = await apiFetch(`/api/links?folder_id=${folderId}`)
      const data = await res.json()
      setLinks(data)
    }
    fetchLinks()
  }, [folderId])
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
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
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

      <div className="flex flex-col gap-3">
        {links.map(link => (
          <div key={link.id} className="border rounded p-4">
            <p className="text-sm font-medium truncate">{link.url}</p>
            <span className="text-xs text-gray-400 mt-1 inline-block">
              {link.snapshot_status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}