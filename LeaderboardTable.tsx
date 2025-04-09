import Image from "next/image";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  Medal
} from "lucide-react";

interface User {
  name: string;
  image: string;
  tier: string;
  isCurrentUser?: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user: User;
  value: string;
  change: "up" | "down" | "same";
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
}

const LeaderboardTable = ({ data }: LeaderboardTableProps) => {
  const getMedalByRank = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
      default:
        return <span className="text-gray-700 font-medium">{rank}</span>;
    }
  };

  const getChangeIcon = (change: "up" | "down" | "same") => {
    switch (change) {
      case "up":
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      case "same":
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTierBadge = (tier: string) => {
    let color = "";
    switch (tier) {
      case "Bronze":
        color = "bg-amber-700 text-white";
        break;
      case "Silver":
        color = "bg-gray-300 text-gray-800";
        break;
      case "Gold":
        color = "bg-yellow-500 text-white";
        break;
      case "Platinum":
        color = "bg-gradient-to-r from-slate-500 to-slate-800 text-white";
        break;
      default:
        color = "bg-gray-200 text-gray-800";
    }
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="px-4 py-3 text-sm font-medium text-gray-500">Rank</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">User</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">Value</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">Change</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr
              key={entry.user.name}
              className={`border-b border-gray-100 ${
                entry.user.isCurrentUser ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <td className="px-4 py-4 text-center">
                {getMedalByRank(entry.rank)}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full overflow-hidden mr-3 relative">
                    <Image
                      src={entry.user.image}
                      alt={entry.user.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">
                      {entry.user.name}
                      {entry.user.isCurrentUser && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm mt-1">
                      {getTierBadge(entry.user.tier)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 font-medium">{entry.value}</td>
              <td className="px-4 py-4">
                {getChangeIcon(entry.change)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
