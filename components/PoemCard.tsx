import Link from "next/link";
import Image from "next/image";
import { normalizePoemHtml, highlightInHtml, highlightPlainText } from "../lib/format/normalize-html";

interface PoemCardProps {
  title: string;
  slug: string;
  date?: string;
  contentHtml?: string;
  themes?: string[];
  themeSlugs?: string[];
  highlightQuery?: string;
}

export function PoemCard({ title, slug, date, contentHtml, themes, themeSlugs, highlightQuery }: PoemCardProps) {
  const showTitle = Boolean(title && title.trim().length > 0 && title.toLowerCase() !== 'без названия');

  return (
    <article className="paper poem-card p-6 bg-[var(--paper-bg)] flex flex-col min-h-0">
      <Link href={`/poems/${slug}`} className="poem-corner-link" aria-label="Открыть стих"></Link>
      {(contentHtml && /data-sticky=\"true\"/.test(contentHtml)) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Image src="/images/thumbtack.png" alt="Sticky" width={36} height={36} priority />
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-bold mb-3 poem-title heading">
        {showTitle ? (
          <Link href={`/poems/${slug}`} dangerouslySetInnerHTML={{ __html: highlightPlainText(title, highlightQuery || "") }} />
        ) : (
          <span aria-hidden="true">&nbsp;</span>
        )}
      </h2>
      {/* Remove placeholder; real images are shown in content if present */}
      {contentHtml && (
        <div className="prose max-w-none typewriter" dangerouslySetInnerHTML={{ __html: highlightInHtml(normalizePoemHtml(contentHtml), highlightQuery || "") }} />
      )}
      <div className="space-y-2 mt-auto pt-4">
        {themes && themes.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {themes.slice(0, 5).map((t, i) => (
              <Link
                key={`${t}-${i}`}
                href={`/?${new URLSearchParams({ theme: (themeSlugs && themeSlugs[i]) || encodeURIComponent(String(t).toLowerCase()) }).toString()}`}
                className="px-2 py-0.5 rounded bg-muted hover:underline ink-link"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
        {date && <p className="text-xs poem-date">{date}</p>}
      </div>
    </article>
  );
}


