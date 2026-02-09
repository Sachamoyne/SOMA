"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, List, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";
import { useIsApp } from "@/hooks/useIsApp";
import { appHref } from "@/lib/appHref";

const TAB_ITEMS = [
  { href: "/decks", icon: BookOpen, labelKey: "nav.decks" },
  { href: "/browse", icon: List, labelKey: "nav.browse" },
  { href: "/statistics", icon: LayoutDashboard, labelKey: "nav.statistics" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
] as const;

export function MobileBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isApp = useIsApp();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={appHref(item.href, isApp)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5 stroke-[1.5]" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
