"use client";

import { Search } from "lucide-react";
import { useId, type ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/utils/cn";
import { Input } from "./ui/input";

type SearchInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, "type"> & {
  iconPosition?: "left" | "right";
  label?: string;
  labelSrOnly?: boolean;
};

export function SearchInput({
  className,
  iconPosition = "left",
  id,
  label = "Search",
  labelSrOnly = true,
  ...props
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? `search-input-${generatedId}`;

  return (
    <div>
      <label
        className={labelSrOnly ? "sr-only" : "mb-2 block text-sm font-medium"}
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60",
            iconPosition === "left" ? "left-2.5" : "right-2.5",
          )}
        />
        <Input
          className={cn(
            iconPosition === "left" ? "pl-8" : "pr-8",
            className,
          )}
          id={inputId}
          role="searchbox"
          type="search"
          {...props}
        />
      </div>
    </div>
  );
}
