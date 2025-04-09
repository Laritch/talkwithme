import React, { useEffect, lazy, Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetails } from '../store/slices/coursesSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import VideoPlayer from '../components/video/VideoPlayer';

// Dynamically import the course player micro-frontend
// This will be loaded from a different deployment
const RemoteCoursePlayer = lazy(() => {
  // The coursePlayer is defined in our webpack Module Federation config
  return import('coursePlayer/CoursePlayer')
    .catch(err => {
      console.error('Failed to load remote CoursePlayer module', err);
      // Return a fallback component if the remote fails to load
      return { default: () => <FallbackCoursePlayer /> };
    });
});

// Fallback component when remote fails to load
const FallbackCoursePlayer = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-red-600">
        Course Player Unavailable
      </h2>
      <p className="mt-2 text-gray-600">
        The course player is currently unavailable. Please try again later.
      </p>
    </div>
  );
};

const CoursePlayerPage = () => {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const { currentCourse, loading, error } = useSelector(state => state.courses);
  const user = useSelector(state => state.user);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [remoteAvailable, setRemoteAvailable] = useState(true);

  // Fetch course details when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseDetails(courseId));
    }
  }, [dispatch, courseId]);

  // Set initial lesson when course is loaded
  useEffect(() => {
    if (currentCourse?.lessons?.length > 0 && !currentLessonId) {
      // Check if there's a saved progress for this course
      const savedProgress = currentCourse.userProgress || {};

      // Find the last lesson the user was watching or default to the first one
      const lastWatchedLesson = Object.entries(savedProgress)
        .sort(([, a], [, b]) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
        .shift();

      setCurrentLessonId(lastWatchedLesson?.[0] || currentCourse.lessons[0].id);
    }
  }, [currentCourse, currentLessonId]);

  // Handle lesson selection
  const handleLessonSelect = (lessonId) => {
    setCurrentLessonId(lessonId);
  };

  // Handle lesson completion
  const handleLessonComplete = (courseId, lessonId) => {
    console.log(`Lesson ${lessonId} completed for course ${courseId}`);
    // Additional logic can be added here, such as marking the lesson as complete in the backend
  };

  // Find the current lesson object
  const currentLesson = currentCourse?.lessons?.find(lesson => lesson.id === currentLessonId);

  // Check if loading or error occurred
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-xl font-semibold text-red-700">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <h2 className="text-xl font-semibold text-yellow-700">Course Not Found</h2>
        <p className="text-yellow-600">The requested course could not be found.</p>
      </div>
    );
  }

  return (
    <div className="course-player-page">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {currentCourse.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {currentCourse.instructor}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2">
          {/* Video Player Section */}
          <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
            {currentLesson?.videoUrl ? (
              <VideoPlayer
                src={currentLesson.videoUrl}
                courseId={courseId}
                lessonId={currentLessonId}
                poster={currentLesson.thumbnail || currentCourse.thumbnail}
                onComplete={handleLessonComplete}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-800 text-white">
                No video available for this lesson
              </div>
            )}
          </div>

          {/* Lesson Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {currentLesson?.title || 'Lesson Content'}
            </h2>

            <div className="prose dark:prose-invert max-w-none">
              {currentLesson?.description || 'No content available for this lesson.'}
            </div>
          </div>

          {/* Remote Course Player */}
          {remoteAvailable && (
            <div className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <RemoteCoursePlayer
                  courseId={courseId}
                  lessonId={currentLessonId}
                  userId={user.id}
                  onError={() => setRemoteAvailable(false)}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Sidebar - Course Contents */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-white">Course Contents</h3>
            </div>

            <div className="divide-y dark:divide-gray-700">
              {currentCourse.lessons?.map((lesson, index) => {
                const isActive = lesson.id === currentLessonId;
                const isCompleted = lesson.completed;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {isCompleted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {lesson.title}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="mr-3">{lesson.duration || '00:00'}</span>
                          <span>{lesson.type || 'Video'}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
