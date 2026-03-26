import { prisma } from "@/lib/prisma"
import { calculateScore } from "@/lib/optimizer"
import { NextResponse } from "next/server"

function generateNewCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function GET() {
  const posts = await prisma.post.findMany()

  for (const p of posts) {
    const score = calculateScore(p)

    if (score > 0.05 && p.clickCount > 5) {
      if (!p.isWinner) {
        await prisma.post.update({
          where: { id: p.id },
          data: {
            isWinner: true,
            isLoser: false
          }
        })
      }

      // Phase 6: Smart Scaling Limit
      const todayCount = await prisma.post.count({
        where: {
          parentPostId: p.id,
          createdAt: {
            gt: new Date(Date.now() - 86400000)
          }
        }
      })

      if (todayCount < 3) {
        await prisma.post.create({
          data: {
            originalUrl: p.originalUrl,
            shortCode: generateNewCode(),
            isWinner: true,
            parentPostId: p.id
          }
        })
      }
    }

    if (score < 0.01 && p.clickCount > 5) {
      if (!p.isLoser) {
        await prisma.post.update({
          where: { id: p.id },
          data: {
            isLoser: true,
            isWinner: false
          }
        })
      }
    }
  }

  return NextResponse.json({ status: "optimizer done" })
}
