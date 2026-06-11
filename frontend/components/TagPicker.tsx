'use client'

import { useState } from 'react'

interface Props {
  linkId: string
  initialLinkTags: { tag_id: string }[]
  tags: any[]
  attachTag: (tagId: string, linkId: string) => Promise<void>
  removeTag: (tagId: string, linkId: string) => Promise<void>
}

export default function TagPicker({ linkId, initialLinkTags, tags, attachTag, removeTag }: Props) {
  const [activeTags, setActiveTags] = useState<Set<string>>(
    new Set(initialLinkTags.map(t => t.tag_id))
  )
  const [open, setOpen] = useState(false)

  async function toggleTag(tagId: string) {
    if (activeTags.has(tagId)) {
      await removeTag(tagId, linkId)
      setActiveTags(prev => { const s = new Set(prev); s.delete(tagId); return s })
    } else {
      await attachTag(tagId, linkId)
      setActiveTags(prev => new Set(prev).add(tagId))
    }
  }

  return (
    <div
      className="relative"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.preventDefault()
          setOpen(o => !o)
        }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        🏷 Tags
      </button>

      {open && (
        <div className="absolute z-10 bg-white border rounded shadow p-2 mt-1 flex flex-wrap gap-1 min-w-[160px]">
          {tags.length === 0 && (
            <p className="text-xs text-gray-400">No tags yet</p>
          )}
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                activeTags.has(tag.id)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}