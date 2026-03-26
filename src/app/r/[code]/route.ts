import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const BOT_PATTERNS = ["bot", "crawler", "spider", "slurp", "mediapartners", "facebookexternalhit", "twitterbot"]

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const post = await prisma.post.findUnique({
    where: { shortCode: code },
  })

  // PHASE 7 — FAILSAFE: link mati → redirect ke landing
  if (!post) {
    return NextResponse.redirect("https://cekpromo.store")
  }

  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const ua = req.headers.get("user-agent") || ""

  // PHASE 6 — BOT FILTER: skip tracking for bots
  const isBot = BOT_PATTERNS.some((p) => ua.toLowerCase().includes(p))

  if (isBot) {
    return NextResponse.redirect(post.originalUrl, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  }

  // PHASE 4 — ANTI SPAM: 5-min cooldown per IP
  const lastClick = await prisma.click.findFirst({
    where: {
      postId: post.id,
      ip,
      createdAt: {
        gt: new Date(Date.now() - 1000 * 60 * 5),
      },
    },
  })

  await prisma.click.create({
    data: {
      postId: post.id,
      ip,
      userAgent: ua || null,
    },
  })

  await prisma.post.update({
    where: { id: post.id },
    data: {
      clickCount: { increment: 1 },
      uniqueClicks: lastClick ? undefined : { increment: 1 },
    },
  })

  // PHASE 1 — NO CACHE redirect
  return NextResponse.redirect(post.originalUrl, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
