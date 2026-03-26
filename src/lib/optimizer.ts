export function calculateScore(post: any) {
  const clicks = post.clickCount || 0
  const conversions = post.conversions || 0

  if (clicks === 0) return 0

  const ctr = post.uniqueClicks / clicks
  const cr = conversions / (clicks > 0 ? clicks : 1)

  return ctr * 0.6 + cr * 0.4
}
