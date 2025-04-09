import { Crown, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumBannerProps {
  title: string;
  description: string;
}

const PremiumBanner = ({ title, description }: PremiumBannerProps) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg shadow-md">
      <div className="p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-white/20 p-3 rounded-lg mr-4">
            <Crown className="h-6 w-6 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center">
              {title}
              <Lock className="h-4 w-4 ml-2" />
            </h3>
            <p className="text-white/80 text-sm mt-1">{description}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Learn About Premium
          </Button>
          <Button className="bg-white text-indigo-700 hover:bg-white/90">
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumBanner;
