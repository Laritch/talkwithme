"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Gift, ShieldCheck, Palette, Clock, TShirt } from "lucide-react";

interface SwagItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  pointsCost: number;
  category: "digital" | "physical";
  type: "badge" | "profile" | "merchandise" | "feature";
  inventory?: number;
  estimatedDelivery?: string;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  popularity: "low" | "medium" | "high" | "trending";
}

const SwagRewards = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const userPoints = 1250;

  const swagItems: SwagItem[] = [
    // Digital Items
    {
      id: "s1",
      name: "Gold Contributor Badge",
      description: "A prestigious badge that appears on your profile, showcasing your valuable contributions to the community.",
      image: "https://same-assets.com/images/badge-gold.png",
      pointsCost: 300,
      category: "digital",
      type: "badge",
      availability: "in_stock",
      popularity: "high",
    },
    {
      id: "s2",
      name: "Premium Profile Background",
      description: "Customize your profile with exclusive premium background themes.",
      image: "https://same-assets.com/images/profile-bg.png",
      pointsCost: 450,
      category: "digital",
      type: "profile",
      availability: "in_stock",
      popularity: "trending",
    },
    {
      id: "s3",
      name: "Verified Member Status",
      description: "Get a verified checkmark next to your name, indicating your commitment to the platform.",
      image: "https://same-assets.com/images/verified-status.png",
      pointsCost: 1000,
      category: "digital",
      type: "badge",
      availability: "in_stock",
      popularity: "high",
    },
    {
      id: "s4",
      name: "Priority Support Access",
      description: "Jump to the front of the queue when you need assistance from our support team.",
      image: "https://same-assets.com/images/priority-support.png",
      pointsCost: 750,
      category: "digital",
      type: "feature",
      availability: "in_stock",
      popularity: "medium",
    },

    // Physical Items
    {
      id: "s5",
      name: "Branded Notebook & Pen Set",
      description: "High-quality notebook and pen with Stressedabit branding to help you track your progress offline.",
      image: "https://same-assets.com/images/notebook-set.png",
      pointsCost: 1200,
      category: "physical",
      type: "merchandise",
      inventory: 42,
      estimatedDelivery: "2-3 weeks",
      availability: "in_stock",
      popularity: "medium",
    },
    {
      id: "s6",
      name: "Mindfulness Meditation Cushion",
      description: "Premium meditation cushion designed for comfort during your wellness practice.",
      image: "https://same-assets.com/images/meditation-cushion.png",
      pointsCost: 2000,
      category: "physical",
      type: "merchandise",
      inventory: 15,
      estimatedDelivery: "2-3 weeks",
      availability: "low_stock",
      popularity: "high",
    },
    {
      id: "s7",
      name: "Wellness Journey T-Shirt",
      description: "Soft, premium cotton t-shirt with inspirational design exclusive to platform members.",
      image: "https://same-assets.com/images/wellness-tshirt.png",
      pointsCost: 1500,
      category: "physical",
      type: "merchandise",
      inventory: 0,
      estimatedDelivery: "3-4 weeks",
      availability: "out_of_stock",
      popularity: "trending",
    },
    {
      id: "s8",
      name: "Growth Mindset Water Bottle",
      description: "Eco-friendly water bottle with motivational markers to keep you hydrated throughout the day.",
      image: "https://same-assets.com/images/water-bottle.png",
      pointsCost: 900,
      category: "physical",
      type: "merchandise",
      inventory: 28,
      estimatedDelivery: "2-3 weeks",
      availability: "in_stock",
      popularity: "low",
    },
  ];

  const getAvailabilityBadge = (availability: SwagItem["availability"]) => {
    switch (availability) {
      case "in_stock":
        return <Badge className="bg-green-500">In Stock</Badge>;
      case "low_stock":
        return <Badge className="bg-amber-500">Low Stock</Badge>;
      case "out_of_stock":
        return <Badge className="bg-gray-500">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const getPopularityBadge = (popularity: SwagItem["popularity"]) => {
    if (popularity === "trending") {
      return <Badge className="bg-pink-500">Trending</Badge>;
    } else if (popularity === "high") {
      return <Badge className="bg-blue-500">Popular</Badge>;
    }
    return null;
  };

  const getCategoryIcon = (type: SwagItem["type"]) => {
    switch (type) {
      case "badge":
        return <Award className="h-5 w-5 text-purple-500" />;
      case "profile":
        return <Palette className="h-5 w-5 text-blue-500" />;
      case "feature":
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case "merchandise":
        return <TShirt className="h-5 w-5 text-amber-500" />;
      default:
        return <Gift className="h-5 w-5 text-gray-500" />;
    }
  };

  const filterItemsByCategory = (category: "digital" | "physical") => {
    return swagItems.filter((item) => item.category === category);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Gift className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-semibold text-lg">Available Rewards</h3>
          </div>
          <div className="flex items-center">
            <Award className="h-5 w-5 text-amber-500 mr-2" />
            <span className="font-semibold text-amber-600">{userPoints} Points Available</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="digital" className="w-full">
        <div className="px-5 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="digital">Digital Rewards</TabsTrigger>
            <TabsTrigger value="physical">Physical Merchandise</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="digital" className="p-5 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterItemsByCategory("digital").map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                  selectedItem === item.id
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200"
                } ${userPoints < item.pointsCost ? "opacity-70" : ""}`}
                onClick={() => setSelectedItem(item.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getCategoryIcon(item.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-blue-600 font-semibold">
                      {item.pointsCost} points
                    </div>
                    <div className="flex space-x-2">
                      {getPopularityBadge(item.popularity)}
                      {getAvailabilityBadge(item.availability)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant={userPoints >= item.pointsCost ? "default" : "outline"}
                      className="w-full"
                      disabled={userPoints < item.pointsCost}
                    >
                      {userPoints >= item.pointsCost ? "Redeem Now" : "Not Enough Points"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="physical" className="p-5 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterItemsByCategory("physical").map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                  selectedItem === item.id
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200"
                } ${userPoints < item.pointsCost || item.availability === "out_of_stock" ? "opacity-70" : ""}`}
                onClick={() => setSelectedItem(item.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between mb-3">
                    <div className="flex space-x-2">
                      {getPopularityBadge(item.popularity)}
                      {getAvailabilityBadge(item.availability)}
                    </div>
                    <div className="text-sm text-blue-600 font-semibold">
                      {item.pointsCost} points
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full rounded"
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>

                      {item.estimatedDelivery && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Est. Delivery: {item.estimatedDelivery}
                        </div>
                      )}

                      {item.availability !== "out_of_stock" && item.inventory !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.inventory} remaining
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant={userPoints >= item.pointsCost && item.availability !== "out_of_stock" ? "default" : "outline"}
                      className="w-full"
                      disabled={userPoints < item.pointsCost || item.availability === "out_of_stock"}
                    >
                      {item.availability === "out_of_stock"
                        ? "Out of Stock"
                        : userPoints >= item.pointsCost
                        ? "Redeem Now"
                        : "Not Enough Points"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SwagRewards;
