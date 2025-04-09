import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import Layout from '../../../components/common/Layout';
import CourseCreationStepper from '../../../components/course-creation/CourseCreationStepper';

const CreateCoursePage = () => {
  const router = useRouter();
  const user = useSelector(state => state.user);
  const isAuthenticated = user.isAuthenticated;
  const isInstructor = user.isInstructor;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    basicInfo: {
      title: '',
      subtitle: '',
      description: '',
      language: 'english',
      level: 'all_levels',
      category: '',
      subcategory: '',
      primaryTopic: '',
    },
    media: {
      thumbnail: null,
      promotionalVideo: null,
    },
    curriculum: {
      sections: [
        {
          id: 'section-1',
          title: 'Introduction',
          description: '',
          lectures: [
            {
              id: 'lecture-1-1',
              title: 'Welcome to the Course',
              description: '',
              type: 'video',
              content: null,
              duration: 0,
              isPublished: false,
            }
          ]
        }
      ]
    },
    pricing: {
      price: 39.99,
      hasDiscount: false,
      discountPrice: 29.99,
      discountDeadline: '',
    },
    settings: {
      welcomeMessage: '',
      congratulationsMessage: '',
      visibleToStudents: true,
    }
  });

  // Check if user is authenticated and is an instructor
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/instructor/courses/create');
    } else if (!isInstructor) {
      router.push('/access-denied');
    }
  }, [isAuthenticated, isInstructor, router]);

  // Handle form data changes
  const handleFormChange = (step, data) => {
    setFormData(prevData => ({
      ...prevData,
      [step]: {
        ...prevData[step],
        ...data
      }
    }));
  };

  // Handle step changes
  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // In a real app, this would send the course data to an API

    try {
      // Simulate API call
      console.log('Submitting course data:', formData);

      // Redirect to the courses page after successful submission
      alert('Course created successfully!');
      router.push('/instructor/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    }
  };

  if (!isAuthenticated || !isInstructor) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="loader"></div>
        </div>
      </Layout>
    );
  }

  const steps = [
    { id: 'basicInfo', label: 'Basic Info' },
    { id: 'media', label: 'Course Media' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'settings', label: 'Settings & Review' }
  ];

  return (
    <Layout>
      <Head>
        <title>Create a New Course | EduPlatform</title>
        <meta name="description" content="Create a new course to share your knowledge and expertise with students around the world." />
      </Head>

      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create a New Course</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Share your knowledge and expertise with students around the world. Create engaging content that makes learning enjoyable.
          </p>
        </div>

        <CourseCreationStepper
          steps={steps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          formData={formData}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
};

export default CreateCoursePage;
