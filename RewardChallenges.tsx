import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckIcon, Clock3Icon, Trophy } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  progress: number;
  total: number;
  category: string;
  status: "in-progress" | "completed" | "not-started";
}

const challenges: Challenge[] = [
  {
    id: "c1",
    title: "Book 3 Sessions",
    description: "Book three sessions with experts this month",
    pointsReward: 150,
    progress: 2,
    total: 3,
    category: "daily",
    status: "in-progress",
  },
  {
    id: "c2",
    title: "Complete Profile",
    description: "Fill all sections of your profile",
    pointsReward: 50,
    progress: 100,
    total: 100,
    category: "daily",
    status: "completed",
  },
  {
    id: "c3",
    title: "Submit Feedback",
    description: "Rate and review your sessions with experts",
    pointsReward: 25,
    progress: 0,
    total: 3,
    category: "daily",
    status: "not-started",
  },
  {
    id: "c4",
    title: "Weekly Streak",
    description: "Login to the platform for 7 consecutive days",
    pointsReward: 100,
    progress: 3,
    total: 7,
    category: "weekly",
    status: "in-progress",
  },
  {
    id: "c5",
    title: "Reach Silver Tier",
    description: "Accumulate 2000 points to reach Silver tier",
    pointsReward: 200,
    progress: 1250,
    total: 2000,
    category: "monthly",
    status: "in-progress",
  },
];

const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  const progressPercentage = (challenge.progress / challenge.total) * 100;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold">{challenge.title}</h3>
        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          +{challenge.pointsReward} pts
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>

      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">Progress</span>
          <span>
            {challenge.progress}/{challenge.total}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-1" />
      </div>

      <div className="flex justify-between items-center mt-4">
        {challenge.status === "completed" ? (
          <span className="inline-flex items-center text-xs text-green-600">
            <CheckIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        ) : challenge.status === "in-progress" ? (
          <span className="inline-flex items-center text-xs text-amber-600">
            <Clock3Icon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        ) : (
          <span className="inline-flex items-center text-xs text-gray-500">
            Not Started
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          disabled={challenge.status === "completed"}
        >
          {challenge.status === "completed" ? "Claimed" : "Claim Reward"}
        </Button>
      </div>
    </div>
  );
};

const RewardChallenges = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-lg">Challenges</h3>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-3">
          {challenges
            .filter((challenge) => challenge.category === "daily")
            .map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-3">
          {challenges
            .filter((challenge) => challenge.category === "weekly")
            .map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-3">
          {challenges
            .filter((challenge) => challenge.category === "monthly")
            .map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardChallenges;
