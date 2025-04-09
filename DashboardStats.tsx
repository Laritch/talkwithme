"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
}

export function StatCard({ title, value, description, icon, change }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {change && (
          <div className="flex items-center gap-1 mt-1 text-xs font-medium">
            {change.trend === "up" && (
              <ArrowUpIcon className="h-3 w-3 text-green-500" />
            )}
            {change.trend === "down" && (
              <ArrowDownIcon className="h-3 w-3 text-red-500" />
            )}
            <span className={change.trend === "up" ? "text-green-500" : change.trend === "down" ? "text-red-500" : ""}>
              {change.value}% {change.trend === "up" ? "increase" : change.trend === "down" ? "decrease" : ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DataPoint {
  x: string;
  y: number;
}

interface ChartCardProps {
  title: string;
  data: DataPoint[];
  type: "line" | "bar" | "area";
  labels?: string[];
  height?: number;
}

export function ChartCard({ title, data, type, labels, height = 200 }: ChartCardProps) {
  const [chartComponent, setChartComponent] = useState<React.ReactNode>(null);

  useEffect(() => {
    // This would normally be a chart component rendered with a library like Chart.js or ApexCharts
    // For now, we'll just render a placeholder
    setChartComponent(
      <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-md">
        <p className="text-muted-foreground">Chart: {title} - {type} chart with {data.length} data points</p>
      </div>
    );
  }, [title, data, type]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          {chartComponent}
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: StatCardProps[];
  charts?: ChartCardProps[];
}

export default function DashboardStats({ stats, charts = [] }: DashboardStatsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={`stat-${i}`} {...stat} />
        ))}
      </div>

      {charts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.map((chart, i) => (
            <ChartCard key={`chart-${i}`} {...chart} />
          ))}
        </div>
      )}
    </div>
  );
}
