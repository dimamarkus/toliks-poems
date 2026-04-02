import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { fetchPoemsPaged, searchPoems } from "../lib/adapters/poems-adapter";
import { Pagination } from "../components/Pagination";
import { NumericPagination } from "../components/NumericPagination";
import { OrderedColumns } from "../components/OrderedColumns";
import { PoemCard } from "../components/PoemCard";
import { formatRuDate } from "../lib/format/ru-date";
import { TopFilterSelects } from "../components/TopFilterSelects";
import { fetchAllTagOptions } from "../lib/adapters/poems-adapter";
import type { PoemContentData } from "../lib/poems/types";

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ page?: string; decade?: string; year?: string; month?: string; theme?: string; kind?: 'written' | 'published'; q?: string }> }) {
  const sp = (await (searchParams || Promise.resolve({}))) as { page?: string; decade?: string; year?: string; month?: string; theme?: string; kind?: 'written' | 'published'; q?: string };
  const page = sp.page ? Number(sp.page) : 1;
  const limit = 20;
  const query = (sp.q || "").trim();
  const searching = query.length > 0;

  const data = searching
    ? { items: await searchPoems({ q: query, limit: 60, kind: 'published' }), hasNext: false, totalPages: undefined as number | undefined }
    : await fetchPoemsPaged({ page, limit, year: sp.year ? Number(sp.year) : undefined, month: sp.month ? Number(sp.month) : undefined, decade: sp.decade ? Number(sp.decade) : undefined, tag: sp.theme, kind: 'published' });
  const poems = data.items;
  const hasNext = data.hasNext ?? false;
  const totalPages = data.totalPages;
  const tagOptions = await fetchAllTagOptions();
  const decodedTheme = sp.theme ? (() => { try { return decodeURIComponent(sp.theme as string); } catch { return sp.theme; } })() : undefined;
  const themeName = decodedTheme ? (tagOptions.find(t => t.slug === decodedTheme)?.name || decodedTheme) : undefined;

  const rusMonths = ["", "январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"] as const;
  const title = (() => {
    if (searching) return `Поиск: ${query}`;
    const y = sp.year ? Number(sp.year) : undefined;
    const m = sp.month ? Number(sp.month) : undefined;
    const d = sp.decade ? Number(sp.decade) : undefined;
    if (y && m) return `Стихи за ${rusMonths[m]} ${y}`;
    if (y) return `Стихи за ${y}`;
    if (d) return `Стихи ${d}-е`;
    return "Стихи";
  })();

  const renderPoemEntry = (p: (typeof poems)[number]) => {
    const poemData = p.data as PoemContentData;
    const written = poemData.writtenAtText ?? undefined;
    const published = formatRuDate(p.date || undefined);
    const dateLabel = [
      written ? `Написано: ${written}` : null,
      published ? `Опубликовано: ${published}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const hasImage = Boolean(poemData.hasImage);
    const hasEmbed = Boolean(poemData.hasEmbed);

    return (
      <article className="min-w-0" key={p.id}>
        <PoemCard
          title={p.title}
          slug={p.slug || ""}
          date={dateLabel}
          themes={poemData.themes}
          themeSlugs={poemData.themeSlugs}
          contentHtml={p.content || undefined}
          highlightQuery={searching ? query : undefined}
        />
        {(hasImage || hasEmbed) && (
          <p className="mt-2 text-[11px] opacity-60">
            {hasImage ? "Contains images" : ""}
            {hasImage && hasEmbed ? " · " : ""}
            {hasEmbed ? "Contains embeds" : ""}
          </p>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="sticky-filters">
        <div className="container mx-auto px-4 py-2 md:py-1">
          <TopFilterSelects basePath="/" decade={sp.decade ? Number(sp.decade) : undefined} year={sp.year ? Number(sp.year) : undefined} month={sp.month ? Number(sp.month) : undefined} kind={sp.kind} query={query} theme={sp.theme} themeOptions={tagOptions} />
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <h1 className="text-4xl md:text-5xl font-bold heading">{title}{themeName && <span className="ml-4 text-2xl align-baseline">#{themeName}</span>}</h1>
        </div>
        {poems.length === 0 ? (
          <div className="mx-auto max-w-xl text-center py-20 opacity-90">
            <div className="paper p-8">
              <h2 className="heading text-3xl mb-2">Ничего не найдено</h2>
              <p className="mb-4">Нет стихов по выбранным фильтрам.</p>
              <Link href="/" className="ink-link">Сбросить фильтры</Link>
            </div>
          </div>
        ) : (
          <OrderedColumns>{poems.map(renderPoemEntry)}</OrderedColumns>
        )}
        {/* Prefer full UI if totalPages known; else show simple prev/next; hide when searching */}
        {!searching && poems.length > 0 && (totalPages ? (
          <NumericPagination page={page} totalPages={totalPages} makeHref={(p) => `/?${new URLSearchParams({ page: String(p) }).toString()}`} />
        ) : (
          <Pagination
            page={page}
            limit={limit}
            hasNext={hasNext}
            makeHref={(p) => `/?${new URLSearchParams({ page: String(p) }).toString()}`}
          />
        ))}
      </main>
    </div>
  );
}


