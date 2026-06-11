import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiFetch'

export function useTags() {
  const [tags, setTags] = useState<any[]>([])

  const fetchTags = useCallback(async () => {
    const res = await apiFetch('/api/tags')
    const data = await res.json()
    setTags(data)
  }, []) // empty array = only created once, never recreated

  useEffect(() => {
    fetchTags()
  }, [fetchTags]) // now stable, won't loop

  async function createTag(name: string) {
    const res= await apiFetch('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error)
    }
    fetchTags()
  }

  async function deleteTag(tagId: string) {
    await apiFetch(`/api/tags/${tagId}`, { method: 'DELETE' })
    fetchTags()
  }

  async function attachTag(tagId: string, linkId: string) {
    await apiFetch(`/api/tags/${tagId}/links/${linkId}`, { method: 'POST' })
  }

  async function removeTag(tagId: string, linkId: string) {
    await apiFetch(`/api/tags/${tagId}/links/${linkId}`, { method: 'DELETE' })
  }

  return { tags, createTag, deleteTag, attachTag, removeTag }
}