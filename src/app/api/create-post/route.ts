import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function generateCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// Phase 5 — Monetization: A/B link rotation
const AFFILIATE_URLS = [
  "https://shopee.co.id",
  "https://tokopedia.com",
  "https://lazada.co.id",
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customUrl = searchParams.get("url")

  const url = customUrl || AFFILIATE_URLS[Math.floor(Math.random() * AFFILIATE_URLS.length)]
  const code = generateCode()

  const post = await prisma.post.create({
    data: {
      originalUrl: url,
      shortCode: code,
    },
  })

  return NextResponse.json({
    shortlink: `/r/${post.shortCode}`,
    full: `https://cekpromo.store/r/${post.shortCode}`,
    target: post.originalUrl,
  })
}
