import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Components
import CourseCreationStepper from '../../../../components/instructor/CourseCreationStepper';
import PublishForm from '../../../../components/instructor/PublishForm';
import Layout from '../../../../components/Layout';

// Mock API functions - to be replaced with actual API calls
const getCourse = async (courseId) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real app, this would be an API call to get the course
  return {
    id: courseId,
    title: 'Advanced JavaScript - The Complete Developer Guide',
    subtitle: 'Master modern JavaScript from basic to advanced concepts with hands-on projects',
    description: 'This comprehensive course takes you through the entire JavaScript language from fundamentals to advanced patterns. You will build real-world projects and understand the inner workings of JavaScript.',
    category: 'development',
    subcategory: 'web-development',
    level: 'intermediate',
    language: 'english',
    price: '89.99',
    salePrice: '',
    isFreeCourse: false,
    status: 'draft',
    thumbnail: 'https://via.placeholder.com/1280x720',
    previewVideo: '',
    sections: [
      {
        id: 'section-1',
        title: 'Getting Started with JavaScript',
        lectures: [
          {
            id: 'lecture-1',
            title: 'Introduction to the Course',
            type: 'video',
            content: '',
            duration: 360,
            isPublished: true
          },
          {
            id: 'lecture-2',
            title: 'Setting Up Your Development Environment',
            type: 'video',
            content: '',
            duration: 720,
            isPublished: true
          }
        ]
      }
    ],
    requirements: [
      'Basic understanding of HTML and CSS',
      'A computer with internet access',
      'No prior JavaScript knowledge needed'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const updateCourse = async (courseId, updateData) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, this would be an API call to update the course
  return {
    ...updateData,
    id: courseId,
    updatedAt: new Date().toISOString(),
  };
};

export default function PublishPage() {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      setIsLoading(true);
      setError('');

      try {
        const courseData = await getCourse(id);
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handlePublish = async (courseData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const updatedCourse = await updateCourse(id, courseData);
      setCourse(updatedCourse);
      setPublishSuccess(true);

      // After successful publishing, redirect to instructor dashboard after a delay
      setTimeout(() => {
        router.push('/instructor/dashboard');
      }, 5000);
    } catch (err) {
      console.error('Error publishing course:', err);
      setError('Failed to publish course. Please try again.');
      setPublishSuccess(false);
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

  if (publishSuccess) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Course successfully published!</h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-200">
                  <p>Your course is now live and available to students. You'll be redirected to your instructor dashboard in a moment.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">What's Next?</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400 mx-auto">
                <p>Here are some tips to make your course successful:</p>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Share on Social Media</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Promote your course to reach more potential students.</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Respond to Questions</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Engage with students to improve satisfaction.</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Update Regularly</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Keep your content fresh and valuable.</p>
                </div>
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
            Review and publish your course
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <CourseCreationStepper
            currentStep="publish"
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

              <PublishForm
                courseData={course}
                onSubmit={handlePublish}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
