import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaderboardTable from "./LeaderboardTable";
import { Medal } from "lucide-react";

// Different categories of leaderboards
const leaderboardCategories = [
  {
    id: "overall",
    label: "Overall Points",
    description: "Users ranked by total points earned across all activities",
  },
  {
    id: "streak",
    label: "Longest Streak",
    description: "Users ranked by longest consecutive activity streak",
  },
  {
    id: "sessions",
    label: "Most Sessions",
    description: "Users ranked by number of expert sessions booked",
  },
  {
    id: "engagement",
    label: "Community Engagement",
    description: "Users ranked by platform engagement and community contributions",
  },
];

// Mock data for each category
const getMockDataForCategory = (category: string) => {
  const baseMockData = [
    {
      rank: 1,
      user: {
        name: "Jennifer P.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Gold",
      },
      value: category === "streak" ? "94 days" : category === "sessions" ? "48 sessions" : "9,542 pts",
      change: "up",
    },
    {
      rank: 2,
      user: {
        name: "Michael T.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Gold",
      },
      value: category === "streak" ? "82 days" : category === "sessions" ? "36 sessions" : "8,721 pts",
      change: "up",
    },
    {
      rank: 3,
      user: {
        name: "Sarah L.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Silver",
      },
      value: category === "streak" ? "78 days" : category === "sessions" ? "31 sessions" : "7,635 pts",
      change: "down",
    },
    {
      rank: 4,
      user: {
        name: "Robert K.",
        image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Platinum",
      },
      value: category === "streak" ? "71 days" : category === "sessions" ? "29 sessions" : "7,214 pts",
      change: "same",
    },
    {
      rank: 5,
      user: {
        name: "Amanda W.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Silver",
      },
      value: category === "streak" ? "65 days" : category === "sessions" ? "24 sessions" : "6,830 pts",
      change: "up",
    },
    {
      rank: 6,
      user: {
        name: "David C.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Silver",
      },
      value: category === "streak" ? "63 days" : category === "sessions" ? "22 sessions" : "6,429 pts",
      change: "down",
    },
    {
      rank: 7,
      user: {
        name: "Melissa J.",
        image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Silver",
      },
      value: category === "streak" ? "59 days" : category === "sessions" ? "21 sessions" : "5,921 pts",
      change: "up",
    },
    {
      rank: 8,
      user: {
        name: "Ryan B.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Bronze",
      },
      value: category === "streak" ? "51 days" : category === "sessions" ? "19 sessions" : "5,463 pts",
      change: "same",
    },
    {
      rank: 9,
      user: {
        name: "Emma S.",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Bronze",
      },
      value: category === "streak" ? "48 days" : category === "sessions" ? "17 sessions" : "4,987 pts",
      change: "down",
    },
    {
      rank: 10,
      user: {
        name: "You",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tier: "Silver",
        isCurrentUser: true,
      },
      value: category === "streak" ? "42 days" : category === "sessions" ? "16 sessions" : "4,320 pts",
      change: "up",
    },
  ];

  // Shuffle data except for the last item (current user)
  if (category !== "overall") {
    const shuffleArray = [...baseMockData];
    const currentUser = shuffleArray.pop();

    for (let i = shuffleArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleArray[i], shuffleArray[j]] = [shuffleArray[j], shuffleArray[i]];
    }

    // Update ranks
    shuffleArray.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Add current user back at a random position between 5-10
    const currentUserRank = Math.floor(Math.random() * 5) + 5;
    if (currentUser) {
      currentUser.rank = currentUserRank;
      shuffleArray.splice(currentUserRank - 1, 0, currentUser);
    }

    return shuffleArray;
  }

  return baseMockData;
};

const LeaderboardHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Medal className="mr-2 h-5 w-5" />
          Top Performers
        </h2>
        <div className="text-sm text-blue-100">
          Updated daily at 00:00 UTC
        </div>
      </div>
      <p className="text-blue-100 text-sm">
        Compete with other users to earn points and rewards. Check your ranking and work your way to the top!
      </p>
    </div>
  );
};

const LeaderboardTabs = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <LeaderboardHeader />

      <Tabs defaultValue="overall" className="p-4">
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-4">
          {leaderboardCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {leaderboardCategories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {category.description}
              </p>
            </div>
            <LeaderboardTable data={getMockDataForCategory(category.id)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LeaderboardTabs;
