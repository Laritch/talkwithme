'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCourses, setSearchQuery, setCategoryFilters, setLevelFilters, resetFilters } from '@/store/slices/coursesSlice';
import CourseCard from './CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckIcon, XIcon, SearchIcon, FilterIcon } from 'lucide-react';

export interface CourseListProps {
  userId?: string; // Optional: If provided, will show enrolled courses for this user
  title?: string;
  showFilters?: boolean;
  maxCourses?: number;
  categories?: string[];
  showSearch?: boolean;
}

export default function CourseList({
  userId,
  title = 'All Courses',
  showFilters = true,
  maxCourses,
  categories = [],
  showSearch = true,
}: CourseListProps) {
  const dispatch = useAppDispatch();
  const { courses, isLoading, error, filters } = useAppSelector((state) => state.courses);
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Available filter options
  const categoryOptions = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'UI/UX Design',
    'Machine Learning',
    'DevOps',
    'Cybersecurity',
  ];

  const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];

  // Fetch courses when component mounts or filters change
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch, filters]);

  // Handle search input
  const handleSearch = () => {
    dispatch(setSearchQuery(localSearchQuery));
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    dispatch(setCategoryFilters(newCategories));
  };

  // Handle level selection
  const handleLevelChange = (level: string) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];

    dispatch(setLevelFilters(newLevels));
  };

  // Clear all filters
  const handleResetFilters = () => {
    dispatch(resetFilters());
    setLocalSearchQuery('');
  };

  // Filter courses by categories if provided as prop
  const filteredCourses = categories.length > 0
    ? courses.filter((course) => course.category && categories.includes(course.category))
    : courses;

  // Limit the number of courses if maxCourses is provided
  const displayedCourses = maxCourses
    ? filteredCourses.slice(0, maxCourses)
    : filteredCourses;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>

        {/* Mobile filter toggle */}
        {showFilters && (
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters (desktop always visible, mobile conditional) */}
        {showFilters && (
          <div className={`${isFilterOpen ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0`}>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-muted-foreground text-xs h-8"
                >
                  Clear All
                </Button>
              </div>

              {/* Applied filters */}
              {(filters.categories.length > 0 || filters.levels.length > 0) && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Applied Filters:</p>
                  <div className="flex flex-wrap gap-1">
                    {filters.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="pr-1">
                        {category}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => handleCategoryChange(category)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {filters.levels.map((level) => (
                      <Badge key={level} variant="secondary" className="pr-1">
                        {level}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => handleLevelChange(level)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories filter */}
              <Accordion type="single" collapsible defaultValue="categories">
                <AccordionItem value="categories">
                  <AccordionTrigger className="text-sm font-medium py-2">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {categoryOptions.map((category) => (
                        <div
                          key={category}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className={`h-5 w-5 p-0 ${
                              filters.categories.includes(category)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-transparent'
                            }`}
                            onClick={() => handleCategoryChange(category)}
                          >
                            {filters.categories.includes(category) && (
                              <CheckIcon className="h-3 w-3" />
                            )}
                          </Button>
                          <span>{category}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Level filter */}
                <AccordionItem value="level">
                  <AccordionTrigger className="text-sm font-medium py-2">
                    Level
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {levelOptions.map((level) => (
                        <div
                          key={level}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className={`h-5 w-5 p-0 ${
                              filters.levels.includes(level)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-transparent'
                            }`}
                            onClick={() => handleLevelChange(level)}
                          >
                            {filters.levels.includes(level) && (
                              <CheckIcon className="h-3 w-3" />
                            )}
                          </Button>
                          <span>{level}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by filter */}
                <AccordionItem value="sort">
                  <AccordionTrigger className="text-sm font-medium py-2">
                    Sort By
                  </AccordionTrigger>
                  <AccordionContent>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => console.log(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularity</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                        <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1">
          {/* Search bar */}
          {showSearch && (
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Search courses..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Button
                  variant="default"
                  size="sm"
                  className="absolute right-1 top-1 h-8"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CourseCard
                  key={`skeleton-${i}`}
                  course={{
                    id: `skeleton-${i}`,
                    title: '',
                    instructor: '',
                    price: 0,
                    thumbnail: '',
                  }}
                  isLoading={true}
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md my-4">
              <p className="text-red-700">Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(fetchCourses())}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Courses grid */}
          {!isLoading && !error && (
            <>
              {displayedCourses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No courses found. Try adjusting your filters.</p>
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
