export function NumericPagination({ page, totalPages, makeHref }: { page: number; totalPages: number; makeHref: (p: number) => string }) {
  if (!totalPages || totalPages <= 1) return null;
  const clampedPage = Math.max(1, Math.min(page, totalPages));
  const maxVisible = 7;
  let start = Math.max(1, clampedPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Навигация страниц" className="mt-8 flex items-center justify-center gap-4 text-sm">
      {clampedPage > 1 ? (
        <a className="ink-link" href={makeHref(clampedPage - 1)}>Назад</a>
      ) : (
        <span className="opacity-40">Назад</span>
      )}
      <ul className="flex items-center gap-2">
        {start > 1 && (
          <li>
            <a className="ink-link" href={makeHref(1)} aria-current={clampedPage === 1 ? 'page' : undefined}>1</a>
          </li>
        )}
        {start > 2 && <li className="opacity-50">…</li>}
        {pages.map((n) => (
          <li key={n}>
            {n === clampedPage ? (
              <span className="font-semibold" aria-current="page">{n}</span>
            ) : (
              <a className="ink-link" href={makeHref(n)}>{n}</a>
            )}
          </li>
        ))}
        {end < totalPages - 1 && <li className="opacity-50">…</li>}
        {end < totalPages && (
          <li>
            <a className="ink-link" href={makeHref(totalPages)} aria-current={clampedPage === totalPages ? 'page' : undefined}>{totalPages}</a>
          </li>
        )}
      </ul>
      {clampedPage < totalPages ? (
        <a className="ink-link" href={makeHref(clampedPage + 1)}>Вперёд</a>
      ) : (
        <span className="opacity-40">Вперёд</span>
      )}
    </nav>
  );
}


