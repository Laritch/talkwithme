"use client";

import { CheckCircle2, Circle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  category: "mental" | "physical" | "career" | "financial";
}

const GoalProgress = () => {
  const goals: Goal[] = [
    {
      id: "g1",
      title: "Complete 2 meditation sessions",
      completed: true,
      category: "mental",
    },
    {
      id: "g2",
      title: "Schedule financial planning session",
      completed: true,
      dueDate: "Yesterday",
      category: "financial",
    },
    {
      id: "g3",
      title: "Set up career development plan",
      completed: false,
      dueDate: "Tomorrow",
      category: "career",
    },
    {
      id: "g4",
      title: "Try stress reduction technique",
      completed: false,
      dueDate: "This week",
      category: "mental",
    },
  ];

  const completedGoals = goals.filter((goal) => goal.completed);
  const completionPercentage = (completedGoals.length / goals.length) * 100;

  const getCategoryColor = (category: Goal["category"]) => {
    switch (category) {
      case "mental":
        return "bg-purple-100 text-purple-800";
      case "physical":
        return "bg-green-100 text-green-800";
      case "career":
        return "bg-blue-100 text-blue-800";
      case "financial":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Goal Progress</h3>
          <Button variant="outline" size="sm" className="h-8">
            Add Goal
          </Button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Monthly Goals ({completedGoals.length}/{goals.length})
          </div>
          <div className="text-sm text-gray-600">
            {completionPercentage.toFixed(0)}% Complete
          </div>
        </div>

        <Progress value={completionPercentage} className="h-2 mb-6" />

        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-start p-3 rounded-lg ${
                goal.completed ? "bg-gray-50" : ""
              }`}
            >
              <div className="mr-3 mt-0.5">
                {goal.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <div className="font-medium text-sm">
                    {goal.title}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getCategoryColor(goal.category)}`}
                  >
                    {goal.category}
                  </Badge>
                </div>
                {goal.dueDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Due: {goal.dueDate}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-blue-600"
        >
          View all goals
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center text-sm h-8"
        >
          <PlusCircle className="mr-1 h-3.5 w-3.5" />
          New Goal
        </Button>
      </div>
    </div>
  );
};

export default GoalProgress;
