'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'
import Link from 'next/link'
import { Tag } from '@/lib/hooks/useTags'

type LinkItem = {
  id: string
  url: string
  title: string | null
  screenshot_url: string | null
}

export default function TagPage() {
  const { tagId } = useParams()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [tagName, setTagName] = useState('')

  useEffect(() => {
    async function load() {
      // fetch tag name
      const tagsRes = await apiFetch('/api/tags')
      const tags: Tag[] = await tagsRes.json()
      const tag = tags.find((t) => t.id === tagId)
      if (tag) setTagName(tag.name)

      // fetch links for this tag
      const linksRes = await apiFetch(`/api/tags/${tagId}/links`)
      const data = await linksRes.json()
      setLinks(data)
    }
    load()
  }, [tagId])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/dashboard" className="text-sm text-blue-500 hover:underline mb-4 block">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        Tag: <span className="text-blue-500">#{tagName}</span>
      </h1>

      {links.length === 0 && (
        <p className="text-gray-400 text-sm">No links with this tag yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map(link => {
          const domain = (() => {
            try { return new URL(link.url).hostname }
            catch { return link.url }
          })()

          return (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow block">
              {link.screenshot_url && (
                <img src={link.screenshot_url} alt={link.title || domain}
                  className="w-full h-36 object-cover object-top" />
              )}
              <div className="p-3">
                <p className="text-sm font-medium truncate">{link.title || domain}</p>
                <p className="text-xs text-gray-400 truncate">{domain}</p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}