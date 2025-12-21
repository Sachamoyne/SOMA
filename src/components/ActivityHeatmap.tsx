"use client";

import { useMemo } from "react";
import type { HeatmapCell } from "@/lib/stats";
import { Tooltip } from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
  data: HeatmapCell[];
  days?: number; // Default 90
}

export function ActivityHeatmap({ data, days = 90 }: ActivityHeatmapProps) {
  const maxCount = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const totalReviews = useMemo(() => {
    return data.reduce((sum, cell) => sum + cell.count, 0);
  }, [data]);

  // Group data by week (starting from the oldest date)
  const weeks = useMemo(() => {
    const weeks: HeatmapCell[][] = [];
    let currentWeek: HeatmapCell[] = [];
    
    // Find the first day (oldest)
    if (data.length === 0) return weeks;
    
    // Start from the first day and group by week
    for (let i = 0; i < data.length; i++) {
      const cell = data[i];
      currentWeek.push(cell);
      
      // If it's Saturday (6) or last item, start a new week
      if (cell.dayOfWeek === 6 || i === data.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    return weeks;
  }, [data]);

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-muted";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-green-200 dark:bg-green-900";
    if (intensity < 0.5) return "bg-green-400 dark:bg-green-700";
    if (intensity < 0.75) return "bg-green-600 dark:bg-green-500";
    return "bg-green-700 dark:bg-green-400";
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      {/* Heatmap grid */}
      <div className="flex gap-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((cell, dayIndex) => {
              const tooltipContent = `${formatDate(cell.date)}: ${cell.count} révision${
                cell.count !== 1 ? "s" : ""
              }`;
              return (
                <Tooltip key={`${cell.date}-${dayIndex}`} content={tooltipContent}>
                  <div
                    className={`w-4 h-4 rounded ${getIntensity(
                      cell.count
                    )} cursor-pointer hover:ring-2 hover:ring-ring transition-all`}
                  />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Moins</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded bg-muted" />
            <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900" />
            <div className="w-3 h-3 rounded bg-green-400 dark:bg-green-700" />
            <div className="w-3 h-3 rounded bg-green-600 dark:bg-green-500" />
            <div className="w-3 h-3 rounded bg-green-700 dark:bg-green-400" />
          </div>
          <span>Plus</span>
        </div>
        
        {/* Total reviews indicator */}
        <div className="text-xs text-muted-foreground">
          {totalReviews} révision{totalReviews !== 1 ? "s" : ""} sur {days} jours
        </div>
      </div>
    </div>
  );
}

