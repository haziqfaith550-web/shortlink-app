import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { clickCount: "desc" },
    include: {
      _count: { select: { clicks: true } },
    },
  })

  const totalClicks = posts.reduce((sum, p) => sum + p.clickCount, 0)
  const totalUnique = posts.reduce((sum, p) => sum + p.uniqueClicks, 0)
  const totalRevenue = posts.reduce((sum, p) => sum + p.revenue, 0)

  // Device breakdown dari semua clicks
  const deviceStats = await prisma.click.groupBy({
    by: ["device"],
    _count: { id: true },
  })

  // Top referers
  const refererStats = await prisma.click.groupBy({
    by: ["referer"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  })

  return NextResponse.json({
    summary: {
      totalLinks: posts.length,
      totalClicks,
      totalUnique,
      totalRevenue,
    },
    devices: deviceStats,
    topReferers: refererStats,
    links: posts,
  })
}
