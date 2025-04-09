import React from 'react';

const PerformanceOverview = ({ data }) => {
  const {
    totalStudents,
    totalCourses,
    totalRevenue,
    averageRating,
    totalReviews,
    completionRate,
  } = data;

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Students',
      value: totalStudents.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Courses',
      value: totalCourses.toString(),
      icon: (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Average Rating',
      value: (
        <div className="flex items-center">
          <span>{averageRating.toFixed(1)}</span>
          <div className="ml-2 flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            ({totalReviews})
          </span>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Course Completion Rate',
      value: `${completionRate}%`,
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  // Recent activity mock data
  const recentActivity = [
    {
      id: 1,
      event: 'New student enrolled',
      detail: 'Sara Johnson enrolled in "Complete Web Development Bootcamp"',
      time: '2 hours ago',
    },
    {
      id: 2,
      event: 'New review',
      detail: 'Michael Smith left a 5-star review on "Advanced JavaScript Programming"',
      time: '5 hours ago',
    },
    {
      id: 3,
      event: 'Course completion',
      detail: '3 students completed "React.js for Beginners: Build Real Projects"',
      time: '1 day ago',
    },
    {
      id: 4,
      event: 'Revenue update',
      detail: 'You earned $234.50 in the past 24 hours',
      time: '1 day ago',
    },
  ];

  // Tips for instructors
  const tips = [
    {
      title: 'Optimize Your Course Title',
      description: 'Use keywords that students are searching for to improve discoverability.',
    },
    {
      title: 'Update Course Content Regularly',
      description: 'Fresh content helps maintain high ratings and student satisfaction.',
    },
    {
      title: 'Respond to Student Questions Promptly',
      description: 'Engagement boosts completion rates and leads to better reviews.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg p-6 shadow-sm`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {card.title}
                </p>
                <h3 className={`mt-2 text-2xl font-bold ${card.textColor}`}>
                  {typeof card.value === 'string' ? card.value : card.value}
                </h3>
              </div>
              <div className={`rounded-full p-3 ${card.bgColor}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{activity.event}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{activity.detail}</p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{activity.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips for Instructors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tips for Instructors</h3>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {tips.map((tip, index) => (
                <li key={index} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{tip.title}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{tip.description}</p>
                </li>
              ))}
            </ul>
            <a
              href="/instructor/resources"
              className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all instructor resources →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;
