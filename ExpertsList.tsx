import React from "react";
import { StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface Expert {
  id: string;
  name: string;
  title: string;
  image: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  availability: string;
  description: string;
  isVerified: boolean;
}

const MOCK_EXPERTS: Expert[] = [
  {
    id: "e1",
    name: "Dr. Sarah Johnson",
    title: "Stress Management Specialist",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
    specialties: ["Stress Management", "Anxiety", "Depression"],
    rating: 4.9,
    reviewCount: 124,
    hourlyRate: 120,
    availability: "Available Today",
    description: "Dr. Johnson has helped hundreds of clients overcome stress and anxiety with evidence-based techniques.",
    isVerified: true,
  },
  {
    id: "e2",
    name: "Michael Chen",
    title: "Career Development Coach",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
    specialties: ["Career Coaching", "Leadership", "Work-Life Balance"],
    rating: 4.7,
    reviewCount: 98,
    hourlyRate: 95,
    availability: "Available This Week",
    description: "With 12+ years of experience in HR and talent development, Michael helps professionals reach their career goals.",
    isVerified: true,
  },
  {
    id: "e3",
    name: "Lisa Patel, CFP",
    title: "Financial Wellness Advisor",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
    specialties: ["Financial Planning", "Debt Management", "Budgeting"],
    rating: 4.8,
    reviewCount: 67,
    hourlyRate: 110,
    availability: "Available Weekends",
    description: "Lisa specializes in helping clients overcome financial stress through personalized planning and education.",
    isVerified: true,
  },
  {
    id: "e4",
    name: "Dr. James Wilson",
    title: "Relationship Therapist",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
    specialties: ["Relationship Counseling", "Communication", "Conflict Resolution"],
    rating: 4.6,
    reviewCount: 82,
    hourlyRate: 135,
    availability: "Available Evenings",
    description: "Dr. Wilson helps couples and individuals navigate relationship challenges with compassion and expertise.",
    isVerified: false,
  },
  {
    id: "e5",
    name: "Sophia Rodriguez",
    title: "Life Coach & Mindfulness Expert",
    image: "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
    specialties: ["Life Coaching", "Mindfulness", "Personal Growth"],
    rating: 4.9,
    reviewCount: 115,
    hourlyRate: 90,
    availability: "Available Today",
    description: "Sophia combines mindfulness practices with practical life coaching to help clients find balance and purpose.",
    isVerified: true,
  },
];

const ExpertCard: React.FC<{ expert: Expert }> = ({ expert }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start">
          <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4 flex-shrink-0">
            <Image
              src={expert.image}
              alt={expert.name}
              width={64}
              height={64}
              className="object-cover"
            />
            {expert.isVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{expert.name}</h3>
                <p className="text-sm text-gray-600">{expert.title}</p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center text-yellow-500 mr-1">
                  <StarIcon className="h-4 w-4 fill-current" />
                </div>
                <span className="text-sm font-medium">{expert.rating}</span>
                <span className="text-xs text-gray-500 ml-1">({expert.reviewCount})</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {expert.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-700">{expert.description}</p>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold text-gray-900">${expert.hourlyRate}</span>
            <span className="text-sm text-gray-600">/hour</span>
          </div>
          <span className="text-sm text-green-600 font-medium">{expert.availability}</span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="flex-1">Book Session</Button>
          <Button variant="outline" className="flex-1">
            <Link href={`/experts/${expert.id}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

const ExpertsList = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">Showing {MOCK_EXPERTS.length} experts</div>
        <select className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white">
          <option value="recommended">Recommended</option>
          <option value="rating-high">Highest Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="availability">Availability</option>
        </select>
      </div>

      <div className="space-y-4">
        {MOCK_EXPERTS.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </div>
  );
};

export default ExpertsList;
