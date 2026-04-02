import { NextResponse } from "next/server";
import { searchPoems } from "../../../lib/adapters/poems-adapter";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || '20');
  const results = await searchPoems({ q, limit, kind: 'published' });
  return NextResponse.json({ items: results });
}


