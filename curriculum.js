import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Components
import CourseCreationStepper from '../../../../components/instructor/CourseCreationStepper';
import CurriculumBuilder from '../../../../components/instructor/CurriculumBuilder';
import Layout from '../../../../components/Layout';

// API Services
import { coursesAPI } from '../../../../services/api';

export default function CurriculumPage() {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      setIsLoading(true);
      setError('');

      try {
        const response = await coursesAPI.getInstructorCourse(id);
        setCourse(response.data);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(
          err.response?.data?.message ||
          'Failed to load course details. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleCurriculumUpdate = async (newCurriculum) => {
    if (!id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await coursesAPI.updateCourse(id, {
        ...course,
        ...newCurriculum
      });

      setCourse(response.data);

      // Navigate to the media page
      router.push(`/instructor/courses/${id}/media`);
    } catch (err) {
      console.error('Error updating curriculum:', err);
      setError(
        err.response?.data?.message ||
        'Failed to update curriculum. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await coursesAPI.updateCourse(id, course);
      setCourse(response.data);

      // Show a success message - could use a toast notification here
      alert('Changes saved successfully');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(
        err.response?.data?.message ||
        'Failed to save draft. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-pulse h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="mt-8 animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
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
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Build your course curriculum
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <CourseCreationStepper
            currentStep="curriculum"
            courseId={course.id}
          />

          <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <CurriculumBuilder
                curriculum={{ sections: course.sections || [] }}
                onChange={(newCurriculum) => setCourse({ ...course, ...newCurriculum })}
              />

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                >
                  {isSubmitting ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCurriculumUpdate(course)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Continue to Media'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
