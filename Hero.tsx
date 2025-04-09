import { Button } from "@/components/ui/button";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get Expert Help When You Need It Most
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Connect with qualified professionals who can guide you through your challenges and help you achieve your goals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Find an Expert
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
                <Link href="#how-it-works">Learn How It Works</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-blue-600 font-semibold text-xl mb-4">
                Quick Connect Form
              </h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="issue" className="block text-gray-700 mb-2">
                    What Do You Need Help With?
                  </label>
                  <select
                    id="issue"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select a category</option>
                    <option value="stress">Stress Management</option>
                    <option value="anxiety">Anxiety</option>
                    <option value="career">Career Advice</option>
                    <option value="relationships">Relationships</option>
                    <option value="finances">Financial Planning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Connect with an Expert
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
