"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, List, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";

interface DeckNavProps {
  deckId: string;
}

export function DeckNav({ deckId }: DeckNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: `/decks/${deckId}`,
      icon: null,
      exact: true,
    },
    {
      label: "Add",
      href: `/decks/${deckId}/add`,
      icon: Plus,
    },
    {
      label: "Browse",
      href: `/decks/${deckId}/browse`,
      icon: List,
    },
    {
      label: "Stats",
      href: `/decks/${deckId}/stats`,
      icon: BarChart3,
    },
  ];

  return (
    <nav className="border-b bg-background">
      {/* Center the tabs using flex + justify-center */}
      <div className="flex items-center justify-center gap-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
