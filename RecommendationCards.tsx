import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BookIcon, HeartHandshakeIcon, BookMarkedIcon } from "lucide-react";

interface Recommendation {
  type: "expert" | "resource" | "article";
  title: string;
  description?: string;
  image?: string;
  buttonText: string;
  icon: React.ReactNode;
}

const RecommendationCards = () => {
  // Mock recommendations data
  const recommendations: Recommendation[] = [
    {
      type: "expert",
      title: "Dr. Sarah Johnson - Stress Management",
      description: "Specialized in anxiety & stress reduction techniques",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      buttonText: "Book Session",
      icon: <HeartHandshakeIcon className="h-5 w-5 text-purple-600" />,
    },
    {
      type: "resource",
      title: "Mindfulness Meditation Guide",
      description: "Simple 10-minute daily exercises for stress relief",
      buttonText: "View Guide",
      icon: <BookIcon className="h-5 w-5 text-green-600" />,
    },
    {
      type: "article",
      title: "Understanding Workplace Anxiety",
      description: "Research-backed approaches to managing anxiety at work",
      buttonText: "Read Article",
      icon: <BookMarkedIcon className="h-5 w-5 text-blue-600" />,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <h3 className="font-semibold flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path d="M16.5 7.5h-9v9h9v-9z" />
            <path
              fillRule="evenodd"
              d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z"
              clipRule="evenodd"
            />
          </svg>
          Personalized Recommendations
        </h3>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Based on your conversations and profile, we recommend:
        </p>

        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex">
              {rec.image ? (
                <div className="flex-shrink-0 mr-3">
                  <Image
                    src={rec.image}
                    alt={rec.title}
                    width={50}
                    height={50}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 mr-3 h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {rec.icon}
                </div>
              )}

              <div className="flex-grow">
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                </div>
                {rec.description && (
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                )}
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant={rec.type === "expert" ? "default" : "outline"}
                    className="text-xs px-2 py-0 h-7"
                  >
                    {rec.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center mt-4">
          <Button variant="link" className="text-sm text-blue-600">
            View All Recommendations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCards;
