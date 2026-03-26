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

  if (!post) {
    return NextResponse.redirect("https://cekpromo.store")
  }

  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const ua = req.headers.get("user-agent") || ""
  const referer = req.headers.get("referer") || "direct"
  const device = /mobile/i.test(ua) ? "mobile" : "desktop"

  // Bot filter — redirect tanpa tracking
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

  // Anti-spam: 5-min cooldown per IP
  const lastClick = await prisma.click.findFirst({
    where: {
      postId: post.id,
      ip,
      createdAt: { gt: new Date(Date.now() - 1000 * 60 * 5) },
    },
  })

  // Phase 4: Rate limit (Anti-bot)
  const ipClicks = await prisma.click.count({
    where: {
      ip,
      createdAt: {
        gt: new Date(Date.now() - 10000)
      }
    }
  })

  if (ipClicks > 5) {
    return NextResponse.redirect("https://cekpromo.store")
  }

  // Phase 5: Random human delay
  await new Promise(r => setTimeout(r, 50 + Math.random() * 150))

  await prisma.click.create({
    data: {
      postId: post.id,
      ip,
      userAgent: ua || null,
      referer,
      device,
    },
  })

  await prisma.post.update({
    where: { id: post.id },
    data: {
      clickCount: { increment: 1 },
      uniqueClicks: lastClick ? undefined : { increment: 1 },
      lastClickedAt: new Date(),
    },
  })

  let redirectUrl = post.originalUrl
  if (post.isWinner) {
    redirectUrl = post.originalUrl
  } else if (post.isLoser) {
    redirectUrl = "https://backup-affiliate-link.com"
  }

  // Phase 3: Auto link variation (Anti-detection)
  const randomParam = Math.random().toString(36).substring(2, 8)
  redirectUrl += (redirectUrl.includes("?") ? "&" : "?") + "ref=" + randomParam

  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
