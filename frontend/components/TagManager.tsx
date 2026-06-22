'use client'

import { useState } from 'react'
import { useTags } from '@/lib/hooks/useTags'
import Link from 'next/link'

export default function TagManager() {
  const { tags, createTag, deleteTag } = useTags()
  const [input, setInput] = useState('')
  const [err, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setError('')
    try {
      await createTag(input.trim())
      setInput('')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="font-semibold mb-3">Your Tags</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="New tag name..."
          className="border rounded px-3 py-1 text-sm flex-1"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
          Add
        </button>
      </form>

      {err && <p className="text-red-500 text-xs mt-1">{err}</p>}

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag.id} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
            <Link href={`/dashboard/tags/${tag.id}`} className="hover:underline">
              {tag.name}
            </Link>
            <button
              onClick={() => deleteTag(tag.id)}
              className="text-gray-400 hover:text-red-500 ml-1"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}