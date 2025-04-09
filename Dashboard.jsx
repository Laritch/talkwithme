import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Lazy loaded components for the expert's local dashboard
import ExpertStats from './ExpertStats';
import ExpertSessions from './ExpertSessions';
import ExpertProfile from './ExpertProfile';

// Lazy import the remote instructor dashboard from the micro-frontend
const RemoteInstructorDashboard = lazy(() => {
  return import('instructorDashboard/Dashboard')
    .catch(err => {
      console.error('Failed to load remote InstructorDashboard module', err);
      return { default: () => <FallbackDashboard /> };
    });
});

// Fallback component when remote fails to load
const FallbackDashboard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-red-600">
        Instructor Dashboard Unavailable
      </h2>
      <p className="mt-2 text-gray-600">
        The instructor dashboard is currently unavailable. You can still use the basic features below.
      </p>
    </div>
  );
};

const Dashboard = () => {
  const user = useSelector(state => state.user);
  const navigate = useNavigate();
  const [remoteAvailable, setRemoteAvailable] = useState(true);

  // Ensure the user is an expert/instructor
  useEffect(() => {
    if (user && user.role !== 'expert' && user.role !== 'instructor') {
      navigate('/access-denied');
    }
  }, [user, navigate]);

  if (!user || (user.role !== 'expert' && user.role !== 'instructor')) {
    return <LoadingSpinner />;
  }

  return (
    <div className="expert-dashboard">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Expert Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your sessions, courses, and profile
        </p>
      </header>

      {/* Remote Instructor Dashboard */}
      {remoteAvailable && (
        <div className="mb-8">
          <Suspense fallback={<LoadingSpinner />}>
            <RemoteInstructorDashboard
              userId={user.id}
              onError={() => setRemoteAvailable(false)}
            />
          </Suspense>
        </div>
      )}

      {/* Local Expert Dashboard Functionality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Today's Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{user.upcomingSessions || 0}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">Unread Messages</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{user.unreadMessages || 0}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300">Course Students</p>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{user.totalStudents || 0}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Earnings This Month</p>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">${user.monthlyEarnings || 0}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition-colors">
              Create New Course
            </button>
            <button className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded border border-indigo-600 transition-colors">
              Schedule a Session
            </button>
            <button className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded border border-indigo-600 transition-colors">
              Upload New Resource
            </button>
            <button className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded border border-indigo-600 transition-colors">
              View Earnings Report
            </button>
          </div>
        </div>

        {/* Upcoming Sessions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Upcoming Sessions
          </h2>
          <div className="space-y-4">
            {user.upcomingSessions ? (
              Array(Math.min(3, user.upcomingSessions)).fill(0).map((_, index) => (
                <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-3 mb-3">
                  <p className="font-medium text-gray-800 dark:text-white">Coaching Session with Client {index + 1}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Today, {index === 0 ? '11:00' : index === 1 ? '14:30' : '16:45'} AM</p>
                  <div className="flex mt-2">
                    <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-2">Join</button>
                    <button className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Reschedule</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
            )}
            <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All Sessions →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              className="px-6 py-3 border-b-2 border-indigo-500 text-indigo-600 font-medium"
            >
              Dashboard
            </button>
            <button
              className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium"
            >
              Courses
            </button>
            <button
              className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium"
            >
              Sessions
            </button>
            <button
              className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium"
            >
              Students
            </button>
            <button
              className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium"
            >
              Earnings
            </button>
          </nav>
        </div>

        <div className="p-6">
          <Routes>
            <Route path="/" element={<ExpertStats />} />
            <Route path="/sessions" element={<ExpertSessions />} />
            <Route path="/profile" element={<ExpertProfile />} />
            <Route path="*" element={<Navigate to="." />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// These would normally be separate files, but we're including them here for brevity
const ExpertStats = () => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Your Performance</h3>
    <p>Stats content will go here...</p>
  </div>
);

const ExpertSessions = () => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Your Sessions</h3>
    <p>Sessions content will go here...</p>
  </div>
);

const ExpertProfile = () => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Your Profile</h3>
    <p>Profile editing will go here...</p>
  </div>
);

export default Dashboard;
