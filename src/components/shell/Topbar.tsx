"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

interface TopbarProps {
  title: string;
  showNewDeck?: boolean;
  onNewDeck?: () => void;
  showImport?: boolean;
  onImport?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({
  title,
  showNewDeck,
  onNewDeck,
  showImport,
  onImport,
  actions,
}: TopbarProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="flex gap-2">
        {actions}
        {showImport && onImport && (
          <Button variant="outline" onClick={onImport}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        )}
        {showNewDeck && onNewDeck && (
          <Button onClick={onNewDeck}>
            <Plus className="h-4 w-4" />
            New deck
          </Button>
        )}
      </div>
    </div>
  );
}

