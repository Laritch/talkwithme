import {
  Users2Icon,
  BrainCircuitIcon,
  BadgeCheckIcon,
  CalendarClockIcon,
  ShieldCheckIcon,
  BookOpenIcon,
} from "lucide-react";

interface BenefitProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Benefit = ({ icon, title, description }: BenefitProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="bg-blue-100 text-blue-700 p-3 rounded-lg w-fit mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const MastermindBenefits = () => {
  const benefits = [
    {
      icon: <Users2Icon className="h-6 w-6" />,
      title: "Exclusive Community",
      description:
        "Connect with a select group of motivated individuals who share your goals and challenges.",
    },
    {
      icon: <BrainCircuitIcon className="h-6 w-6" />,
      title: "Expert Facilitation",
      description:
        "Groups are led by top experts who provide guidance, structure, and specialized knowledge.",
    },
    {
      icon: <BadgeCheckIcon className="h-6 w-6" />,
      title: "Accelerated Growth",
      description:
        "Leverage collective wisdom to overcome obstacles and make faster progress toward your goals.",
    },
    {
      icon: <CalendarClockIcon className="h-6 w-6" />,
      title: "Regular Meetings",
      description:
        "Join weekly or bi-weekly sessions with consistent accountability and follow-up.",
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      title: "Safe Environment",
      description:
        "Share freely in a confidential space where trust and respect are paramount.",
    },
    {
      icon: <BookOpenIcon className="h-6 w-6" />,
      title: "Resource Sharing",
      description:
        "Access exclusive materials, tools, and resources curated for your group's focus area.",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Benefits of Joining</h2>
        <p className="text-gray-600">
          What makes our Mastermind Groups a transformative experience:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <Benefit
            key={index}
            icon={benefit.icon}
            title={benefit.title}
            description={benefit.description}
          />
        ))}
      </div>
    </div>
  );
};

export default MastermindBenefits;
