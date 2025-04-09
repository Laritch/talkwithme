import {
  BrainCog,
  MessageSquareShare,
  LineChart,
  Calendar,
  Shield,
  BarChart4,
} from "lucide-react";

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Feature = ({ title, description, icon }: FeatureProps) => {
  return (
    <div className="flex">
      <div className="flex-shrink-0 mr-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const AIFeaturesShowcase = () => {
  const features: FeatureProps[] = [
    {
      title: "Smart Recommendations",
      description:
        "Our AI analyzes your needs and preferences to suggest the most relevant experts and resources for your specific situation.",
      icon: <BrainCog className="h-6 w-6" />,
    },
    {
      title: "Natural Conversations",
      description:
        "Engage in natural, helpful conversations that feel human-like and personalized to your questions and concerns.",
      icon: <MessageSquareShare className="h-6 w-6" />,
    },
    {
      title: "Progress Tracking",
      description:
        "The AI monitors your progress over time and adapts recommendations based on your evolving needs and goals.",
      icon: <LineChart className="h-6 w-6" />,
    },
    {
      title: "Smart Scheduling",
      description:
        "Let the AI find the perfect time for appointments based on your availability and expert schedules.",
      icon: <Calendar className="h-6 w-6" />,
    },
    {
      title: "Data Privacy",
      description:
        "Your conversations and personal data are secure and only used to improve your experience on the platform.",
      icon: <Shield className="h-6 w-6" />,
    },
    {
      title: "Personalized Insights",
      description:
        "Receive data-driven insights about your wellbeing journey with visualizations and actionable advice.",
      icon: <BarChart4 className="h-6 w-6" />,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-6">AI-Powered Features</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Feature
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default AIFeaturesShowcase;
