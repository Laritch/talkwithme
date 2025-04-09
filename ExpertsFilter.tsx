import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const ExpertsFilter = () => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-semibold text-lg mb-4">Filters</h3>

      <div className="space-y-6">
        {/* Specialities */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">Specialties</h4>
          <div className="space-y-2">
            {[
              "Stress Management",
              "Anxiety",
              "Depression",
              "Career Coaching",
              "Financial Planning",
              "Relationship Counseling",
              "Life Coaching",
              "Mental Health",
              "Physical Wellness"
            ].map((specialty) => (
              <div key={specialty} className="flex items-center">
                <Checkbox id={specialty.toLowerCase().replace(/\s+/g, '-')} />
                <label
                  htmlFor={specialty.toLowerCase().replace(/\s+/g, '-')}
                  className="ml-2 text-sm text-gray-700"
                >
                  {specialty}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">Availability</h4>
          <div className="space-y-2">
            {[
              "Available Today",
              "Available This Week",
              "Available Weekends",
              "Available Evenings"
            ].map((availability) => (
              <div key={availability} className="flex items-center">
                <Checkbox id={availability.toLowerCase().replace(/\s+/g, '-')} />
                <label
                  htmlFor={availability.toLowerCase().replace(/\s+/g, '-')}
                  className="ml-2 text-sm text-gray-700"
                >
                  {availability}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">Price Range (per hour)</h4>
          <div>
            <div className="mb-6">
              <Slider
                defaultValue={[50, 200]}
                min={0}
                max={500}
                step={10}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div>$0</div>
              <div>$500+</div>
            </div>
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">Experience Level</h4>
          <div className="space-y-2">
            {[
              "Entry Level (1-3 years)",
              "Intermediate (3-5 years)",
              "Experienced (5-10 years)",
              "Expert (10+ years)"
            ].map((level) => (
              <div key={level} className="flex items-center">
                <Checkbox id={level.toLowerCase().replace(/\s+/g, '-')} />
                <label
                  htmlFor={level.toLowerCase().replace(/\s+/g, '-')}
                  className="ml-2 text-sm text-gray-700"
                >
                  {level}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <Checkbox id={`rating-${rating}`} />
                <label
                  htmlFor={`rating-${rating}`}
                  className="ml-2 text-sm text-gray-700 flex items-center"
                >
                  {rating}+ Stars
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <Button className="w-full">Apply Filters</Button>
        <Button variant="outline" className="w-full">Reset Filters</Button>
      </div>
    </div>
  );
};

export default ExpertsFilter;
