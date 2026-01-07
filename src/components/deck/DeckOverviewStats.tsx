"use client";

import { Card, CardContent } from "@/components/ui/card";

interface DeckOverviewStatsProps {
  newCount: number;
  learningCount: number;
  reviewCount: number;
}

export function DeckOverviewStats({
  newCount,
  learningCount,
  reviewCount,
}: DeckOverviewStatsProps) {
  return (
    <Card>
      <CardContent className="pt-8 pb-6">
        <div className="grid grid-cols-3 gap-8">
          {/* New cards */}
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {newCount}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              New
            </div>
          </div>

          {/* Learning cards */}
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {learningCount}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Learning
            </div>
          </div>

          {/* Review cards */}
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
              {reviewCount}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              To Review
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
