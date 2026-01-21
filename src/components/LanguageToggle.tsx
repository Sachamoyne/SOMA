"use client";

import { useLanguage, type Language } from "@/i18n";
import { Globe } from "lucide-react";
import { cn } from "@/lib/cn";

interface LanguageToggleProps {
  className?: string;
  variant?: "default" | "minimal" | "landing";
}

export function LanguageToggle({ className, variant = "default" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  if (variant === "landing") {
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          "flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground",
          className
        )}
        aria-label={`Switch to ${language === "en" ? "French" : "English"}`}
      >
        <Globe className="h-4 w-4" />
        <span>{language === "en" ? "FR" : "EN"}</span>
      </button>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
        aria-label={`Switch to ${language === "en" ? "French" : "English"}`}
      >
        <span className={language === "en" ? "text-foreground" : "text-muted-foreground/50"}>EN</span>
        <span className="text-muted-foreground/30">/</span>
        <span className={language === "fr" ? "text-foreground" : "text-muted-foreground/50"}>FR</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
        className
      )}
      aria-label={`Switch to ${language === "en" ? "French" : "English"}`}
    >
      <Globe className="h-4 w-4" />
      <span>{language === "en" ? "EN" : "FR"}</span>
    </button>
  );
}
