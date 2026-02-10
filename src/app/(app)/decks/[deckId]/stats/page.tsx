"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getReviewStatsBetween,
  useReviewsByDay,
  useHeatmapData,
  useCardDistribution,
  type ReviewStats,
} from "@/lib/stats";
import { listCardsForDeckTree } from "@/store/decks";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import {
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, Target } from "lucide-react";
import { useTranslation } from "@/i18n";

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining > 0 ? `${hours} h ${remaining} min` : `${hours} h`;
}

export default function DeckStatsPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const { t, language } = useTranslation();

  const [todayStats, setTodayStats] = useState<ReviewStats | null>(null);
  const [cardCounts, setCardCounts] = useState<{
    total: number;
    new: number;
    learning: number;
    mature: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reviewsByDay = useReviewsByDay(30, deckId);
  const heatmapData = useHeatmapData(90, deckId);
  const cardDistribution = useCardDistribution(deckId);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      if (mounted) {
        setLoadError(null);
        setLoading(true);
      }
      try {
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [today, cards] = await Promise.all([
          getReviewStatsBetween(todayStart.toISOString(), now.toISOString(), deckId),
          listCardsForDeckTree(deckId),
        ]);

        if (!mounted) return;

        setTodayStats(today);

        const activeCards = cards.filter((card) => !card.suspended);
        const total = activeCards.length;
        const newCount = activeCards.filter((c) => c.state === "new").length;
        const learningCount = activeCards.filter(
          (c) => c.state === "learning" || c.state === "relearning"
        ).length;
        const matureCount = activeCards.filter((c) => c.state === "review").length;

        setCardCounts({ total, new: newCount, learning: learningCount, mature: matureCount });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[DeckStatsPage] load failed:", error);
        }
        if (mounted) {
          setLoadError("Network error. Please check your connection and retry.");
          setTodayStats({
            totalReviews: 0,
            totalMinutes: 0,
            retentionRate: 0,
            ratings: {
              again: 0,
              hard: 0,
              good: 0,
              easy: 0,
            },
          });
          setCardCounts({ total: 0, new: 0, learning: 0, mature: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, [deckId]);

  const handleRetry = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [today, cards] = await Promise.all([
        getReviewStatsBetween(todayStart.toISOString(), now.toISOString(), deckId),
        listCardsForDeckTree(deckId),
      ]);

      setTodayStats(today);

      const activeCards = cards.filter((card) => !card.suspended);
      const total = activeCards.length;
      const newCount = activeCards.filter((c) => c.state === "new").length;
      const learningCount = activeCards.filter(
        (c) => c.state === "learning" || c.state === "relearning"
      ).length;
      const matureCount = activeCards.filter((c) => c.state === "review").length;

      setCardCounts({ total, new: newCount, learning: learningCount, mature: matureCount });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[DeckStatsPage] retry failed:", error);
      }
      setLoadError("Network error. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  const formatChartDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const pieData = cardDistribution
    ? [
        { name: t("dashboard.new"), value: cardDistribution.new, color: "#3b82f6" },
        { name: t("dashboard.learning"), value: cardDistribution.learning, color: "#f97316" },
        { name: t("dashboard.learned"), value: cardDistribution.learned, color: "#22c55e" },
      ].filter((d) => d.value > 0)
    : [];

  const totalPieCards = pieData.reduce((sum, item) => sum + item.value, 0);

  const formatLegend = (value: string, entry: any) => {
    const cardValue = entry?.payload?.value ?? 0;
    const percentage =
      totalPieCards > 0 && cardValue > 0
        ? ((cardValue / totalPieCards) * 100).toFixed(1)
        : "0.0";
    const cardWord = cardValue > 1 ? t("dashboard.cards") : t("dashboard.card");
    return `${value} : ${cardValue} ${cardWord} (${percentage}%)`;
  };

  const hasReviews = todayStats !== null && (todayStats.totalReviews > 0 || !loading);
  const hasCards = cardCounts !== null && cardCounts.total > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">{t("deckStats.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("deckStats.subtitle")}</p>
      </div>

      {loadError && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium mb-2">Network error</h3>
              <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
              <Button onClick={handleRetry}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("deckStats.totalCards")}
          </p>
          <p className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : cardCounts?.total ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {t("deckStats.newCards")}
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {loading ? "..." : cardCounts?.new ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            {t("deckStats.learningCards")}
          </p>
          <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
            {loading ? "..." : cardCounts?.learning ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
            {t("deckStats.matureCards")}
          </p>
          <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">
            {loading ? "..." : cardCounts?.mature ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("deckStats.retentionRate")}
          </p>
          <p className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : formatPercent(todayStats?.retentionRate ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("deckStats.reviewsToday")}
          </p>
          <p className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : todayStats?.totalReviews ?? 0}
          </p>
        </div>
      </div>

      {/* Empty state: no cards at all */}
      {!loading && !hasCards && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("deckStats.noCards")}</h3>
              <p className="text-sm text-muted-foreground">{t("deckStats.noDataHint")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts - only show if there are cards */}
      {(loading || hasCards) && (
        <div className="space-y-6">
          {/* Reviews per day chart */}
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 p-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <CardTitle className="text-lg font-bold">{t("deckStats.reviewsPerDay")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reviewsByDay !== undefined ? (
                reviewsByDay.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={reviewsByDay}>
                      <defs>
                        <linearGradient id="deckLineGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f8fafc" stopOpacity={0.95} />
                          <stop offset="60%" stopColor="#93c5fd" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="deckAreaGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.25} />
                          <stop offset="60%" stopColor="#1e3a8a" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                        </linearGradient>
                        <filter id="deckLineShadow" x="-10%" y="-10%" width="120%" height="140%">
                          <feDropShadow
                            dx="0"
                            dy="8"
                            stdDeviation="6"
                            floodColor="#0f172a"
                            floodOpacity="0.6"
                          />
                        </filter>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 10"
                        className="stroke-white/5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        className="text-xs"
                        stroke="currentColor"
                        opacity={0.4}
                      />
                      <YAxis className="text-xs" stroke="currentColor" opacity={0.35} />
                      <RechartsTooltip
                        labelFormatter={(label) => formatChartDate(label)}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(148, 163, 184, 0.25)",
                          borderRadius: "0.9rem",
                          boxShadow: "0 14px 30px -12px rgba(0, 0, 0, 0.6)",
                          color: "#e2e8f0",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="url(#deckLineGlow)"
                        strokeWidth={4}
                        filter="url(#deckLineShadow)"
                        dot={{
                          r: 4,
                          fill: "#e2e8f0",
                          strokeWidth: 2,
                          stroke: "rgba(148, 163, 184, 0.6)",
                        }}
                        activeDot={{ r: 7, fill: "#f8fafc", strokeWidth: 3, stroke: "#93c5fd" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="none"
                        fill="url(#deckAreaGlow)"
                        fillOpacity={1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    {t("deckStats.noData")}
                  </div>
                )
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  <div className="animate-pulse">{t("common.loading")}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity heatmap + Card distribution */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">{t("deckStats.activity")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-4">
                {heatmapData !== undefined ? (
                  heatmapData.some((d) => d.count > 0) ? (
                    <ActivityHeatmap data={heatmapData} days={90} />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                      {t("deckStats.noData")}
                    </div>
                  )
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="animate-pulse">{t("common.loading")}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-2">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {t("deckStats.cardDistribution")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-2 py-4">
                {cardDistribution !== undefined ? (
                  pieData.length > 0 ? (
                    <div className="w-full h-[260px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            label={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            height={60}
                            wrapperStyle={{
                              paddingTop: "20px",
                              fontSize: "14px",
                              fontWeight: "600",
                            }}
                            formatter={formatLegend}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                      {t("deckStats.noCards")}
                    </div>
                  )
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="animate-pulse">{t("common.loading")}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
