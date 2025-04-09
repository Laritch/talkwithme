import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExpertsSearch = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, specialty, or keyword..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white">
            <option value="">Any Specialty</option>
            <option value="stress">Stress Management</option>
            <option value="career">Career Coach</option>
            <option value="financial">Financial Advisor</option>
            <option value="relationship">Relationship Counselor</option>
            <option value="mental-health">Mental Health</option>
          </select>
          <Button className="whitespace-nowrap">
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpertsSearch;
