'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import TagManager from '@/components/TagManager'


type Folder = {
  id: string
  name: string
  created_at: string
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [supabase])

  const fetchFolders = useCallback(async () => {
    const token = await getToken()
    const res = await fetch(`${BACKEND}/api/folders`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setFolders(data)
  }, [BACKEND, getToken])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
      await fetchFolders()
    }
    init()
  }, [fetchFolders, supabase])

  async function handleCreate() {
    if (!newFolderName.trim()) return
    setLoading(true)
    const token = await getToken()
    await fetch(`${BACKEND}/api/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newFolderName.trim() })
    })
    setNewFolderName('')
    await fetchFolders()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const token = await getToken()
    await fetch(`${BACKEND}/api/folders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchFolders()
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return
    const token = await getToken()
    await fetch(`${BACKEND}/api/folders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: renameValue.trim() })
    })
    setRenamingId(null)
    setRenameValue('')
    await fetchFolders()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }


  return (
    <div style={{ padding: '40px', maxWidth: '600px' }}>
      <h1>Dashboard</h1>
      <p>Logged in as: {email}</p>
      <button onClick={handleLogout}>Log out</button>

      {/* Search — add this */}
      <div style={{ margin: '24px 0' }}>
        <SearchBar />
      </div>
      <div style={{ margin: '24px 0' }}>
        <TagManager />
      </div>
      <hr style={{ margin: '24px 0' }} />
      <hr style={{ margin: '24px 0' }} />
      {/* Create Folder */}
      <h2>Folders</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          style={{ padding: '8px', flex: 1 }}
        />
        <button onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Folder'}
        </button>
      </div>

      {/* Folder List */}
      {folders.length === 0 && <p>No folders yet. Create one above.</p>}
      {folders.map(folder => (
        <div key={folder.id} style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {renamingId === folder.id ? (
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename(folder.id)}
                style={{ padding: '4px', flex: 1 }}
              />
              <button onClick={() => handleRename(folder.id)}>Save</button>
              <button onClick={() => setRenamingId(null)}>Cancel</button>
            </div>
          ) : (
            <>
              <Link href={`/dashboard/folder/${folder.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                {folder.name}
              </Link>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  setRenamingId(folder.id)
                  setRenameValue(folder.name)
                }}>Rename</button>
                <button onClick={() => handleDelete(folder.id)}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}