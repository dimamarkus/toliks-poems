import { WordPressClient } from "../wordpress/client";
import type { GenericContent } from "../wordpress/types";
import { siteConfig } from "../config/site-config";
import { POEMS_DUMMY } from "../dummy/poems";
import type { PoemContentData, WordPressRawPost } from "../poems/types";

function hasLiveWp(): boolean {
  return Boolean(process.env.WP_BASE_URL && process.env.WP_USERNAME && process.env.WP_APP_PASSWORD);
}

export async function fetchPoems(params?: { tag?: string; year?: number; kind?: 'written' | 'published' }): Promise<GenericContent[]> {
  if (!hasLiveWp()) {
    const filtered = POEMS_DUMMY.filter((p) => {
      const tagParam = params?.tag ? (() => { try { return decodeURIComponent(params.tag as string); } catch { return String(params?.tag); } })() : undefined;
      const okTag = tagParam
        ? (p.themes.some((t) => slugifyTag(t) === tagParam || t === tagParam))
        : true;
      const basis = (params?.kind ?? 'written') === 'written' ? p.date : p.date; // dummy uses same
      const okYear = params?.year ? basis.startsWith(String(params.year)) : true;
      return okTag && okYear;
    });
    const mapped = filtered.map((p) => ({
      id: p.id,
      type: "post",
      title: p.title,
      content: p.contentHtml,
      excerpt: undefined,
      date: p.date,
      slug: p.slug,
      data: {
        themes: p.themes,
        themeSlugs: p.themes.map((t) => slugifyTag(t)),
        publishedAt: p.date,
        writtenAtText: p.date,
        writtenYear: Number(p.date.slice(0,4)),
        sticky: p.pinned === true,
        hasImage: /<img\s/i.test(p.contentHtml) || /wp-block-image|wp-block-gallery/i.test(p.contentHtml),
        hasEmbed: /wp-block-embed|<iframe|youtu\.be|youtube\.com|vimeo\.com/i.test(p.contentHtml),
      },
    }));
    return mapped.sort(sortPoems);
  }

  const adapter = new WordPressClient(siteConfig);
  const filters: Record<string, string> = {};
  if (params?.tag) filters["tags"] = params.tag;
  if ((params?.kind ?? 'written') === 'published') {
    if (params?.year) filters["after"] = `${params.year}-01-01T00:00:00`;
  }
  // WordPress: order by date desc; pinned (sticky) first
  filters["orderby"] = "date";
  filters["order"] = "desc";
  const list = await adapter.fetchContent("post", 100, filters);
  return list
    .map(enrichPoem)
    .sort(sortPoems)
    .filter((item) => {
      if (!params?.year) return true;
      const kind = params.kind ?? 'written';
      if (kind === 'written') return getPoemData(item).writtenYear === params.year;
      return item.date?.startsWith(String(params.year));
    });
}

export async function fetchPoemsPaged(params?: { tag?: string; year?: number; month?: number; decade?: number; kind?: 'written' | 'published'; page?: number; limit?: number }): Promise<{ items: GenericContent[]; hasNext: boolean; page: number; limit: number; totalPages?: number; }> {
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(params?.limit) || 20));

  console.log('[poemsPaged] input', { requestedPage: page, limit, tag: params?.tag, year: params?.year, kind: params?.kind });

  if (!hasLiveWp()) {
    const all = await fetchPoems({ tag: params?.tag, year: params?.year, kind: params?.kind });
    const start = (page - 1) * limit;
    const slice = all.slice(start, start + limit);
    const totalPages = Math.ceil(all.length / limit) || 1;
    const hasNext = page < totalPages;
    return { items: slice, hasNext, page, limit, totalPages };
  }

  // For WP, request with safe page; first determine total pages using headers
  const adapter = new WordPressClient(siteConfig);
  const baseFilters: Record<string, string> = {};
  if (params?.tag) {
    let t = String(params.tag);
    try { t = decodeURIComponent(t); } catch { /* ignore */ }
    if (/^\d+(,\d+)*$/.test(t)) baseFilters["tags"] = t; // numeric tag ids
    else {
      const tagId = await resolveWpTagIdFromSlug(t).catch(() => undefined);
      if (tagId) baseFilters["tags"] = String(tagId);
    }
  }
  if ((params?.kind ?? 'written') === 'published') {
    // Build date range for published date
    if (params?.decade) {
      const start = `${params.decade}-01-01T00:00:00`;
      const end = `${params.decade + 9}-12-31T23:59:59`;
      baseFilters["after"] = start;
      baseFilters["before"] = end;
    }
    if (params?.year) {
      baseFilters["after"] = `${params.year}-01-01T00:00:00`;
      baseFilters["before"] = `${params.year}-12-31T23:59:59`;
    }
    if (params?.year && params?.month) {
      const y = params.year;
      const m = params.month.toString().padStart(2, '0');
      const nextMonth = params.month === 12 ? 1 : params.month + 1;
      const nextYear = params.month === 12 ? y + 1 : y;
      const nm = nextMonth.toString().padStart(2, '0');
      baseFilters["after"] = `${y}-${m}-01T00:00:00`;
      baseFilters["before"] = `${nextYear}-${nm}-01T00:00:00`;
    }
  }
  baseFilters["orderby"] = "date";
  baseFilters["order"] = "desc";
  const hintedTotalPages = await fetchWpTotalPages(baseFilters, limit).catch(() => undefined);
  console.log('[poemsPaged] hinted totals', { hintedTotalPages });
  const safePage = hintedTotalPages ? Math.max(1, Math.min(page, hintedTotalPages)) : page;
  console.log('[poemsPaged] safePage', { safePage });
  const filters: Record<string, string> = { ...baseFilters, page: String(safePage) };
  let list: GenericContent[] = [];
  let totalPages: number | undefined = undefined;
  const hasExplicitFilter = Boolean(params?.tag || params?.year || params?.month || params?.decade);
  if (!hasExplicitFilter && safePage === 1) {
    // Guarantee sticky-first for first page (no filters): fetch stickies and then non-stickies
    const stickyFilters: Record<string, string> = { ...baseFilters, sticky: 'true', page: '1' };
    const stickies = await adapter.fetchContent("post", limit, stickyFilters);
    if (stickies.length >= limit) {
      list = stickies.slice(0, limit);
    } else {
      const remainder = limit - stickies.length;
      const nonStickyFilters: Record<string, string> = { ...baseFilters, sticky: 'false', page: '1' };
      const nonStickies = await adapter.fetchContent("post", remainder, nonStickyFilters);
      list = [...stickies, ...nonStickies];
    }
    totalPages = hintedTotalPages;
  } else {
    const res = await adapter.fetchContentWithMeta("post", limit, filters);
    list = res.items;
    totalPages = res.totalPages;
  }
  console.log('[poemsPaged] fetched', { page: safePage, listLength: list.length, totalPagesFromMeta: totalPages });
  // Prefer header-derived totals for consistency
  if (typeof hintedTotalPages === 'number' && hintedTotalPages > 0) {
    totalPages = hintedTotalPages;
  }
  const hasNext = totalPages ? safePage < totalPages : list.length === limit; // fallback heuristic
  let items = list
    .map((item) => {
      const enrichedItem = enrichPoem(item);
      const poemData = getPoemData(enrichedItem);
      const html = enrichedItem.content || "";

      if (poemData.sticky) {
        enrichedItem.content = `<div data-sticky=\"true\"></div>` + html;
      }
      return enrichedItem;
    });
  // If no explicit tag/year/month filter is applied, ensure sticky appear first within page
  if (!hasExplicitFilter) {
    // If any sticky exists on the page, reorder page results to show sticky first
    const anySticky = items.some((item) => getPoemData(item).sticky === true);
    if (anySticky) {
      items = items.sort(sortPoems);
    }
  }
  if (totalPages === undefined) {
    const t = await fetchWpTotalPages(baseFilters, limit).catch(() => undefined);
    if (typeof t === 'number' && t > 0) totalPages = t;
  }
  // Guard: if last page is empty due to WP sticky/offset quirks, reduce by one
  if ((items.length === 0) && typeof hintedTotalPages === 'number' && safePage === hintedTotalPages && hintedTotalPages > 1) {
    totalPages = hintedTotalPages - 1;
  }
  // If totals indicate a smaller last page than we fetched, refetch the last valid page
  if (typeof totalPages === 'number' && safePage > totalPages) {
    console.log('[poemsPaged] refetching last valid page', { totalPages, attempted: safePage });
    const finalPage = totalPages;
    const refetchFilters: Record<string, string> = { ...baseFilters, page: String(finalPage) };
    let refetched: GenericContent[] = [];
    const res2 = await adapter.fetchContentWithMeta("post", limit, refetchFilters);
    refetched = res2.items;
    const mapped = refetched.map(enrichPoem);
    const result = { items: mapped, hasNext: finalPage < (totalPages || finalPage), page: finalPage, limit, totalPages } as const;
    console.log('[poemsPaged] result (refetched)', { page: result.page, items: result.items.length, totalPages: result.totalPages, hasNext: result.hasNext });
    return result;
  }
  const result = { items, hasNext: totalPages ? safePage < totalPages : hasNext, page: safePage, limit, totalPages } as const;
  console.log('[poemsPaged] result', { page: result.page, items: result.items.length, totalPages: result.totalPages, hasNext: result.hasNext });
  return result;
}

export async function fetchAllTagOptions(): Promise<{ name: string; slug: string }[]> {
  if (!hasLiveWp()) {
    // Aggregate from dummy data
    const set = new Map<string, string>();
    for (const p of POEMS_DUMMY) {
      for (const t of p.themes) {
        const slug = slugifyTag(t);
        if (!set.has(slug)) set.set(slug, t);
      }
    }
    return Array.from(set.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }
  try {
    const base = siteConfig.baseUrl;
    const url = new URL(`${base}/wp-json/wp/v2/tags`);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('orderby', 'name');
    url.searchParams.set('order', 'asc');
    const res = await fetch(url.toString(), { headers: siteConfig.api.headers || {} });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((tag) => {
        const tagRecord =
          typeof tag === "object" && tag !== null ? (tag as Record<string, unknown>) : {};
        const name = String(tagRecord.name || '');
        const raw = String(tagRecord.slug || '');
        let slug = raw;
        try { slug = decodeURIComponent(raw); } catch { /* ignore */ }
        return { name, slug };
      })
      .filter((tag) => Boolean(tag.slug));
  } catch {
    return [];
  }
}

async function resolveWpTagIdFromSlug(slug: string): Promise<number | undefined> {
  try {
    const base = siteConfig.baseUrl;
    const url = new URL(`${base}/wp-json/wp/v2/tags`);
    url.searchParams.set('slug', slug);
    url.searchParams.set('per_page', '1');
    const res = await fetch(url.toString(), { headers: siteConfig.api.headers || {} });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.id) return Number(data[0].id);
    return undefined;
  } catch {
    return undefined;
  }
}
async function fetchWpTotalPages(filters: Record<string, string>, perPage: number): Promise<number | undefined> {
  try {
    const postsEndpoint = siteConfig.api.endpoints?.posts || siteConfig.api.endpoints?.post || "/wp-json/wp/v2/posts";
    const url = new URL(`${siteConfig.baseUrl}${postsEndpoint}`);
    // Request minimal payload; we'll compute pages from total
    url.searchParams.set("per_page", "1");
    // Copy filters except the current page to avoid 400s on out-of-range pages
    Object.entries(filters).forEach(([k, v]) => {
      if (k === 'page') return;
      url.searchParams.set(k, String(v));
    });
    const headers = siteConfig.api.headers || {};
    let res = await fetch(url.toString(), { method: 'HEAD', headers });
    if (!res.ok || !res.headers.get('X-WP-TotalPages')) {
      res = await fetch(url.toString(), { method: 'GET', headers });
      if (!res.ok) return undefined;
    }
    const headerTotal = res.headers.get('X-WP-Total');
    const nTotal = headerTotal ? Number(headerTotal) : undefined;
    const pagesFromTotal = (typeof nTotal === 'number' && !isNaN(nTotal) && nTotal > 0)
      ? Math.ceil(nTotal / Math.max(1, perPage))
      : undefined;
    const headerPages = res.headers.get('X-WP-TotalPages');
    const nPagesHeader = headerPages ? Number(headerPages) : undefined;
    console.log('[wpTotals]', { url: url.toString(), perPage, nTotal, pagesFromTotal, nPagesHeader });
    if (pagesFromTotal && nPagesHeader) return Math.min(pagesFromTotal, nPagesHeader);
    return pagesFromTotal ?? nPagesHeader ?? undefined;
  } catch {
    return undefined;
  }
}

export async function fetchPoemBySlug(slug: string): Promise<GenericContent | null> {
  if (!hasLiveWp()) {
    const p = POEMS_DUMMY.find((x) => x.slug === slug);
    if (!p) return null;
    return {
      id: p.id,
      type: "post",
      title: p.title,
      content: p.contentHtml,
      date: p.date,
      slug: p.slug,
      data: { themes: p.themes },
    };
  }
  const adapter = new WordPressClient(siteConfig);
  const list = await adapter.fetchContent("post", 1, { slug });
  const item = list[0] ?? null;
  if (item) {
    return enrichPoem(item);
  }
  return item;
}

export async function searchPoems(params: { q: string; limit?: number; kind?: 'written' | 'published' }): Promise<GenericContent[]> {
  const qRaw = params.q || "";
  const q = qRaw.trim();
  const limit = Math.max(1, Math.min(50, Number(params?.limit) || 20));
  const kind = params.kind || 'published';

  if (!q) return [];

  if (!hasLiveWp()) {
    const needle = q.toLowerCase();
    const byMatch = POEMS_DUMMY.filter((p) => {
      const inTitle = (p.title || '').toLowerCase().includes(needle);
      const inHtml = (p.contentHtml || '').toLowerCase().includes(needle);
      const inTags = p.themes.some((t) => t.toLowerCase().includes(needle) || slugifyTag(t).includes(needle));
      return inTitle || inHtml || inTags;
    })
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        type: 'post',
        title: p.title,
        content: p.contentHtml,
        date: p.date,
        slug: p.slug,
        data: {
          themes: p.themes,
          themeSlugs: p.themes.map((t) => slugifyTag(t)),
          publishedAt: p.date,
          writtenAtText: p.date,
          writtenYear: Number(p.date.slice(0, 4)),
        },
      }));
    return byMatch;
  }

  const adapter = new WordPressClient(siteConfig);
  const postsEndpoint = siteConfig.api.endpoints?.posts || siteConfig.api.endpoints?.post || "/wp-json/wp/v2/posts";
  const base = siteConfig.baseUrl;

  // Search by text
  const u1 = new URL(`${base}${postsEndpoint}`);
  u1.searchParams.set('search', q);
  u1.searchParams.set('per_page', String(limit));
  if (kind === 'published') {
    u1.searchParams.set('orderby', 'date');
    u1.searchParams.set('order', 'desc');
  }
  let textItems: GenericContent[] = [];
  try {
    textItems = await adapter.fetchContent('post', limit, Object.fromEntries(u1.searchParams.entries()));
  } catch {
    textItems = [];
  }

  // Search by tag slug/name
  let tagItems: GenericContent[] = [];
  try {
    const tagSlug = slugifyTag(q);
    const tagId = await resolveWpTagIdFromSlug(tagSlug).catch(() => undefined);
    if (tagId) {
      const filters: Record<string, string> = { tags: String(tagId), per_page: String(limit) };
      if (kind === 'published') {
        filters.orderby = 'date';
        filters.order = 'desc';
      }
      tagItems = await adapter.fetchContent('post', limit, filters);
    }
  } catch {
    tagItems = [];
  }

  // Merge by slug to avoid duplicates
  const seen = new Set<string>();
  const merged: GenericContent[] = [];
  for (const it of [...textItems, ...tagItems]) {
    const s = it.slug || it.id || '';
    if (!s || seen.has(s)) continue;
    seen.add(s);
    merged.push(it);
    if (merged.length >= limit) break;
  }
  return merged;
}

function getPoemData(item: GenericContent): PoemContentData {
  return item.data as PoemContentData;
}

function getRawPost(item: GenericContent): WordPressRawPost {
  if (!item._raw || typeof item._raw !== "object") {
    return {};
  }

  return item._raw as WordPressRawPost;
}

function enrichPoem(item: GenericContent): GenericContent {
  const data = getPoemData(item);
  const raw = getRawPost(item);
  const writtenAtText =
    typeof data.dateWritten === "string" ? data.dateWritten : null;

  data.publishedAt = item.date;
  data.writtenAtText = writtenAtText;
  data.writtenYear =
    writtenAtText && /^\d{4}/.test(writtenAtText)
      ? Number(writtenAtText.slice(0, 4))
      : item.date
        ? Number(item.date.slice(0, 4))
        : undefined;
  data.sticky = raw.sticky === true;

  const themes = extractThemesFromRaw(raw);
  if (themes?.names.length) data.themes = themes.names;
  if (themes?.slugs.length) data.themeSlugs = themes.slugs;

  const html = item.content || "";
  data.hasImage =
    /<img\s/i.test(html) || /wp-block-image|wp-block-gallery/i.test(html);
  data.hasEmbed =
    /wp-block-embed|<iframe|youtu\.be|youtube\.com|vimeo\.com/i.test(html);

  return item;
}

function sortPoems(a: GenericContent, b: GenericContent) {
  const stickyDelta =
    Number(getPoemData(b).sticky === true) - Number(getPoemData(a).sticky === true);

  if (stickyDelta !== 0) {
    return stickyDelta;
  }

  return (b.date || "").localeCompare(a.date || "");
}

function extractThemesFromRaw(raw: unknown): { names: string[]; slugs: string[] } | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const rawObj = raw as Record<string, unknown>;
  const embedded = rawObj['_embedded'];
  if (!embedded || typeof embedded !== 'object') return undefined;
  const terms = (embedded as Record<string, unknown>)["wp:term"];
  if (!Array.isArray(terms)) return undefined;
  const flat: unknown[] = [];
  for (const group of terms) {
    if (Array.isArray(group)) flat.push(...group);
  }
  const slugs: string[] = [];
  const names: string[] = [];
  for (const t of flat) {
    if (!t || typeof t !== 'object') continue;
    const obj = t as Record<string, unknown>;
    const taxonomy = obj['taxonomy'];
    if (taxonomy !== 'post_tag') continue;
    const slug = obj['slug'];
    if (typeof slug === 'string') slugs.push(slug);
    const name = obj['name'];
    if (typeof name === 'string') names.push(name);
  }
  if (!slugs.length && !names.length) return undefined;
  return { names, slugs };
}

function slugifyTag(name: string): string {
  return String(name).trim().toLowerCase().replace(/\s+/g, '-');
}


