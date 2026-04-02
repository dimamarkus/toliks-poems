"use client";

import { Children, type ReactNode } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";

type OrderedColumnsProps = {
  children: ReactNode;
  desktopColumns?: number;
};

export function OrderedColumns({
  children,
  desktopColumns = 2,
}: OrderedColumnsProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const items = Children.toArray(children);

  if (!isDesktop || desktopColumns <= 1) {
    return <div className="space-y-8">{items}</div>;
  }

  const columns = Array.from({ length: desktopColumns }, () => [] as ReactNode[]);

  items.forEach((item, index) => {
    columns[index % desktopColumns].push(item);
  });

  return (
    <div
      className="grid items-start gap-8"
      style={{ gridTemplateColumns: `repeat(${desktopColumns}, minmax(0, 1fr))` }}
    >
      {columns.map((column, index) => (
        <div className="space-y-8" key={index}>
          {column}
        </div>
      ))}
    </div>
  );
}
