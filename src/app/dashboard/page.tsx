import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function Dashboard() {
  const posts = await prisma.post.findMany({
    orderBy: { clickCount: "desc" },
  })

  const totalClicks = posts.reduce((s: number, p: any) => s + p.clickCount, 0)
  const totalUnique = posts.reduce((s: number, p: any) => s + p.uniqueClicks, 0)
  const totalRevenue = posts.reduce((s: number, p: any) => s + p.revenue, 0)

  const deviceStats = await prisma.click.groupBy({
    by: ["device"],
    _count: { id: true },
  })

  const topReferers = await prisma.click.groupBy({
    by: ["referer"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  })

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>📊 Analytics Dashboard</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Real-time shortlink performance</p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Card label="Total Links" value={posts.length} />
        <Card label="Total Clicks" value={totalClicks} />
        <Card label="Unique Clicks" value={totalUnique} />
        <Card label="Revenue" value={`Rp ${totalRevenue.toLocaleString("id-ID")}`} />
      </div>

      {/* Device Stats */}
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>📱 Device Breakdown</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        {deviceStats.map((d) => (
          <div key={d.device || "unknown"} style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 20px" }}>
            <b>{d.device || "unknown"}</b>: {d._count.id} clicks
          </div>
        ))}
      </div>

      {/* Top Referers */}
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>🔗 Top Referers</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Source</th>
            <th style={{ padding: 8 }}>Clicks</th>
          </tr>
        </thead>
        <tbody>
          {topReferers.map((r) => (
            <tr key={r.referer || "direct"} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{r.referer || "direct"}</td>
              <td style={{ padding: 8 }}>{r._count.id}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Links Table */}
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>🔗 All Links</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Short Code</th>
            <th style={{ padding: 8 }}>Target</th>
            <th style={{ padding: 8 }}>Clicks</th>
            <th style={{ padding: 8 }}>Unique</th>
            <th style={{ padding: 8 }}>Revenue</th>
            <th style={{ padding: 8 }}>Last Click</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <a href={`/r/${p.shortCode}`} target="_blank" style={{ color: "#0070f3" }}>
                  /r/{p.shortCode}
                </a>
              </td>
              <td style={{ padding: 8, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.originalUrl}
              </td>
              <td style={{ padding: 8 }}>{p.clickCount}</td>
              <td style={{ padding: 8 }}>{p.uniqueClicks}</td>
              <td style={{ padding: 8 }}>Rp {p.revenue.toLocaleString("id-ID")}</td>
              <td style={{ padding: 8, fontSize: 12, color: "#999" }}>
                {p.lastClickedAt ? new Date(p.lastClickedAt).toLocaleString("id-ID") : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
