import Image from "next/image";
import { SiteHeader } from "../../../components/SiteHeader";
import { fetchPoemBySlug } from "../../../lib/adapters/poems-adapter";
import { formatRuDate } from "../../../lib/format/ru-date";
import type { PoemContentData } from "../../../lib/poems/types";

export default async function PoemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const poem = await fetchPoemBySlug(slug);
  if (!poem) return null;
  const poemData = poem.data as PoemContentData;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <article className="paper p-8 mx-auto flex flex-col relative" style={{ width: "clamp(48ch, 70vw, 80ch)", minHeight: "calc(1.4142 * clamp(48ch, 70vw, 80ch))" }}>
          {poemData.sticky && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <Image src="/images/thumbtack.png" alt="Sticky" width={44} height={44} />
            </div>
          )}
          {poem.title && (
            <h1 className="heading text-4xl md:text-5xl font-bold mb-4">{poem.title}</h1>
          )}
          <div className="prose max-w-none typewriter" dangerouslySetInnerHTML={{ __html: poem.content || "" }} />
          <div className="mt-auto space-y-2 pt-4">
            {/* tags bottom placeholder if available later */}
            <div className="text-sm poem-date">
              {poemData.writtenAtText && <span>Написано: {poemData.writtenAtText} · </span>}
              {poem.date && <span>Опубликовано: {formatRuDate(poem.date)}</span>}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}


