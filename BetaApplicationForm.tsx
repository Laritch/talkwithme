"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ExperimentIcon, Sparkles, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BetaApplicationForm = () => {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormStatus("submitting");

    // Simulate form submission
    setTimeout(() => {
      setFormStatus("success");
    }, 1500);
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  if (formStatus === "success") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-lg">Application Submitted</h3>
          </div>
        </div>

        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          <h3 className="text-xl font-bold mb-2">Thank You for Applying!</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Your application for the First Access Program has been received. Our team will review your submission and get back to you within 2-3 business days.
          </p>

          <Button>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center">
          <ExperimentIcon className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="font-semibold text-lg">Apply for First Access</h3>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Tell us which features you're interested in and how you plan to use them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div className="space-y-3">
          <Label htmlFor="interest">Which features interest you the most?</Label>
          <div className="space-y-2">
            {[
              { id: "ai_path", label: "AI Personalized Growth Path" },
              { id: "wellness_dashboard", label: "Interactive Wellness Dashboard" },
              { id: "video_collab", label: "Expert Video Collaboration" },
              { id: "mobile_notifications", label: "Mobile Push Notifications" },
              { id: "group_chat", label: "Group Chat Sessions" },
            ].map((feature) => (
              <div key={feature.id} className="flex items-start space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={() => handleFeatureToggle(feature.id)}
                />
                <Label
                  htmlFor={feature.id}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="experience">Your experience level</Label>
          <Select>
            <SelectTrigger id="experience">
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (New to the platform)</SelectItem>
              <SelectItem value="intermediate">Intermediate (Regular user)</SelectItem>
              <SelectItem value="advanced">Advanced (Power user)</SelectItem>
              <SelectItem value="expert">Expert (Using daily)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="usage">How do you plan to use these features?</Label>
          <Textarea
            id="usage"
            placeholder="Please describe how you would use these features and what you hope to achieve with them..."
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="feedback">How often can you provide feedback?</Label>
          <Select>
            <SelectTrigger id="feedback">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={selectedFeatures.length === 0 || formStatus === "submitting"}
          >
            {formStatus === "submitting" ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Apply for First Access
                <Sparkles className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BetaApplicationForm;
