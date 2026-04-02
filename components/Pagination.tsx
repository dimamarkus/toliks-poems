import Link from "next/link";
import { calculatePagination } from "../lib/pagination/calculate-pagination";

export function Pagination({ page, limit, hasNext, makeHref }: { page: number; limit: number; hasNext: boolean; makeHref: (page: number) => string; }) {
  const { pagination } = calculatePagination({ page, limit });
  const canPrev = pagination.hasPreviousPage;
  const canNext = hasNext; // we don't always know totals from WP; rely on detection
  return (
    <nav aria-label="Навигация страниц" className="mt-8 flex items-center justify-center gap-4 text-sm">
      <span className="opacity-60">Стр. {page}</span>
      <div className="flex items-center gap-3">
        {canPrev ? (
          <Link className="ink-link" href={makeHref(page - 1)}>Назад</Link>
        ) : (
          <span className="opacity-40">Назад</span>
        )}
        {canNext ? (
          <Link className="ink-link" href={makeHref(page + 1)}>Вперёд</Link>
        ) : (
          <span className="opacity-40">Вперёд</span>
        )}
      </div>
    </nav>
  );
}


