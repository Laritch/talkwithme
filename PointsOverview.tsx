import { CreditCardIcon, AwardIcon, BarChart3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const PointsOverview = () => {
  // Mock data
  const userPoints = 1250;
  const nextTierPoints = 2000;
  const currentTier = "Silver";
  const nextTier = "Gold";
  const progress = (userPoints / nextTierPoints) * 100;

  const statCards = [
    {
      title: "Available Points",
      value: userPoints,
      icon: <CreditCardIcon className="h-6 w-6 text-blue-600" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Current Tier",
      value: currentTier,
      icon: <AwardIcon className="h-6 w-6 text-purple-600" />,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Lifetime Points Earned",
      value: "4,320",
      icon: <BarChart3Icon className="h-6 w-6 text-green-600" />,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];

  return (
    <>
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg p-6 flex flex-col`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <h3 className={`text-2xl font-bold ${card.textColor}`}>
                {card.value}
              </h3>
            </div>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              {card.icon}
            </div>
          </div>

          {index === 0 && (
            <>
              <div className="mt-2 mb-1 flex justify-between text-sm">
                <span>Progress to {nextTier}</span>
                <span>
                  {userPoints}/{nextTierPoints}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Redeem Points
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
};

export default PointsOverview;
