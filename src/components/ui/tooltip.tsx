"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface TooltipProps {
  children: React.ReactElement;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded shadow-lg whitespace-nowrap",
            side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1",
            side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1",
            side === "left" && "right-full top-1/2 -translate-y-1/2 mr-1",
            side === "right" && "left-full top-1/2 -translate-y-1/2 ml-1"
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

