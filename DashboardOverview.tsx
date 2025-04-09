"use client";

import {
  CalendarClock,
  UserCheck,
  Activity,
  Award,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: "blue" | "green" | "purple" | "amber";
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  trend = "neutral",
  trendValue,
  color
}: StatCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "green":
        return "bg-green-50 text-green-600 border-green-100";
      case "purple":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "amber":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendTextColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className={`rounded-lg border p-5 shadow-sm ${getColorClasses()}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
        </div>
        <div className={`rounded-full p-2 ${getColorClasses()}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">{description}</p>
      {trendValue && (
        <div className="mt-3 flex items-center">
          {getTrendIcon()}
          <span className={`text-xs font-medium ${getTrendTextColor()}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

const DashboardOverview = () => {
  const stats: StatCardProps[] = [
    {
      title: "Upcoming Sessions",
      value: "3",
      description: "You have 3 sessions scheduled this week",
      icon: <CalendarClock className="h-5 w-5" />,
      trend: "up",
      trendValue: "2 more than last week",
      color: "blue",
    },
    {
      title: "Expert Consultations",
      value: "12",
      description: "Total sessions completed with experts",
      icon: <UserCheck className="h-5 w-5" />,
      trend: "up",
      trendValue: "4 in the last month",
      color: "green",
    },
    {
      title: "Activity Streak",
      value: "7 days",
      description: "Your current login streak",
      icon: <Activity className="h-5 w-5" />,
      trend: "up",
      trendValue: "Personal best!",
      color: "purple",
    },
    {
      title: "Reward Points",
      value: "1,250",
      description: "750 points until Gold tier",
      icon: <Award className="h-5 w-5" />,
      trend: "up",
      trendValue: "Earned 320 this week",
      color: "amber",
    },
    {
      title: "Goals Progress",
      value: "2/4",
      description: "Goals completed this month",
      icon: <TrendingUp className="h-5 w-5" />,
      trendValue: "On track for your target",
      color: "blue",
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
      <div className="lg:col-span-3 flex justify-end mt-4">
        <Button variant="outline" className="text-sm">
          View detailed analytics
        </Button>
      </div>
    </>
  );
};

export default DashboardOverview;
