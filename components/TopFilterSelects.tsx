"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "../lib/utils/cn";
import { SearchInput } from "./search-input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type Query = Record<string, string | number | undefined>;

function makeHref(basePath: string, query: Query) {
  const p = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function TopFilterSelects({
  basePath,
  decade,
  year,
  month,
  kind,
  query,
  theme,
  themeOptions,
}: {
  basePath: string;
  decade?: number;
  year?: number;
  month?: number; // 1-12
  kind?: "written" | "published";
  query?: string;
  theme?: string;
  themeOptions?: { name: string; slug: string }[];
}) {
  const decades = [2020, 2010, 2000, 1990, 1980, 1970];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years = useMemo(() => {
    const out: number[] = [];
    if (decade) {
      const end = Math.min(decade + 9, currentYear);
      for (let y = end; y >= decade; y--) out.push(y);
    } else {
      // No decade selected: show all years across configured decades up to current year
      const earliest = 1970; // matches lowest decade in our list
      for (let y = currentYear; y >= earliest; y--) out.push(y);
    }
    return out;
  }, [currentYear, decade]);

  const months = [
    { n: 1, label: "Jan" },
    { n: 2, label: "Feb" },
    { n: 3, label: "Mar" },
    { n: 4, label: "Apr" },
    { n: 5, label: "May" },
    { n: 6, label: "Jun" },
    { n: 7, label: "Jul" },
    { n: 8, label: "Aug" },
    { n: 9, label: "Sep" },
    { n: 10, label: "Oct" },
    { n: 11, label: "Nov" },
    { n: 12, label: "Dec" },
  ];
  const monthsFiltered = year && year === currentYear ? months.filter((m) => m.n <= currentMonth) : months;

  const baseQuery: Query = { kind: kind || 'published' };

  const decodedTheme = theme ? (() => { try { return decodeURIComponent(theme); } catch { return theme; } })() : undefined;
  const themeDisplay = theme
    ? `#${(themeOptions || []).find((t) => t.slug === decodedTheme || t.slug === theme)?.name || decodedTheme}`
    : "Theme";
  const activeSecondaryFilterCount = [decade, year, month, theme].filter(Boolean).length;
  const hasActiveSecondaryFilters = activeSecondaryFilterCount > 0;
  const hasActiveSearch = Boolean(query?.trim());
  const hasActiveFilters = hasActiveSecondaryFilters || hasActiveSearch;
  const resetHref = makeHref(basePath, {
    ...baseQuery,
    decade: undefined,
    year: undefined,
    month: undefined,
    theme: undefined,
    q: undefined,
  });
  const activeFilterSummary = [
    decade ? `${decade}s` : null,
    year ? String(year) : null,
    month ? months.find((item) => item.n === month)?.label ?? null : null,
    theme ? themeDisplay : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(
    hasActiveSecondaryFilters,
  );

  useEffect(() => {
    setIsMobileFiltersOpen(hasActiveSecondaryFilters);
  }, [hasActiveSecondaryFilters]);

  function renderFilterCombos() {
    return (
      <>
        <div className="min-w-0">
          <Combo
            label={decade ? `${decade}s` : "Decade"}
            options={[
              { label: "All", href: makeHref(basePath, { ...baseQuery, decade: undefined, year: undefined, month: undefined }) },
              ...decades.map((d) => ({ label: `${d}s`, href: makeHref(basePath, { ...baseQuery, decade: d, year: undefined, month: undefined }) })),
            ]}
          />
        </div>
        <div className="min-w-0">
          <Combo
            label={year ? String(year) : "Year"}
            options={[
              { label: "All", href: makeHref(basePath, { ...baseQuery, year: undefined, month: undefined, decade }) },
              ...years.map((y) => ({ label: String(y), href: makeHref(basePath, { ...baseQuery, year: y, month: undefined, decade }) })),
            ]}
          />
        </div>
        <div className="min-w-0">
          <Combo
            label={month ? months.find((m) => m.n === month)?.label || "Month" : "Month"}
            options={[
              { label: "All", href: makeHref(basePath, { ...baseQuery, month: undefined, decade, year }) },
              ...(year ? monthsFiltered.map((m) => ({ label: m.label, href: makeHref(basePath, { ...baseQuery, month: m.n, decade, year }) })) : []),
            ]}
            disabled={!year}
          />
        </div>
        <div className="min-w-0">
          <Combo
            label={themeDisplay}
            options={[
              { label: "All", href: makeHref(basePath, { ...baseQuery, theme: undefined, decade, year, month }) },
              ...((themeOptions || []).map((t) => ({ label: `#${t.name}`, href: makeHref(basePath, { ...baseQuery, theme: t.slug, decade, year, month }) }))),
            ]}
          />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 md:hidden">
        <form action={basePath}>
          <SearchInput
            name="q"
            placeholder="Поиск"
            iconPosition="right"
            defaultValue={query}
            className="h-11 hollow-field border-primary dark:border-primary focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px]"
          />
        </form>
        <div className="flex items-center gap-2">
          <Button
            weight="hollow"
            size="lg"
            className="min-w-0 flex-1 justify-between"
            aria-controls="mobile-secondary-filters"
            aria-expanded={isMobileFiltersOpen}
            onClick={() => setIsMobileFiltersOpen((current) => !current)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              <span>Фильтры</span>
              {hasActiveSecondaryFilters ? (
                <span className="text-xs text-primary/70">
                  ({activeSecondaryFilterCount})
                </span>
              ) : null}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isMobileFiltersOpen && "rotate-180",
              )}
            />
          </Button>
          {hasActiveFilters ? (
            <Button
              weight="hollow"
              size="icon"
              className="size-10 shrink-0"
              asChild
              aria-label="Сброс фильтров"
            >
              <Link href={resetHref}>
                <X className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
        {hasActiveSecondaryFilters ? (
          <p className="px-1 text-xs text-primary/75">{activeFilterSummary}</p>
        ) : null}
        {isMobileFiltersOpen ? (
          <div
            id="mobile-secondary-filters"
            className="grid grid-cols-1 gap-2 rounded-xl border border-primary/15 bg-white/55 p-2 shadow-sm sm:grid-cols-2 dark:bg-background/40"
          >
            {renderFilterCombos()}
          </div>
        ) : null}
      </div>

      <div className="hidden w-full md:grid md:grid-cols-[repeat(4,minmax(0,1fr))_minmax(11rem,0.9fr)_auto] md:gap-2">
        {renderFilterCombos()}
        <div className="min-w-0">
          <form action={basePath} className="flex items-center gap-2">
            <SearchInput
              name="q"
              placeholder="Поиск"
              iconPosition="right"
              defaultValue={query}
              className="h-10 hollow-field border-primary dark:border-primary focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px]"
            />
          </form>
        </div>
        <div className="justify-self-end">
          {hasActiveFilters ? (
            <Button
              weight="hollow"
              size="icon"
              className="size-10"
              asChild
              aria-label="Сброс фильтров"
            >
              <Link href={resetHref}>
                <X className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Combo({ label, options, disabled }: { label: string; options: { label: string; href: string }[]; disabled?: boolean }) {
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(trimmed),
    );
  }, [options, query]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button weight="hollow" size="lg" className="w-full justify-between" disabled={disabled} aria-disabled={disabled}>
          <span>{label}</span>
          <span className="opacity-60">▾</span>
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-[240px] p-0" align="start">
          <div className="space-y-2 p-2">
            <SearchInput
              iconPosition="right"
              label="Search options"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              value={query}
            />
            <div className="max-h-[300px] overflow-y-auto rounded-md border border-border p-1">
              {filteredOptions.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">No results</p>
              ) : (
                filteredOptions.map((option) => (
                  <Link
                    className="block rounded-sm px-2 py-2 text-sm hover:bg-muted"
                    href={option.href}
                    key={option.href}
                  >
                    {option.label}
                  </Link>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}


