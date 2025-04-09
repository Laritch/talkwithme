"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

const SocialAuthButtons = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false,
    twitter: false,
  });

  const handleSocialAuth = (provider: string) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }));

    // Simulate social auth
    setTimeout(() => {
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
      // In a real app, we'd redirect to OAuth provider
      console.log(`Authenticating with ${provider}...`);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialAuth("google")}
        disabled={isLoading.google}
      >
        {isLoading.google ? (
          <div className="h-4 w-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span className="sr-only md:not-sr-only md:ml-2">Google</span>
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialAuth("github")}
        disabled={isLoading.github}
      >
        {isLoading.github ? (
          <div className="h-4 w-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.85c-3.03.65-3.67-1.46-3.67-1.46-.5-1.28-1.23-1.62-1.23-1.62-1-.68.07-.67.07-.67 1.1.08 1.68 1.14 1.68 1.14.98 1.68 2.56 1.19 3.19.91.1-.71.38-1.2.7-1.47-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.43-2.22 1.14-3-.11-.28-.49-1.4.11-2.91 0 0 .93-.3 3.04 1.14a10.59 10.59 0 015.5 0c2.1-1.44 3.04-1.14 3.04-1.14.61 1.54.23 2.67.11 2.92a4.3 4.3 0 011.13 3c0 4.28-2.6 5.23-5.08 5.5.4.34.75 1.02.75 2.06v3.06c0 .29.19.63.75.52A11 11 0 0012 1.27"></path>
          </svg>
        )}
        <span className="sr-only md:not-sr-only md:ml-2">GitHub</span>
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialAuth("twitter")}
        disabled={isLoading.twitter}
      >
        {isLoading.twitter ? (
          <div className="h-4 w-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <svg
            className="mr-2 h-4 w-4 text-[#1DA1F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        )}
        <span className="sr-only md:not-sr-only md:ml-2">Twitter</span>
      </Button>
    </div>
  );
};

export default SocialAuthButtons;
