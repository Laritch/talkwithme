"use client";

import Image from "next/image";
import { Calendar, Clock, Video, MessageSquare, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, addDays } from "date-fns";

interface Session {
  id: string;
  expertName: string;
  expertAvatar: string;
  expertTitle: string;
  date: Date;
  time: string;
  duration: string;
  type: "video" | "chat";
}

const UpcomingSessions = () => {
  const today = new Date();

  const upcomingSessions: Session[] = [
    {
      id: "s1",
      expertName: "Dr. Sarah Johnson",
      expertAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      expertTitle: "Stress Management Specialist",
      date: addDays(today, 1),
      time: "10:00 AM - 11:00 AM",
      duration: "60 min",
      type: "video",
    },
    {
      id: "s2",
      expertName: "Michael Chen",
      expertAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      expertTitle: "Career Development Coach",
      date: addDays(today, 3),
      time: "2:00 PM - 3:00 PM",
      duration: "60 min",
      type: "video",
    },
    {
      id: "s3",
      expertName: "Lisa Patel, CFP",
      expertAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      expertTitle: "Financial Wellness Advisor",
      date: addDays(today, 5),
      time: "4:30 PM - 5:30 PM",
      duration: "60 min",
      type: "chat",
    },
  ];

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return format(date, "EEE, MMM d");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Upcoming Sessions</h3>
          <Button variant="outline" size="sm">
            Book New Session
          </Button>
        </div>
      </div>

      {upcomingSessions.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-4 flex-shrink-0">
                  <Image
                    src={session.expertAvatar}
                    alt={session.expertName}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{session.expertName}</h4>
                      <p className="text-sm text-gray-600">{session.expertTitle}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem>Cancel Session</DropdownMenuItem>
                        <DropdownMenuItem>Contact Expert</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(session.date)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {session.time}
                    </div>
                    <div className="flex items-center">
                      {session.type === "video" ? (
                        <Video className="h-4 w-4 mr-1 text-blue-500" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-1 text-green-500" />
                      )}
                      {session.type === "video" ? "Video Call" : "Text Chat"}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {session.duration}
                    </div>
                    <Button size="sm" className="h-8">
                      Join Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">You don't have any upcoming sessions scheduled.</p>
          <Button>Book a Session</Button>
        </div>
      )}

      <div className="border-t border-gray-200 p-4 text-center">
        <Button variant="link" className="text-sm text-blue-600">
          View all scheduled sessions
        </Button>
      </div>
    </div>
  );
};

export default UpcomingSessions;
