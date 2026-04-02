"use client";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

export function SiteHeader() {
  const { isSignedIn } = useUser();

  return (
    <header className="w-full border-b border-primary/20 bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="heading font-bold text-3xl sm:text-4xl md:text-5xl leading-none">Стихи Толика</span>
          <span className="hidden sm:block text-sm md:text-base opacity-75">Стихи Анатолия Маркуса</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm md:text-base">
          <Link href="/about" className="ink-link">Обо мне</Link>
          <Link href="/api/random">
            <Button size="sm" weight="hollow" text="Случайное" />
          </Link>
          {isSignedIn ? (
            <UserButton userProfileUrl="/profile" />
          ) : null}
          <ThemeToggle className="ml-1 sm:ml-2" />
        </nav>
      </div>
    </header>
  );
}


