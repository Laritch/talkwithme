import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Components
import Layout from '../../../components/Layout';
import VideoPlayer from '../../../components/course/VideoPlayer';

// API Services
import { coursesAPI } from '../../../services/api';

export default function LearnPage() {
  const router = useRouter();
  const { id: courseId, lectureId } = router.query;

  const [course, setCourse] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [lectureProgress, setLectureProgress] = useState({ currentTime: 0, completed: false });

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;

      setIsLoading(true);
      setError('');

      try {
        const response = await coursesAPI.getCourse(courseId);
        setCourse(response.data);

        // Calculate course progress
        const completedLectures = response.data.completedLectures || [];
        const totalLectures = response.data.sections.reduce(
          (total, section) => total + section.lectures.length,
          0
        );

        setProgress({
          completed: completedLectures.length,
          total: totalLectures,
          percent: totalLectures > 0 ? Math.round((completedLectures.length / totalLectures) * 100) : 0
        });

        // If lectureId is provided in the URL, find that lecture
        if (lectureId) {
          let foundSection = null;
          let foundLecture = null;

          for (const section of response.data.sections) {
            const lecture = section.lectures.find(lec => lec.id === lectureId);
            if (lecture) {
              foundSection = section;
              foundLecture = lecture;
              break;
            }
          }

          if (foundSection && foundLecture) {
            setCurrentSection(foundSection);
            setCurrentLecture(foundLecture);

            // Get lecture progress data
            try {
              const lectureResponse = await coursesAPI.getCourseLecture(courseId, foundLecture.id);
              setLectureProgress({
                currentTime: lectureResponse.data.progress?.currentTime || 0,
                completed: lectureResponse.data.progress?.completed || false
              });
            } catch (lectureErr) {
              console.error('Error fetching lecture progress:', lectureErr);
              // Non-critical error, so don't update main error state
            }
          }
        } else {
          // If no lectureId, default to first lecture
          const firstSection = response.data.sections[0];
          const firstLecture = firstSection?.lectures[0];

          if (firstSection && firstLecture) {
            setCurrentSection(firstSection);
            setCurrentLecture(firstLecture);

            // Update URL with the first lecture
            router.replace(`/courses/${courseId}/learn?lectureId=${firstLecture.id}`, undefined, { shallow: true });

            // Get lecture progress data
            try {
              const lectureResponse = await coursesAPI.getCourseLecture(courseId, firstLecture.id);
              setLectureProgress({
                currentTime: lectureResponse.data.progress?.currentTime || 0,
                completed: lectureResponse.data.progress?.completed || false
              });
            } catch (lectureErr) {
              console.error('Error fetching lecture progress:', lectureErr);
              // Non-critical error, so don't update main error state
            }
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(
          err.response?.data?.message ||
          'Failed to load course. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, lectureId, router]);

  // Handle lecture change
  const changeLecture = async (sectionId, lecId) => {
    if (!courseId || !sectionId || !lecId) return;

    const section = course.sections.find(s => s.id === sectionId);
    const lecture = section?.lectures.find(l => l.id === lecId);

    if (section && lecture) {
      setCurrentSection(section);
      setCurrentLecture(lecture);

      // Update URL
      router.replace(`/courses/${courseId}/learn?lectureId=${lecId}`, undefined, { shallow: true });

      // Get lecture progress data
      try {
        const lectureResponse = await coursesAPI.getCourseLecture(courseId, lecId);
        setLectureProgress({
          currentTime: lectureResponse.data.progress?.currentTime || 0,
          completed: lectureResponse.data.progress?.completed || false
        });
      } catch (err) {
        console.error('Error fetching lecture progress:', err);
        // Non-critical error, so we can continue
      }

      // On mobile, close the curriculum menu
      if (window.innerWidth < 768) {
        setIsMenuOpen(false);
      }
    }
  };

  // Mark lecture as complete
  const markLectureComplete = async () => {
    if (!courseId || !currentLecture) return;

    try {
      await coursesAPI.markLectureComplete(courseId, currentLecture.id);

      // Update progress
      setProgress(prev => ({
        ...prev,
        completed: lectureProgress.completed ? prev.completed : prev.completed + 1,
        percent: prev.total > 0
          ? Math.round(((lectureProgress.completed ? prev.completed : prev.completed + 1) / prev.total) * 100)
          : 0
      }));

      setLectureProgress(prev => ({ ...prev, completed: true }));
    } catch (err) {
      console.error('Error marking lecture as complete:', err);
      // Non-critical error, so we can continue
    }
  };

  // Handle video player events
  const handleVideoProgress = (currentTime, duration) => {
    // Save progress every 5 seconds
    if (Math.abs(currentTime - lectureProgress.currentTime) >= 5) {
      setLectureProgress(prev => ({ ...prev, currentTime }));

      // Only call API if not already completed
      if (!lectureProgress.completed) {
        // Update lecture progress on server
        coursesAPI.getCourseLecture(courseId, currentLecture.id, { currentTime })
          .catch(err => console.error('Error updating lecture progress:', err));
      }
    }

    // Auto-mark as complete when 90% watched
    if (!lectureProgress.completed && duration && currentTime / duration >= 0.9) {
      markLectureComplete();
    }
  };

  // Navigate to next lecture
  const navigateToNextLecture = () => {
    if (!course || !currentLecture || !currentSection) return;

    // Find current section and lecture indexes
    const sectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
    const lectureIndex = currentSection.lectures.findIndex(l => l.id === currentLecture.id);

    if (sectionIndex === -1 || lectureIndex === -1) return;

    // Check if there's a next lecture in the same section
    if (lectureIndex < currentSection.lectures.length - 1) {
      const nextLecture = currentSection.lectures[lectureIndex + 1];
      changeLecture(currentSection.id, nextLecture.id);
      return;
    }

    // Check if there's a next section
    if (sectionIndex < course.sections.length - 1) {
      const nextSection = course.sections[sectionIndex + 1];
      if (nextSection.lectures.length > 0) {
        const firstLecture = nextSection.lectures[0];
        changeLecture(nextSection.id, firstLecture.id);
        return;
      }
    }

    // If we reach here, we're at the end of the course
    alert('Congratulations! You have reached the end of the course.');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  {error || 'Course not found. Please check the URL and try again.'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/student/dashboard" className="flex-shrink-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="ml-2 text-gray-700 dark:text-gray-200 hidden sm:block">Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center">
              <div className="text-right mr-4 hidden sm:block">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {course.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {progress.percent}% complete
                </p>
              </div>

              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-40 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress.percent}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {progress.completed}/{progress.total}
                </span>
              </div>

              {/* Mobile menu button */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} fixed inset-0 z-40 sm:hidden`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMenuOpen(false)}></div>

        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col py-6 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
              <div className="px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Course Content</h2>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="sr-only">Close panel</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-6 relative flex-1 px-4 sm:px-6">
                <div className="flex flex-col h-full">
                  {/* Course progress on mobile */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${progress.percent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progress.percent}% complete
                    </p>
                  </div>

                  {/* Course curriculum (mobile) */}
                  <div className="space-y-4 overflow-y-auto">
                    {course.sections.map((section) => (
                      <div key={section.id} className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {section.title}
                        </h4>
                        <ul className="space-y-1">
                          {section.lectures.map((lecture) => {
                            const isActive = currentLecture?.id === lecture.id;
                            const isCompleted = course.completedLectures?.includes(lecture.id);

                            return (
                              <li key={lecture.id}>
                                <button
                                  onClick={() => changeLecture(section.id, lecture.id)}
                                  className={`w-full flex items-center p-2 text-sm rounded-md ${
                                    isActive
                                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="mr-2 flex-shrink-0">
                                    {isCompleted ? (
                                      <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    ) : (
                                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </span>
                                  <span className="truncate flex-grow text-left">{lecture.title}</span>
                                  {lecture.duration && (
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                      {Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden sm:flex sm:flex-shrink-0">
          <div className="w-64 md:w-80 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="px-4 py-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Course Content</h3>

              <div className="mt-4 space-y-4">
                {course.sections.map((section) => (
                  <div key={section.id} className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.lectures.map((lecture) => {
                        const isActive = currentLecture?.id === lecture.id;
                        const isCompleted = course.completedLectures?.includes(lecture.id);

                        return (
                          <li key={lecture.id}>
                            <button
                              onClick={() => changeLecture(section.id, lecture.id)}
                              className={`w-full flex items-center p-2 text-sm rounded-md ${
                                isActive
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="mr-2 flex-shrink-0">
                                {isCompleted ? (
                                  <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </span>
                              <span className="truncate flex-grow text-left">{lecture.title}</span>
                              {lecture.duration && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  {Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lecture Content Area */}
        <div className="flex-1 flex flex-col overflow-auto">
          {currentLecture ? (
            <div className="flex-1">
              <div className="bg-black aspect-video">
                {currentLecture.type === 'video' ? (
                  <VideoPlayer
                    videoUrl={currentLecture.videoUrl}
                    poster={currentLecture.poster || course.thumbnail}
                    title={currentLecture.title}
                    autoPlay={false}
                    controls={true}
                    startTime={lectureProgress.currentTime}
                    onProgress={handleVideoProgress}
                    onEnded={markLectureComplete}
                    subtitles={currentLecture.subtitles || []}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="mt-2">This lecture content is not a video.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {currentLecture.title}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={markLectureComplete}
                      className={`px-3 py-1 rounded-md text-sm ${
                        lectureProgress.completed
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      disabled={lectureProgress.completed}
                    >
                      {lectureProgress.completed ? 'Completed' : 'Mark as Complete'}
                    </button>
                    <button
                      type="button"
                      onClick={navigateToNextLecture}
                      className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Next Lecture
                    </button>
                  </div>
                </div>

                {currentLecture.description && (
                  <div className="mt-4 prose dark:prose-invert prose-sm max-w-none">
                    <p className="text-gray-700 dark:text-gray-300">
                      {currentLecture.description}
                    </p>
                  </div>
                )}

                {currentLecture.resources && currentLecture.resources.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Resources
                    </h3>
                    <ul className="space-y-2">
                      {currentLecture.resources.map((resource, index) => (
                        <li key={index}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            {resource.title || 'Download Resource'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a lecture from the curriculum to start learning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
