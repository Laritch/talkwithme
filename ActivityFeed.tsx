"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  CalendarCheck,
  MessageSquare,
  Award,
  FileCheck,
  Clock,
  Hourglass,
  Star,
  ThumbsUp,
  BookOpen
} from "lucide-react";

interface Activity {
  id: string;
  type: "session_completed" | "session_booked" | "message" | "points_earned" | "goal_completed" | "streak" | "session_reminder" | "expert_rated" | "resource_viewed";
  title: string;
  description?: string;
  time: Date;
  data?: {
    expertName?: string;
    expertImage?: string;
    pointsAmount?: number;
    goalName?: string;
    streakDays?: number;
    sessionTime?: string;
    sessionDate?: string;
    rating?: number;
    resourceTitle?: string;
  };
}

const ActivityFeed = () => {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "session_completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "session_booked":
        return <CalendarCheck className="h-5 w-5 text-blue-600" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-indigo-600" />;
      case "points_earned":
        return <Award className="h-5 w-5 text-amber-600" />;
      case "goal_completed":
        return <FileCheck className="h-5 w-5 text-green-600" />;
      case "streak":
        return <Hourglass className="h-5 w-5 text-purple-600" />;
      case "session_reminder":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "expert_rated":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "resource_viewed":
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      default:
        return <ThumbsUp className="h-5 w-5 text-gray-600" />;
    }
  };

  const getLineColor = (type: Activity["type"]) => {
    switch (type) {
      case "session_completed":
      case "goal_completed":
        return "bg-green-600";
      case "session_booked":
      case "resource_viewed":
        return "bg-blue-600";
      case "message":
        return "bg-indigo-600";
      case "points_earned":
        return "bg-amber-600";
      case "streak":
        return "bg-purple-600";
      case "session_reminder":
        return "bg-orange-600";
      case "expert_rated":
        return "bg-yellow-500";
      default:
        return "bg-gray-600";
    }
  };

  const recentActivities: Activity[] = [
    {
      id: "a1",
      type: "session_completed",
      title: "Session Completed",
      description: "Your session with Dr. Sarah Johnson has ended.",
      time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      data: {
        expertName: "Dr. Sarah Johnson",
        expertImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      },
    },
    {
      id: "a2",
      type: "points_earned",
      title: "Points Earned",
      description: "You earned points for completing your session.",
      time: new Date(Date.now() - 1000 * 60 * 29), // 29 minutes ago
      data: {
        pointsAmount: 50,
      },
    },
    {
      id: "a3",
      type: "expert_rated",
      title: "Expert Rated",
      description: "You rated your session with Dr. Sarah Johnson.",
      time: new Date(Date.now() - 1000 * 60 * 28), // 28 minutes ago
      data: {
        expertName: "Dr. Sarah Johnson",
        rating: 5,
      },
    },
    {
      id: "a4",
      type: "session_booked",
      title: "Session Booked",
      description: "You scheduled a new session with Michael Chen.",
      time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      data: {
        expertName: "Michael Chen",
        expertImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        sessionDate: "Tomorrow",
        sessionTime: "2:00 PM - 3:00 PM",
      },
    },
    {
      id: "a5",
      type: "streak",
      title: "Streak Continued",
      description: "You've maintained your daily login streak!",
      time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      data: {
        streakDays: 7,
      },
    },
    {
      id: "a6",
      type: "resource_viewed",
      title: "Resource Viewed",
      description: "You viewed a recommended resource.",
      time: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      data: {
        resourceTitle: "Managing Stress in Daily Life",
      },
    },
    {
      id: "a7",
      type: "goal_completed",
      title: "Goal Completed",
      description: "You completed one of your goals.",
      time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      data: {
        goalName: "Complete 2 meditation sessions",
      },
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Recent Activity</h3>
      </div>

      <div className="p-4">
        <div className="relative">
          {recentActivities.map((activity, index) => (
            <div key={activity.id} className="pb-5 last:pb-0">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="flex-shrink-0 rounded-full p-2 bg-white border border-gray-200">
                    {getActivityIcon(activity.type)}
                  </div>
                  {index < recentActivities.length - 1 && (
                    <div
                      className={`h-full w-0.5 mt-2 ${getLineColor(
                        activity.type
                      )}`}
                    ></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    {activity.description}
                  </div>

                  {activity.data && (
                    <div className="mt-2">
                      {activity.type === "session_completed" && activity.data.expertName && (
                        <div className="flex items-center mt-1">
                          {activity.data.expertImage && (
                            <div className="flex-shrink-0 h-5 w-5 rounded-full overflow-hidden mr-2">
                              <Image
                                src={activity.data.expertImage}
                                alt={activity.data.expertName}
                                width={20}
                                height={20}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <Link href="/experts" className="text-sm text-blue-600 hover:underline">
                            {activity.data.expertName}
                          </Link>
                        </div>
                      )}

                      {activity.type === "points_earned" && activity.data.pointsAmount && (
                        <div className="flex items-center mt-1">
                          <span className="text-sm font-semibold text-amber-600">
                            +{activity.data.pointsAmount} points
                          </span>
                        </div>
                      )}

                      {activity.type === "goal_completed" && activity.data.goalName && (
                        <div className="inline-block mt-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {activity.data.goalName}
                        </div>
                      )}

                      {activity.type === "streak" && activity.data.streakDays && (
                        <div className="flex items-center mt-1">
                          <span className="text-sm font-semibold text-purple-600">
                            {activity.data.streakDays} day streak!
                          </span>
                        </div>
                      )}

                      {activity.type === "session_booked" && (
                        <div className="mt-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md inline-block">
                          {activity.data.sessionDate} at {activity.data.sessionTime}
                        </div>
                      )}

                      {activity.type === "expert_rated" && activity.data.rating && (
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < (activity.data?.rating || 0)
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-gray-500">
                            ({activity.data.rating}/5)
                          </span>
                        </div>
                      )}

                      {activity.type === "resource_viewed" && activity.data.resourceTitle && (
                        <div className="flex items-center mt-1">
                          <Link href="/resources" className="text-sm text-blue-600 hover:underline">
                            {activity.data.resourceTitle}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(activity.time, { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
