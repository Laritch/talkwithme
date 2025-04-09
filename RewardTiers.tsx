import { CheckIcon, StarIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Tier {
  name: string;
  points: number;
  color: string;
  benefits: string[];
  icon: React.ReactNode;
  current: boolean;
}

const tiers: Tier[] = [
  {
    name: "Bronze",
    points: 0,
    color: "bg-amber-700",
    benefits: [
      "Access to all experts",
      "Basic profile customization",
      "Standard support",
    ],
    icon: <StarIcon className="h-6 w-6" />,
    current: false,
  },
  {
    name: "Silver",
    points: 2000,
    color: "bg-gray-300",
    benefits: [
      "All Bronze benefits",
      "5% discount on sessions",
      "Priority customer support",
      "Access to community forums",
    ],
    icon: <StarIcon className="h-6 w-6" />,
    current: true,
  },
  {
    name: "Gold",
    points: 5000,
    color: "bg-yellow-500",
    benefits: [
      "All Silver benefits",
      "10% discount on sessions",
      "Exclusive monthly webinars",
      "Early access to new features",
      "Premium profile badge",
    ],
    icon: <StarIcon className="h-6 w-6" />,
    current: false,
  },
  {
    name: "Platinum",
    points: 10000,
    color: "bg-gradient-to-r from-slate-500 to-slate-800",
    benefits: [
      "All Gold benefits",
      "15% discount on sessions",
      "VIP phone support",
      "1 free session per month",
      "Personalized growth plan",
      "Access to exclusive events",
    ],
    icon: <StarIcon className="h-6 w-6" />,
    current: false,
  },
];

const RewardTiers = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Reward Tiers</h3>
        <p className="text-sm text-gray-600">
          Earn points to reach higher tiers and unlock exclusive benefits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier, index) => (
          <Card
            key={tier.name}
            className={`${
              tier.current ? "ring-2 ring-blue-500" : ""
            } h-full flex flex-col`}
          >
            <CardHeader className={`${tier.color} text-white`}>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {tier.icon}
                  {tier.name}
                </CardTitle>
                {tier.current && (
                  <div className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full">
                    Current
                  </div>
                )}
              </div>
              <CardDescription className="text-white text-opacity-80">
                {tier.points.toLocaleString()} points
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow py-4">
              <ul className="space-y-2">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {tier.current ? (
                <Button variant="outline" className="w-full">
                  Current Tier
                </Button>
              ) : index < tiers.findIndex((t) => t.current) ? (
                <Button variant="ghost" className="w-full" disabled>
                  Achieved
                </Button>
              ) : (
                <Button variant="default" className="w-full">
                  View Requirements
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RewardTiers;
