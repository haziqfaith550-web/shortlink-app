import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const post = await prisma.post.findUnique({
    where: { shortCode: code },
  })

  if (!post) {
    return new Response("Link not found", { status: 404 })
  }

  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const userAgent = req.headers.get("user-agent") || "unknown"

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
      userAgent,
    },
  })

  await prisma.post.update({
    where: { id: post.id },
    data: {
      clickCount: { increment: 1 },
      uniqueClicks: lastClick ? undefined : { increment: 1 },
    },
  })

  return NextResponse.redirect(post.originalUrl)
}
