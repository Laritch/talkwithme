import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PerformanceOverview from './components/PerformanceOverview';
import CoursesList from './components/CoursesList';
import StudentEngagement from './components/StudentEngagement';
import RevenueChart from './components/RevenueChart';
import ReviewsOverview from './components/ReviewsOverview';

const InstructorDashboard = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Get user info from Redux store
  const user = useSelector(state => state.user.profile);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // In a real app, this would be an API call
        // For demo purposes, we're using mock data that would come from an API
        const mockData = {
          user: {
            id: userId,
            name: user?.name || 'Instructor',
            avatar: user?.avatar || 'https://ui-avatars.com/api/?name=Instructor&background=0D8ABC&color=fff',
          },
          overview: {
            totalStudents: 1845,
            totalCourses: 7,
            totalRevenue: 15830.50,
            averageRating: 4.7,
            totalReviews: 426,
            completionRate: 68,
          },
          courses: [
            {
              id: 'c1',
              title: 'Complete Web Development Bootcamp',
              thumbnail: 'https://source.unsplash.com/random/640x360?code',
              students: 843,
              rating: 4.8,
              reviews: 220,
              revenue: 8450.50,
              publishedDate: '2022-06-15',
              lastUpdated: '2023-11-20',
              status: 'published',
            },
            {
              id: 'c2',
              title: 'Advanced JavaScript Programming',
              thumbnail: 'https://source.unsplash.com/random/640x360?javascript',
              students: 521,
              rating: 4.6,
              reviews: 118,
              revenue: 4280.00,
              publishedDate: '2022-09-10',
              lastUpdated: '2023-10-05',
              status: 'published',
            },
            {
              id: 'c3',
              title: 'React.js for Beginners: Build Real Projects',
              thumbnail: 'https://source.unsplash.com/random/640x360?react',
              students: 412,
              rating: 4.9,
              reviews: 88,
              revenue: 3100.00,
              publishedDate: '2023-01-22',
              lastUpdated: '2023-12-15',
              status: 'published',
            },
            {
              id: 'c4',
              title: 'Data Structures and Algorithms in Python',
              thumbnail: 'https://source.unsplash.com/random/640x360?python',
              students: 69,
              rating: 0,
              reviews: 0,
              revenue: 0,
              lastUpdated: '2023-12-30',
              status: 'draft',
            },
          ],
          engagement: {
            courseCompletions: [65, 72, 58, 80, 76, 68],
            avgWatchTime: [42, 38, 45, 50, 52, 48],
            studentSatisfaction: [85, 82, 89, 87, 91, 88],
          },
          revenue: {
            monthly: [2580, 3100, 1950, 2740, 3020, 2440, 2980, 3190, 2850, 3400, 3680, 3100],
            quarterlyGrowth: 8.5,
            yearlyGrowth: 22.4,
            courses: [
              { name: 'Web Development', value: 8450.50 },
              { name: 'JavaScript', value: 4280.00 },
              { name: 'React.js', value: 3100.00 },
            ],
          },
          reviews: {
            recent: [
              {
                id: 'r1',
                courseId: 'c1',
                courseName: 'Complete Web Development Bootcamp',
                student: 'Alex Johnson',
                rating: 5,
                comment: 'Fantastic course! The projects were challenging but very rewarding. I learned so much and can now build full-stack applications with confidence.',
                date: '2023-12-20',
                helpful: 12,
              },
              {
                id: 'r2',
                courseId: 'c2',
                courseName: 'Advanced JavaScript Programming',
                student: 'Maria Garcia',
                rating: 4,
                comment: 'Great explanations of complex JavaScript topics. Could use more exercises for practice, but overall very good content.',
                date: '2023-12-15',
                helpful: 8,
              },
              {
                id: 'r3',
                courseId: 'c3',
                courseName: 'React.js for Beginners',
                student: 'James Wilson',
                rating: 5,
                comment: 'The best React course I\'ve taken. The instructor explains concepts clearly and the projects are very practical.',
                date: '2023-12-10',
                helpful: 15,
              },
            ],
            distribution: [
              { rating: 5, count: 290 },
              { rating: 4, count: 112 },
              { rating: 3, count: 18 },
              { rating: 2, count: 4 },
              { rating: 1, count: 2 },
            ],
          },
        };

        // Simulate API delay
        setTimeout(() => {
          setDashboardData(mockData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, user]);

  // Tabs for the dashboard
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'My Courses' },
    { id: 'students', label: 'Student Engagement' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'reviews', label: 'Reviews' },
  ];

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (!dashboardData) return null;

    switch (activeTab) {
      case 'overview':
        return <PerformanceOverview data={dashboardData.overview} />;
      case 'courses':
        return <CoursesList courses={dashboardData.courses} />;
      case 'students':
        return <StudentEngagement data={dashboardData.engagement} />;
      case 'revenue':
        return <RevenueChart data={dashboardData.revenue} />;
      case 'reviews':
        return <ReviewsOverview data={dashboardData.reviews} />;
      default:
        return <PerformanceOverview data={dashboardData.overview} />;
    }
  };

  return (
    <div className="instructor-dashboard bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <img
              src={dashboardData.user.avatar}
              alt={dashboardData.user.name}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Instructor Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {dashboardData.user.name}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <a
              href="/instructor/courses/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Course
            </a>
            <a
              href="/instructor/analytics"
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Full Analytics
            </a>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default InstructorDashboard;
