"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface EngagementMetric {
  title: string;
  value: number;
  max: number;
  percentage: number;
  description: string;
  trend?: "positive" | "negative" | "neutral";
  status?: "success" | "warning" | "danger" | "neutral";
}

const EngagementMetrics = () => {
  const metrics: EngagementMetric[] = [
    {
      title: "Session Attendance",
      value: 9,
      max: 10,
      percentage: 90,
      description: "You've attended 9 out of 10 scheduled sessions",
      trend: "positive",
      status: "success",
    },
    {
      title: "Weekly Platform Visits",
      value: 5,
      max: 7,
      percentage: 71,
      description: "You've logged in 5 out of 7 days this week",
      trend: "positive",
      status: "success",
    },
    {
      title: "Goal Completion Rate",
      value: 2,
      max: 4,
      percentage: 50,
      description: "You've completed 2 out of 4 set goals",
      trend: "neutral",
      status: "warning",
    },
    {
      title: "Resource Utilization",
      value: 3,
      max: 12,
      percentage: 25,
      description: "You've accessed 3 out of 12 recommended resources",
      trend: "negative",
      status: "danger",
    },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-amber-600 bg-amber-100";
      case "danger":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getProgressColor = (status?: string) => {
    switch (status) {
      case "success":
        return "bg-green-600";
      case "warning":
        return "bg-amber-600";
      case "danger":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="p-5 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Engagement Metrics</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {metrics.map((metric, index) => (
          <div key={index} className="p-4">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium">{metric.title}</h4>
              <Badge
                variant="outline"
                className={`${getStatusColor(metric.status)} text-xs`}
              >
                {metric.value}/{metric.max}
              </Badge>
            </div>

            <div className="mb-1">
              <Progress
                value={metric.percentage}
                className={`h-2 ${metric.status === "danger" ? "bg-red-100" : metric.status === "warning" ? "bg-amber-100" : "bg-gray-100"}`}
                indicatorClassName={getProgressColor(metric.status)}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <p>{metric.description}</p>
              <div className="flex items-center">
                <Info className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-blue-600">Details</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Overall Engagement</h4>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: "65%" }}
            ></div>
          </div>
          <span className="ml-2 text-sm font-medium">65%</span>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Your engagement is above average compared to similar users
        </p>
      </div>
    </div>
  );
};

export default EngagementMetrics;
