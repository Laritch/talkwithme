import { useState } from 'react';
import BasicInfoForm from './BasicInfoForm';
import MediaUploadForm from './MediaUploadForm';
import CurriculumBuilder from './CurriculumBuilder';
import PricingForm from './PricingForm';
import CourseSettings from './CourseSettings';

const CourseCreationStepper = ({
  steps,
  currentStep,
  onStepChange,
  formData,
  onFormChange,
  onSubmit
}) => {
  const [stepValidation, setStepValidation] = useState({
    basicInfo: false,
    media: false,
    curriculum: false,
    pricing: true,
    settings: true,
  });

  // Handle next step
  const handleNext = () => {
    // Validate current step form
    const isValid = validateCurrentStep();

    if (isValid && currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  // Validate current step
  const validateCurrentStep = () => {
    const currentStepId = steps[currentStep].id;
    let isValid = true;

    switch (currentStepId) {
      case 'basicInfo':
        // Basic validation for required fields
        isValid = !!formData.basicInfo.title &&
                 !!formData.basicInfo.description &&
                 !!formData.basicInfo.category;
        setStepValidation(prev => ({ ...prev, basicInfo: isValid }));
        break;
      case 'media':
        // Thumbnail is required
        isValid = !!formData.media.thumbnail;
        setStepValidation(prev => ({ ...prev, media: isValid }));
        break;
      case 'curriculum':
        // At least one section with one lecture is required
        isValid = formData.curriculum.sections.length > 0 &&
                 formData.curriculum.sections.some(section => section.lectures.length > 0);
        setStepValidation(prev => ({ ...prev, curriculum: isValid }));
        break;
      default:
        break;
    }

    return isValid;
  };

  // Render form based on current step
  const renderStepContent = () => {
    const currentStepId = steps[currentStep].id;

    switch (currentStepId) {
      case 'basicInfo':
        return (
          <BasicInfoForm
            formData={formData.basicInfo}
            onChange={(data) => onFormChange('basicInfo', data)}
          />
        );
      case 'media':
        return (
          <MediaUploadForm
            formData={formData.media}
            onChange={(data) => onFormChange('media', data)}
          />
        );
      case 'curriculum':
        return (
          <CurriculumBuilder
            curriculum={formData.curriculum}
            onChange={(data) => onFormChange('curriculum', data)}
          />
        );
      case 'pricing':
        return (
          <PricingForm
            formData={formData.pricing}
            onChange={(data) => onFormChange('pricing', data)}
          />
        );
      case 'settings':
        return (
          <CourseSettings
            formData={formData}
            onChange={(data) => onFormChange('settings', data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Stepper Header */}
      <div className="px-4 sm:px-6 py-5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {steps[currentStep].label}
          </h2>

          <div className="flex space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 ${index < steps.length - 1 ? 'mr-1' : ''}`}
            >
              <button
                type="button"
                onClick={() => {
                  if (index < currentStep || stepValidation[step.id]) {
                    onStepChange(index);
                  }
                }}
                className={`w-full h-2 rounded-full transition-colors ${
                  index < currentStep
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : index === currentStep
                      ? 'bg-blue-400 dark:bg-blue-700'
                      : 'bg-gray-200 dark:bg-gray-700'
                }`}
                disabled={index > currentStep && !stepValidation[step.id]}
                aria-label={`Go to ${step.label}`}
              />
              <span className={`text-xs mt-1 block text-center ${
                index === currentStep
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Submit Course
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCreationStepper;
