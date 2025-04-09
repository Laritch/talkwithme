import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';

// Components
import VideoPlayer from '../../../components/expert/ProgramVideoPlayer';

// Services
import { expertAPI } from '../../../services/api';

// Placeholder data for development
const PLACEHOLDER_SECTIONS = [
  {
    id: 'section-1',
    title: 'Introduction',
    lessons: [
      { id: 'lesson-1-1', title: 'Welcome to the Program', duration: '5:20', isCompleted: true },
      { id: 'lesson-1-2', title: 'How to Use This Program', duration: '8:45', isCompleted: true }
    ]
  },
  {
    id: 'section-2',
    title: 'Core Concepts',
    lessons: [
      { id: 'lesson-2-1', title: 'Basic Principles', duration: '12:10', isCompleted: false },
      { id: 'lesson-2-2', title: 'Advanced Techniques', duration: '15:30', isCompleted: false },
      { id: 'lesson-2-3', title: 'Practical Applications', duration: '18:15', isCompleted: false }
    ]
  },
  {
    id: 'section-3',
    title: 'Practical Exercises',
    lessons: [
      { id: 'lesson-3-1', title: 'Exercise 1: Getting Started', duration: '10:00', isCompleted: false },
      { id: 'lesson-3-2', title: 'Exercise 2: Building Skills', duration: '14:20', isCompleted: false }
    ]
  }
];

export default function ProgramPlayerPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { id: programId, lessonId } = router.query;

  const [program, setProgram] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [curriculum, setCurriculum] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch program data
  useEffect(() => {
    const fetchProgram = async () => {
      if (!router.isReady || !programId) return;

      try {
        setLoading(true);
        setError(null);

        // In production, we would fetch from real API
        // const response = await expertAPI.getProgram(programId);
        // const programData = response.data;

        // Using placeholder data for development
        const programData = {
          id: programId,
          title: 'Comprehensive Program by Expert',
          description: 'This program covers all aspects of the subject matter, from basic to advanced concepts.',
          expert: {
            id: 'expert-1',
            name: 'Jane Smith',
            title: 'Certified Professional'
          },
          sections: PLACEHOLDER_SECTIONS
        };

        setProgram(programData);
        setCurriculum(programData.sections);

        // Calculate progress
        const totalLessons = programData.sections.reduce(
          (acc, section) => acc + section.lessons.length,
          0
        );

        const completedLessons = programData.sections.reduce(
          (acc, section) =>
            acc + section.lessons.filter(lesson => lesson.isCompleted).length,
          0
        );

        setProgress(Math.round((completedLessons / totalLessons) * 100));

        // Determine current lesson
        const lessonIdToUse = lessonId || findFirstIncompleteLesson(programData.sections);
        setCurrentLessonId(lessonIdToUse);

        // Find current lesson data
        if (lessonIdToUse) {
          const lesson = findLessonById(programData.sections, lessonIdToUse);
          if (lesson) {
            setCurrentLesson(lesson);
          }
        }

      } catch (err) {
        console.error('Error fetching program:', err);
        setError(
          err.response?.data?.message ||
          'Failed to load program. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [router.isReady, programId, lessonId]);

  // Helper to find the first incomplete lesson
  const findFirstIncompleteLesson = (sections) => {
    for (const section of sections) {
      for (const lesson of section.lessons) {
        if (!lesson.isCompleted) {
          return lesson.id;
        }
      }
    }
    // If all lessons are complete, return the first lesson
    if (sections.length > 0 && sections[0].lessons.length > 0) {
      return sections[0].lessons[0].id;
    }
    return null;
  };

  // Helper to find a lesson by ID
  const findLessonById = (sections, id) => {
    for (const section of sections) {
      const lesson = section.lessons.find(lesson => lesson.id === id);
      if (lesson) {
        return {
          ...lesson,
          sectionTitle: section.title
        };
      }
    }
    return null;
  };

  // Handle lesson change
  const handleLessonChange = (lessonId) => {
    setCurrentLessonId(lessonId);
    const lesson = findLessonById(curriculum, lessonId);
    if (lesson) {
      setCurrentLesson(lesson);

      // Update URL without full refresh
      router.push(
        `/programs/${programId}/player?lessonId=${lessonId}`,
        undefined,
        { shallow: true }
      );
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async (lessonId) => {
    if (!isAuthenticated) return;

    try {
      // In production, call the API
      // await expertAPI.markLessonComplete(programId, lessonId);

      // For development, update local state
      const updatedCurriculum = curriculum.map(section => ({
        ...section,
        lessons: section.lessons.map(lesson =>
          lesson.id === lessonId
            ? { ...lesson, isCompleted: true }
            : lesson
        )
      }));

      setCurriculum(updatedCurriculum);

      // Recalculate progress
      const totalLessons = updatedCurriculum.reduce(
        (acc, section) => acc + section.lessons.length,
        0
      );

      const completedLessons = updatedCurriculum.reduce(
        (acc, section) =>
          acc + section.lessons.filter(lesson => lesson.isCompleted).length,
        0
      );

      setProgress(Math.round((completedLessons / totalLessons) * 100));

    } catch (err) {
      console.error('Error marking lesson complete:', err);
    }
  };

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/3">
                <div className="aspect-w-16 aspect-h-9 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
              </div>
              <div className="w-full md:w-1/3">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="mb-4">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="h-10 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!program || !currentLesson) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Program not found</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">The program you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm py-2 px-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {currentLesson.title}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content area */}
          <div className="w-full md:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{program.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                By {program.expert.name}, {program.expert.title}
              </p>

              {/* Video player */}
              <div className="mb-6">
                <VideoPlayer
                  lesson={currentLesson}
                  onComplete={() => markLessonComplete(currentLesson.id)}
                />
              </div>

              {/* Lesson info */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {currentLesson.title}
                </h2>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span className="font-medium mr-4">Section: {currentLesson.sectionTitle}</span>
                  <span>Duration: {currentLesson.duration}</span>
                </div>
                <div className="prose dark:prose-dark max-w-none">
                  <p>This lesson covers essential concepts and techniques. Follow along with the video and complete any exercises mentioned.</p>
                </div>
              </div>

              {/* Next/Previous buttons */}
              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    // Previous lesson logic
                    const allLessons = curriculum.flatMap(section => section.lessons);
                    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
                    if (currentIndex > 0) {
                      handleLessonChange(allLessons[currentIndex - 1].id);
                    }
                  }}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Previous
                  </span>
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Next lesson logic
                    markLessonComplete(currentLessonId);
                    const allLessons = curriculum.flatMap(section => section.lessons);
                    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
                    if (currentIndex < allLessons.length - 1) {
                      handleLessonChange(allLessons[currentIndex + 1].id);
                    }
                  }}
                >
                  <span className="flex items-center">
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar/Curriculum */}
          <div
            className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:block ${
              isSidebarOpen ? 'fixed inset-0 z-20 overflow-y-auto' : 'hidden'
            }`}
          >
            {/* Mobile close button */}
            {isSidebarOpen && (
              <div className="md:hidden flex justify-end mb-4">
                <button
                  onClick={toggleSidebar}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Progress</h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{progress}% complete</p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Program Curriculum</h3>

            <div className="space-y-4">
              {curriculum.map((section) => (
                <div key={section.id} className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          onClick={() => handleLessonChange(lesson.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-md ${
                            currentLessonId === lesson.id
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            {lesson.isCompleted ? (
                              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : currentLessonId === lesson.id ? (
                              <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="text-sm">{lesson.title}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{lesson.duration}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
