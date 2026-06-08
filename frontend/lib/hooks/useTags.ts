import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

async function getAuthHeader() {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return { Authorization: `Bearer ${token}` }
}

export function useTags() {
  const [tags, setTags] = useState<any[]>([])

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    const headers = await getAuthHeader()
    const res = await fetch(`${BACKEND}/api/tags`, { headers })
    const data = await res.json()
    setTags(data)
  }

  async function createTag(name: string) {
    const headers = await getAuthHeader()
    const res = await fetch(`${BACKEND}/api/tags`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) fetchTags() // refresh the list
  }

  async function deleteTag(tagId: string) {
    const headers = await getAuthHeader()
    await fetch(`${BACKEND}/api/tags/${tagId}`, {
      method: 'DELETE',
      headers,
    })
    fetchTags()
  }

  async function attachTag(tagId: string, linkId: string) {
    const headers = await getAuthHeader()
    await fetch(`${BACKEND}/api/tags/${tagId}/links/${linkId}`, {
      method: 'POST',
      headers,
    })
  }

  async function removeTag(tagId: string, linkId: string) {
    const headers = await getAuthHeader()
    await fetch(`${BACKEND}/api/tags/${tagId}/links/${linkId}`, {
      method: 'DELETE',
      headers,
    })
  }

  return { tags, createTag, deleteTag, attachTag, removeTag }
}