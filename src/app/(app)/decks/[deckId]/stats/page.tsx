"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DeckStatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Statistics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze your learning progress
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Deck Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Statistics Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              We&apos;re working on detailed statistics and analytics to help you track
              your learning progress. This feature will include:
            </p>
            <ul className="mt-4 text-sm text-muted-foreground space-y-1 text-left">
              <li>• Daily review counts and trends</li>
              <li>• Card maturity distribution</li>
              <li>• Success rates by card type</li>
              <li>• Study time tracking</li>
              <li>• Forecast and projections</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Quick Stats (Placeholder)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total cards</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mature cards</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average ease</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
            <div>
              <p className="text-muted-foreground">Retention rate</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
