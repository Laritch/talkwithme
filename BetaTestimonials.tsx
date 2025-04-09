"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: string;
  content: string;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  feature: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: "t1",
    content: "The AI Growth Path is like having a personal coach that adapts to my needs. It's helped me identify blind spots in my stress management I never knew existed.",
    author: {
      name: "Jessica K.",
      title: "Marketing Director",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    feature: "AI Personalized Growth Path",
    rating: 5,
  },
  {
    id: "t2",
    content: "The interactive dashboard gave me insights into patterns affecting my wellness that I couldn't see before. Being able to visualize my progress has been incredibly motivating.",
    author: {
      name: "Marcus T.",
      title: "Software Engineer",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    feature: "Interactive Wellness Dashboard",
    rating: 4,
  },
  {
    id: "t3",
    content: "The collaborative tools during video sessions have transformed my experience with my coach. We can now work on exercises in real-time which has accelerated my progress.",
    author: {
      name: "Sophia R.",
      title: "Healthcare Professional",
      avatar: "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    },
    feature: "Expert Video Collaboration",
    rating: 5,
  },
];

const BetaTestimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="font-semibold text-lg">From Our Beta Testers</h3>
      </div>

      <div className="p-6 md:p-10">
        <div className="relative">
          <div className="absolute -left-3 top-0 opacity-20">
            <Quote className="h-16 w-16 text-blue-500" />
          </div>

          <div className="relative z-10">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-opacity duration-500 ${
                  index === activeIndex ? "block opacity-100" : "hidden opacity-0"
                }`}
              >
                <p className="text-lg text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                      <Image
                        src={testimonial.author.avatar}
                        alt={testimonial.author.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.author.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.author.title}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-blue-600">{testimonial.feature}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between p-4 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          size="icon"
          onClick={prevTestimonial}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>

        <div className="flex space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === activeIndex ? "bg-blue-600" : "bg-gray-300"
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextTestimonial}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  );
};

export default BetaTestimonials;
