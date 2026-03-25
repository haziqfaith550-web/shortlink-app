import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

function generateCode(length = 6): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

export async function GET() {
  const url = "https://shopee.co.id" // ganti nanti

  const code = generateCode()

  const post = await prisma.post.create({
    data: {
      originalUrl: url,
      shortCode: code,
    },
  })

  return NextResponse.json({
    shortlink: `/r/${post.shortCode}`,
    full: `https://YOUR_DOMAIN/r/${post.shortCode}`,
  })
}
