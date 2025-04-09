import { useState, useEffect } from 'react';

const PublishForm = ({ courseData, onSubmit, isSubmitting }) => {
  const [isReadyToPublish, setIsReadyToPublish] = useState(false);
  const [checklist, setChecklist] = useState({
    basicInfo: false,
    curriculum: false,
    thumbnail: false,
    price: false,
    requirements: false
  });
  const [agreements, setAgreements] = useState({
    quality: false,
    ownership: false,
    terms: false
  });
  const [errors, setErrors] = useState({});

  // Validate course data and update checklist
  useEffect(() => {
    const validateCourse = () => {
      const newChecklist = { ...checklist };

      // Basic info validation
      newChecklist.basicInfo = !!(
        courseData.title &&
        courseData.subtitle &&
        courseData.description &&
        courseData.category
      );

      // Curriculum validation (at least one section with one lecture)
      newChecklist.curriculum = !!(
        courseData.sections &&
        courseData.sections.length > 0 &&
        courseData.sections.some(section => section.lectures && section.lectures.length > 0)
      );

      // Thumbnail validation
      newChecklist.thumbnail = !!courseData.thumbnail;

      // Price validation
      newChecklist.price = courseData.isFreeCourse ||
        (courseData.price && parseFloat(courseData.price) >= 0);

      // Course requirements validation
      newChecklist.requirements = !!(
        courseData.requirements &&
        courseData.requirements.length > 0
      );

      setChecklist(newChecklist);

      // All checklist items must be true to be ready to publish
      setIsReadyToPublish(Object.values(newChecklist).every(Boolean));
    };

    validateCourse();
  }, [courseData]);

  const handleAgreementChange = (e) => {
    const { name, checked } = e.target;
    setAgreements({
      ...agreements,
      [name]: checked
    });

    // Clear error when agreement is checked
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isReadyToPublish) {
      newErrors.checklist = 'All course requirements must be met before publishing';
    }

    // All agreements must be checked
    if (!agreements.quality) {
      newErrors.quality = 'You must agree to the quality standards';
    }

    if (!agreements.ownership) {
      newErrors.ownership = 'You must confirm ownership of course content';
    }

    if (!agreements.terms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({ ...courseData, status: 'published' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
          Publish Your Course
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review your course details and publish when you're ready.
        </p>
      </div>

      {/* Course Checklist */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Course Checklist
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            These requirements must be met before publishing your course.
          </p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          <ChecklistItem
            title="Course Details"
            description="Title, subtitle, description, and category"
            isComplete={checklist.basicInfo}
            linkText="Edit Basic Info"
            linkHref="/instructor/courses/create"
          />

          <ChecklistItem
            title="Course Curriculum"
            description="At least one section with one lecture"
            isComplete={checklist.curriculum}
            linkText="Edit Curriculum"
            linkHref={`/instructor/courses/${courseData.id}/curriculum`}
          />

          <ChecklistItem
            title="Course Thumbnail"
            description="An eye-catching image to represent your course"
            isComplete={checklist.thumbnail}
            linkText="Add Media"
            linkHref={`/instructor/courses/${courseData.id}/media`}
          />

          <ChecklistItem
            title="Course Pricing"
            description="Set your course price (or make it free)"
            isComplete={checklist.price}
            linkText="Edit Pricing"
            linkHref={`/instructor/courses/${courseData.id}/pricing`}
          />

          <ChecklistItem
            title="Course Requirements"
            description="Prerequisites for students taking this course"
            isComplete={checklist.requirements}
            linkText="Add Requirements"
            linkHref={`/instructor/courses/${courseData.id}/curriculum`}
          />
        </ul>
      </div>

      {/* Course Preview */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Preview</h4>
        <div className="flex items-start">
          {courseData.thumbnail && (
            <img
              src={courseData.thumbnail}
              alt={courseData.title}
              className="h-24 w-40 object-cover rounded mr-4"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{courseData.title || 'Course Title'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{courseData.subtitle || 'Course Subtitle'}</p>
            <div className="flex items-center mt-2">
              <span className="text-yellow-400">★★★★★</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">New Course</span>
              <span className="mx-2 text-gray-300 dark:text-gray-700">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {courseData.isFreeCourse ? 'Free' : `$${courseData.price || '0.00'}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Agreements */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
          Publishing Agreements
        </h4>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="quality"
              name="quality"
              type="checkbox"
              checked={agreements.quality}
              onChange={handleAgreementChange}
              className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 ${
                errors.quality ? 'border-red-500 dark:border-red-500' : ''
              }`}
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="quality" className="font-medium text-gray-700 dark:text-gray-300">
              Quality Standards
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              I confirm that my course content meets the platform's quality standards, including clear audio,
              professional video, and well-structured curriculum.
            </p>
            {errors.quality && (
              <p className="mt-1 text-sm text-red-600">{errors.quality}</p>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="ownership"
              name="ownership"
              type="checkbox"
              checked={agreements.ownership}
              onChange={handleAgreementChange}
              className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 ${
                errors.ownership ? 'border-red-500 dark:border-red-500' : ''
              }`}
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="ownership" className="font-medium text-gray-700 dark:text-gray-300">
              Content Ownership
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              I confirm that I own or have the rights to use all content in this course, including videos,
              images, and other materials.
            </p>
            {errors.ownership && (
              <p className="mt-1 text-sm text-red-600">{errors.ownership}</p>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreements.terms}
              onChange={handleAgreementChange}
              className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 ${
                errors.terms ? 'border-red-500 dark:border-red-500' : ''
              }`}
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
              Terms and Conditions
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              I agree to the <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400">Instructor Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400">Privacy Policy</a>.
            </p>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
            )}
          </div>
        </div>
      </div>

      {!isReadyToPublish && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Attention required</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                <p>
                  Complete all items in the checklist before publishing your course.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errors.checklist && (
        <p className="mt-1 text-sm text-red-600">{errors.checklist}</p>
      )}

      {/* Form Actions */}
      <div className="flex justify-between pt-5">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Back to Pricing
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isReadyToPublish
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={isSubmitting || !isReadyToPublish}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Course'}
          </button>
        </div>
      </div>
    </form>
  );
};

// Checklist item component
const ChecklistItem = ({ title, description, isComplete, linkText, linkHref }) => {
  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {isComplete ? (
            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {title}
            </p>
            <a href={linkHref} className="ml-2 flex-shrink-0 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400">
              {linkText}
            </a>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </li>
  );
};

export default PublishForm;
