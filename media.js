import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Components
import CourseCreationStepper from '../../../../components/instructor/CourseCreationStepper';
import MediaUploadForm from '../../../../components/instructor/MediaUploadForm';
import Layout from '../../../../components/Layout';

// API Services
import { coursesAPI } from '../../../../services/api';

export default function MediaPage() {
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

  const handleMediaUpdate = async (mediaData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Handle thumbnail upload if it's a new File
      if (mediaData.thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', mediaData.thumbnailFile);

        const uploadResponse = await coursesAPI.uploadCourseThumbnail(id, formData);
        mediaData.thumbnail = uploadResponse.data.thumbnailUrl;
      }

      // Handle preview video upload if it's a new File
      if (mediaData.previewVideoFile) {
        const formData = new FormData();
        formData.append('video', mediaData.previewVideoFile);

        const uploadResponse = await coursesAPI.uploadCourseVideo(
          id,
          'preview',
          formData,
          (progress) => {
            console.log('Upload progress:', progress);
            // Could update a progress state here
          }
        );
        mediaData.previewVideo = uploadResponse.data.videoUrl;
      }

      // Update course with new media URLs
      const response = await coursesAPI.updateCourse(id, {
        ...course,
        thumbnail: mediaData.thumbnail,
        previewVideo: mediaData.previewVideo
      });

      setCourse(response.data);

      // Navigate to the pricing page
      router.push(`/instructor/courses/${id}/pricing`);
    } catch (err) {
      console.error('Error updating media:', err);
      setError(
        err.response?.data?.message ||
        'Failed to update media. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (mediaData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Handle thumbnail upload if it's a new File
      if (mediaData.thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', mediaData.thumbnailFile);

        const uploadResponse = await coursesAPI.uploadCourseThumbnail(id, formData);
        mediaData.thumbnail = uploadResponse.data.thumbnailUrl;
      }

      // Handle preview video upload if it's a new File
      if (mediaData.previewVideoFile) {
        const formData = new FormData();
        formData.append('video', mediaData.previewVideoFile);

        const uploadResponse = await coursesAPI.uploadCourseVideo(
          id,
          'preview',
          formData,
          (progress) => {
            console.log('Upload progress:', progress);
            // Could update a progress state here
          }
        );
        mediaData.previewVideo = uploadResponse.data.videoUrl;
      }

      // Update course with new media URLs
      const response = await coursesAPI.updateCourse(id, {
        ...course,
        thumbnail: mediaData.thumbnail,
        previewVideo: mediaData.previewVideo
      });

      setCourse(response.data);

      // Show success message
      alert('Media saved successfully');
    } catch (err) {
      console.error('Error saving media:', err);
      setError(
        err.response?.data?.message ||
        'Failed to save media. Please try again.'
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
            Upload course media
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <CourseCreationStepper
            currentStep="media"
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

              <MediaUploadForm
                initialData={{
                  thumbnail: course.thumbnail,
                  previewVideo: course.previewVideo
                }}
                onSubmit={handleMediaUpdate}
                onSaveDraft={handleSaveDraft}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
