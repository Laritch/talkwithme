import { ArrowRight } from "lucide-react";
import { UserIcon, SearchIcon, CalendarIcon, ChatIcon } from "@/components/ui/icons";

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Step = ({ number, title, description, icon }: StepProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mb-4">
        {number}
      </div>
      <div className="h-12 w-12 text-blue-600 mb-2">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 max-w-[220px]">{description}</p>
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section className="py-16 bg-gray-50" id="how-it-works">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Our platform makes it easy to connect with experts and get the
          help you need in just a few simple steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          <div className="md:col-span-1">
            <Step
              number="1"
              title="Create Account"
              description="Sign up and complete your profile to get started"
              icon={<UserIcon className="w-full h-full" />}
            />
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center">
            <ArrowRight className="text-gray-400" size={24} />
          </div>

          <div className="md:col-span-1">
            <Step
              number="2"
              title="Find Experts"
              description="Browse our directory of qualified experts in specialized fields"
              icon={<SearchIcon className="w-full h-full" />}
            />
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center">
            <ArrowRight className="text-gray-400" size={24} />
          </div>

          <div className="md:col-span-1">
            <Step
              number="3"
              title="Book Sessions"
              description="Schedule and pay for consultation sessions with your chosen expert"
              icon={<CalendarIcon className="w-full h-full" />}
            />
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center">
            <ArrowRight className="text-gray-400" size={24} />
          </div>

          <div className="md:col-span-1">
            <Step
              number="4"
              title="Collaborate"
              description="Connect through chat and whiteboard tools to solve problems together"
              icon={<ChatIcon className="w-full h-full" />}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
