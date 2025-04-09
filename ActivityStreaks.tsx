import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FlameIcon, TrendingUpIcon } from "lucide-react";

const ActivityStreaks = () => {
  // Mock data
  const currentStreak = 3;
  const longestStreak = 14;
  const currentWeek = [
    { day: "Mon", active: true },
    { day: "Tue", active: true },
    { day: "Wed", active: true },
    { day: "Thu", active: false },
    { day: "Fri", active: false },
    { day: "Sat", active: false },
    { day: "Sun", active: false },
  ];

  const todayIsDone = true;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-lg">Activity Streaks</h3>
        <Badge variant="outline" className="flex items-center gap-1 px-2">
          <FlameIcon className="h-3 w-3 text-orange-500" />
          <span className="text-orange-500">{currentStreak} Day Streak</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <FlameIcon className="h-4 w-4 mr-1 text-orange-500" />
            Current Streak
          </div>
          <div className="text-2xl font-bold">{currentStreak} days</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <TrendingUpIcon className="h-4 w-4 mr-1 text-blue-500" />
            Longest Streak
          </div>
          <div className="text-2xl font-bold">{longestStreak} days</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          This Week
        </h4>

        <div className="grid grid-cols-7 gap-1 text-center">
          {currentWeek.map((day, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">{day.day}</div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                  day.active
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {day.active && "✓"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">Today's Check-in</h4>
            <p className="text-sm text-gray-600">
              {todayIsDone
                ? "You've checked in today! Keep it up!"
                : "Check in to continue your streak"}
            </p>
          </div>
          <Button
            disabled={todayIsDone}
            variant={todayIsDone ? "outline" : "default"}
          >
            {todayIsDone ? "Checked In ✓" : "Check In"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityStreaks;
