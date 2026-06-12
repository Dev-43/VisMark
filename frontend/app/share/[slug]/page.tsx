type Link = {
  id: string
  url: string
  title: string | null
  description: string | null
  screenshot_url: string | null
  favicon_url: string | null
}

type Folder = {
  id: string
  name: string
}

async function getPublicFolder(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/${slug}`,
    { cache: 'no-store' }  // always fetch fresh — don't cache stale data
  )
  if (!res.ok) return null
  return res.json() as Promise<{ folder: Folder; links: Link[] }>
}

export default async function PublicFolderPage({
  params,
}: {
  params: { slug: string }
}) {
  const result = await getPublicFolder(params.slug)

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>This folder is not available or has been made private.</p>
      </div>
    )
  }

  const { folder, links } = result

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Shared folder</p>
        <h1 className="text-2xl font-bold">{folder.name}</h1>
      </div>

      {links.length === 0 && (
        <p className="text-gray-400 text-sm">No links in this folder yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map(link => (
          <PublicLinkCard key={link.id} link={link} />
        ))}
      </div>
    </div>
  )
}

// ── Link Card (read-only, no TagPicker) ───────────────────────────

function PublicLinkCard({ link }: { link: Link }) {
  const domain = (() => {
    try { return new URL(link.url).hostname }
    catch { return link.url }
  })()

  if (link.screenshot_url) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="border rounded-lg hover:shadow-md transition-shadow block"
      >
        <img
          src={link.screenshot_url}
          alt={link.title || domain}
          className="w-full h-36 object-cover object-top rounded-t-lg"
        />
        <div className="p-3">
          <p className="text-sm font-medium truncate">{link.title || domain}</p>
          <p className="text-xs text-gray-400 truncate">{domain}</p>
        </div>
      </a>
    )
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="border rounded-lg hover:shadow-md transition-shadow block"
    >
      <div className="h-36 bg-gray-50 flex items-center justify-center rounded-t-lg">
        {link.favicon_url
          ? <img src={link.favicon_url} alt="" className="w-10 h-10" />
          : <span className="text-2xl font-bold text-gray-300">{domain[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">{link.title || domain}</p>
        <p className="text-xs text-gray-400 truncate">{domain}</p>
      </div>
    </a>
  )
}