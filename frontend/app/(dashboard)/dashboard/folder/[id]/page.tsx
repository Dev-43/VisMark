'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'
import TagPicker from '@/components/TagPicker'
import { useTags } from '@/lib/hooks/useTags'

type Tag = {
  id: string
  name: string
}

type LinkTag = {
  tag_id: string
  tags: Tag
}

type Link = {
  id: string
  url: string
  title: string | null
  description: string | null
  screenshot_url: string | null
  favicon_url: string | null
  snapshot_status: string
  created_at: string
  link_tags: LinkTag[]
}

export default function FolderPage() {
  const { id: folderId } = useParams()
  const [links, setLinks] = useState<Link[]>([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const { tags, attachTag, removeTag } = useTags() // ← fetched ONCE here
  const [isPublic, setIsPublic] = useState(false)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)

  const fetchLinks = useCallback(async () => {
  const res = await apiFetch(`/api/links?folder_id=${folderId}`)
  const data = await res.json()
    setLinks(data)
  }, [folderId])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  useEffect(() => {
    const hasPending = links.some(l => l.snapshot_status === 'pending')
    if (hasPending) {
      pollRef.current = setTimeout(fetchLinks, 3000)
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [links, fetchLinks])
  const fetchFolder = useCallback(async () => {
  const res = await apiFetch(`/api/folders/${folderId}`)
  const data = await res.json()
  setIsPublic(data.is_public)
  setPublicSlug(data.public_slug)
  }, [folderId])

  useEffect(() => {
    fetchFolder()
  }, [fetchFolder])

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
    apiFetch('/api/snapshot', {
      method: 'POST',
      body: JSON.stringify({ linkId: newLink.id, url: newLink.url }),
    }).catch(err => console.error('Snapshot trigger failed:', err))
  }

  async function handleShareToggle() {
    setShareLoading(true)
    const res = await apiFetch(`/api/folders/${folderId}/share`, {
      method: 'PATCH',
      body: JSON.stringify({ enable: !isPublic }),
    })
    const data = await res.json()
    setIsPublic(data.is_public)
    setPublicSlug(data.public_slug)

    if (data.public_slug) {
      const shareUrl = `${window.location.origin}/share/${data.public_slug}`
      await navigator.clipboard.writeText(shareUrl)
      alert('Share link copied to clipboard!')  // replace with a toast later
    }

    setShareLoading(false)
  }
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Folder</h1>
        <button
          onClick={handleShareToggle}
          disabled={shareLoading}
          className={`px-4 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors ${
            isPublic
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {shareLoading ? 'Updating...' : isPublic ? '🔗 Shared' : 'Share'}
        </button>
      </div>

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
          <LinkCard
            key={link.id}
            link={link}
            tags={tags}
            attachTag={attachTag}
            removeTag={removeTag}
          />
        ))}
      </div>
    </div>
  )
}

// ── Link Card Component ───────────────────────────────────────────

function LinkCard({ link, tags, attachTag, removeTag }: {
  link: Link
  tags: any[]
  attachTag: (tagId: string, linkId: string) => Promise<void>
  removeTag: (tagId: string, linkId: string) => Promise<void>
}) {
  const domain = (() => {
    try { return new URL(link.url).hostname }
    catch { return link.url }
  })()

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

  if (link.screenshot_url) {
  return (
    <div className="border rounded-lg  hover:shadow-md transition-shadow">
      {/* Only this part is a link */}
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={link.screenshot_url}
          alt={link.title || domain}
          className="w-full h-36 object-cover object-top"
        />
        <div className="p-3 pb-1">
          <p className="text-sm font-medium truncate">{link.title || domain}</p>
          <p className="text-xs text-gray-400 truncate">{domain}</p>
        </div>
      </a>
      {/* TagPicker is OUTSIDE the <a> tag */}
      <div className="px-3 pb-3">
        <TagPicker
          linkId={link.id}
          initialLinkTags={link.link_tags ?? []}
          tags={tags}
          attachTag={attachTag}
          removeTag={removeTag}
        />
      </div>
    </div>
  )
}

 return (
  <div className="border rounded-lg hover:shadow-md transition-shadow">
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-t-lg">
      <div className="h-36 bg-gray-50 flex items-center justify-center">
        {link.favicon_url
          ? <img src={link.favicon_url} alt="" className="w-10 h-10" onError={e => (e.currentTarget.style.display = 'none')} />
          : <span className="text-2xl font-bold text-gray-300">{domain[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="p-3 pb-1">
        <p className="text-sm font-medium truncate">{link.title || domain}</p>
        <p className="text-xs text-gray-400 truncate">{domain}</p>
      </div>
    </a>
    <div className="px-3 pb-3">
      <TagPicker
        linkId={link.id}
        initialLinkTags={link.link_tags ?? []}
        tags={tags}
        attachTag={attachTag}
        removeTag={removeTag}
      />
    </div>
  </div>
)
}