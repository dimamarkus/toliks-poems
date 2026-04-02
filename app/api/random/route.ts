import { NextResponse } from "next/server";
import { fetchPoemsPaged } from "../../../lib/adapters/poems-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.SITE_URL || "http://localhost:3004";
  try {
    const first = await fetchPoemsPaged({ page: 1, limit: 1, kind: "published" });
    const totalPages = first.totalPages && first.totalPages > 0 ? first.totalPages : 1;

    const attempts = Math.min(5, Math.max(1, totalPages));
    for (let i = 0; i < attempts; i++) {
      const randomPage = Math.max(1, Math.floor(Math.random() * totalPages) + 1);
      const pick = await fetchPoemsPaged({ page: randomPage, limit: 1, kind: "published" });
      const poem = pick.items[0];
      if (poem?.slug) {
        return NextResponse.redirect(new URL(`/poems/${poem.slug}`, baseUrl));
      }
    }
  } catch {
    // ignore and continue to fallback attempts below
  }

  try {
    const fallback = await fetchPoemsPaged({ page: 1, limit: 1, kind: "published" });
    const poem = fallback.items[0];
    if (poem?.slug) {
      return NextResponse.redirect(new URL(`/poems/${poem.slug}`, baseUrl));
    }
  } catch {
    // ignore and fall through to final redirect
  }

  return NextResponse.redirect(new URL(`/`, baseUrl));
}


