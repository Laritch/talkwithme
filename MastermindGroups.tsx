import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Users, Star } from "lucide-react";

interface MastermindGroup {
  id: string;
  title: string;
  category: string;
  description: string;
  facilitator: {
    name: string;
    title: string;
    image: string;
  };
  meetingFrequency: string;
  meetingTime: string;
  memberCount: number;
  totalSpots: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  tierLevel: "Silver" | "Gold" | "Platinum";
}

const mastermindGroups: MastermindGroup[] = [
  {
    id: "mg1",
    title: "Career Accelerator",
    category: "Career Development",
    description:
      "Strategic career planning and advancement tactics for mid-career professionals looking to take their next big step.",
    facilitator: {
      name: "Michael Chen",
      title: "Career Development Coach",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    meetingFrequency: "Weekly",
    meetingTime: "Tuesdays, 7-9pm EST",
    memberCount: 8,
    totalSpots: 10,
    rating: 4.9,
    reviewCount: 28,
    tags: ["Career", "Leadership", "Professional Growth"],
    tierLevel: "Silver",
  },
  {
    id: "mg2",
    title: "Financial Freedom",
    category: "Financial Planning",
    description:
      "Master the art of personal finance with strategies for debt elimination, investing, and building wealth for long-term security.",
    facilitator: {
      name: "Lisa Patel, CFP",
      title: "Financial Wellness Advisor",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    meetingFrequency: "Bi-weekly",
    meetingTime: "Saturdays, 10am-12pm EST",
    memberCount: 6,
    totalSpots: 8,
    rating: 4.8,
    reviewCount: 19,
    tags: ["Personal Finance", "Investing", "Financial Planning"],
    tierLevel: "Gold",
  },
  {
    id: "mg3",
    title: "Anxiety Management",
    category: "Mental Health",
    description:
      "Evidence-based approaches to managing anxiety and building resilience in both personal and professional settings.",
    facilitator: {
      name: "Dr. Sarah Johnson",
      title: "Stress Management Specialist",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    meetingFrequency: "Weekly",
    meetingTime: "Mondays, 6-7:30pm EST",
    memberCount: 5,
    totalSpots: 6,
    rating: 4.9,
    reviewCount: 31,
    tags: ["Anxiety", "Mental Health", "Resilience"],
    tierLevel: "Silver",
  },
  {
    id: "mg4",
    title: "Executive Leadership",
    category: "Leadership",
    description:
      "Advanced leadership strategies for senior executives looking to enhance their influence and organizational impact.",
    facilitator: {
      name: "Robert K.",
      title: "Executive Coach & Former CEO",
      image:
        "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    meetingFrequency: "Bi-weekly",
    meetingTime: "Thursdays, 7-9pm EST",
    memberCount: 7,
    totalSpots: 8,
    rating: 4.7,
    reviewCount: 22,
    tags: ["Executive Leadership", "Corporate Strategy", "Management"],
    tierLevel: "Platinum",
  },
];

const getTierBadge = (tier: "Silver" | "Gold" | "Platinum") => {
  let color = "";
  switch (tier) {
    case "Silver":
      color = "bg-gray-300 text-gray-800";
      break;
    case "Gold":
      color = "bg-yellow-500 text-white";
      break;
    case "Platinum":
      color = "bg-gradient-to-r from-slate-500 to-slate-800 text-white";
      break;
  }
  return (
    <Badge className={`${color} uppercase text-xs font-medium`}>{tier} Tier</Badge>
  );
};

const MastermindGroups = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Available Groups</h2>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Join a group that aligns with your goals and interests:
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by:</span>
            <select className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white">
              <option value="">All Categories</option>
              <option value="career">Career Development</option>
              <option value="finance">Financial Planning</option>
              <option value="mental-health">Mental Health</option>
              <option value="leadership">Leadership</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mastermindGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{group.title}</h3>
                    {getTierBadge(group.tierLevel)}
                  </div>
                  <p className="text-sm text-blue-600">{group.category}</p>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium ml-1">{group.rating}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({group.reviewCount} reviews)
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-sm">{group.description}</p>

              <div className="flex items-center mb-4">
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                  <Image
                    src={group.facilitator.image}
                    alt={group.facilitator.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {group.facilitator.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {group.facilitator.title}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {group.meetingFrequency}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {group.meetingTime}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  {group.memberCount}/{group.totalSpots} Members
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-5">
                {group.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gray-50 text-gray-700 text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">Join Group</Button>
                <Button variant="outline" className="flex-1">Learn More</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline">View All Available Groups</Button>
      </div>
    </div>
  );
};

export default MastermindGroups;
