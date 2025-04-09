"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  BrainCog,
  ZapIcon,
  PanelTop,
  MoveUpRight,
  Smartphone,
  MessageSquarePlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface BetaFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "early_access" | "invite_only" | "coming_soon";
  estimatedRelease?: string;
  tags?: string[];
}

const BetaFeaturesList = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features: BetaFeature[] = [
    {
      id: "bf1",
      title: "AI Personalized Growth Path",
      description: "Our advanced AI analyzes your goals, preferences, and progress to create a personalized growth path that adapts as you progress.",
      icon: <BrainCog className="h-10 w-10" />,
      status: "early_access",
      tags: ["AI", "Personalization", "Growth"],
    },
    {
      id: "bf2",
      title: "Interactive Wellness Dashboard",
      description: "A comprehensive dashboard that visualizes your wellness journey across mental, physical, and emotional dimensions with interactive charts.",
      icon: <PanelTop className="h-10 w-10" />,
      status: "early_access",
      tags: ["Analytics", "Wellness", "Visualization"],
    },
    {
      id: "bf3",
      title: "Expert Video Collaboration",
      description: "Enhanced video sessions with collaborative whiteboarding, document sharing, and real-time notes.",
      icon: <MoveUpRight className="h-10 w-10" />,
      status: "invite_only",
      estimatedRelease: "Next month",
      tags: ["Collaboration", "Video", "Productivity"],
    },
    {
      id: "bf4",
      title: "Mobile Push Notifications",
      description: "Smart notifications that adapt to your schedule and preferences, with customizable reminders and alerts.",
      icon: <Smartphone className="h-10 w-10" />,
      status: "coming_soon",
      estimatedRelease: "2 months",
      tags: ["Mobile", "Notifications", "Reminders"],
    },
    {
      id: "bf5",
      title: "Group Chat Sessions",
      description: "Join moderated group chats with people facing similar challenges, guided by expert facilitators.",
      icon: <MessageSquarePlus className="h-10 w-10" />,
      status: "coming_soon",
      estimatedRelease: "3 months",
      tags: ["Community", "Group Sessions", "Support"],
    },
  ];

  const getStatusBadge = (status: BetaFeature["status"]) => {
    switch (status) {
      case "early_access":
        return <Badge className="bg-blue-500">Early Access</Badge>;
      case "invite_only":
        return <Badge className="bg-purple-500">Invite Only</Badge>;
      case "coming_soon":
        return <Badge className="bg-amber-500">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
          <h3 className="font-semibold text-lg">Features in Development</h3>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Get early access to these cutting-edge features and help shape their development through your feedback.
        </p>
      </div>

      <div className="p-5 space-y-5">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className={`cursor-pointer transition-all hover:shadow ${
              selectedFeature === feature.id ? "border-blue-500 shadow" : ""
            }`}
            onClick={() => setSelectedFeature(feature.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`p-2 mr-3 rounded-lg bg-blue-50 text-blue-600`}>
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    {feature.estimatedRelease && (
                      <CardDescription>
                        Expected release: {feature.estimatedRelease}
                      </CardDescription>
                    )}
                  </div>
                </div>
                {getStatusBadge(feature.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{feature.description}</p>

              {feature.tags && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {feature.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-gray-50"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={feature.status === "coming_soon"}
              >
                {feature.status === "early_access"
                  ? "Join Beta"
                  : feature.status === "invite_only"
                  ? "Request Invite"
                  : "Notify Me"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-2">
          New features are added to the First Access Program regularly
        </p>
        <Button variant="outline" className="text-sm">
          View all upcoming features
          <ZapIcon className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default BetaFeaturesList;
