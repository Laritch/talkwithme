import { useState } from 'react';

const BasicInfoForm = ({ formData, onChange }) => {
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    onChange({
      ...formData,
      [name]: value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle rich text description change
  const handleDescriptionChange = (content) => {
    onChange({
      ...formData,
      description: content
    });

    // Clear error for description
    if (errors.description) {
      setErrors({
        ...errors,
        description: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Course title should be at least 10 characters';
    }

    if (!formData.subtitle.trim()) {
      newErrors.subtitle = 'Course subtitle is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    } else if (formData.description.length < 200) {
      newErrors.description = 'Description should be at least 200 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Basic info is valid');
    }
  };

  // Category options
  const categories = [
    { value: '', label: 'Select a category' },
    { value: 'development', label: 'Development' },
    { value: 'business', label: 'Business' },
    { value: 'finance', label: 'Finance & Accounting' },
    { value: 'it-software', label: 'IT & Software' },
    { value: 'office-productivity', label: 'Office Productivity' },
    { value: 'personal-development', label: 'Personal Development' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'photography', label: 'Photography & Video' },
    { value: 'health-fitness', label: 'Health & Fitness' },
    { value: 'music', label: 'Music' },
    { value: 'teaching', label: 'Teaching & Academics' },
  ];

  // Subcategory options (based on selected category)
  const subcategories = {
    development: [
      { value: 'web-development', label: 'Web Development' },
      { value: 'mobile-development', label: 'Mobile Development' },
      { value: 'game-development', label: 'Game Development' },
      { value: 'software-engineering', label: 'Software Engineering' },
      { value: 'data-science', label: 'Data Science' },
    ],
    business: [
      { value: 'entrepreneurship', label: 'Entrepreneurship' },
      { value: 'communications', label: 'Communications' },
      { value: 'management', label: 'Management' },
      { value: 'sales', label: 'Sales' },
      { value: 'strategy', label: 'Strategy' },
    ],
    // Add more subcategories as needed
  };

  // Language options
  const languages = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'hindi', label: 'Hindi' },
  ];

  // Level options
  const levels = [
    { value: 'beginner', label: 'Beginner Level' },
    { value: 'intermediate', label: 'Intermediate Level' },
    { value: 'advanced', label: 'Advanced Level' },
    { value: 'all_levels', label: 'All Levels' },
  ];

  // Get subcategory options based on selected category
  const getSubcategoryOptions = () => {
    if (!formData.category || !subcategories[formData.category]) {
      return [{ value: '', label: 'Select a category first' }];
    }

    return [
      { value: '', label: 'Select a subcategory' },
      ...subcategories[formData.category],
    ];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Title <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${
              errors.title
                ? 'border-red-300 dark:border-red-700 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-700'
            } dark:bg-gray-800 dark:text-gray-200`}
            placeholder="e.g., Complete Web Development Bootcamp 2024"
          />
          {errors.title && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your title should be clear, specific, and descriptive of what students will learn.
          </p>
        </div>
      </div>

      {/* Course Subtitle */}
      <div>
        <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Subtitle <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${
              errors.subtitle
                ? 'border-red-300 dark:border-red-700 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-700'
            } dark:bg-gray-800 dark:text-gray-200`}
            placeholder="e.g., Learn HTML, CSS, JavaScript, React, Node.js, and More!"
          />
          {errors.subtitle && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.subtitle}</p>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your subtitle should expand on your title and highlight key selling points.
          </p>
        </div>
      </div>

      {/* Course Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Description <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            rows={10}
            value={formData.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${
              errors.description
                ? 'border-red-300 dark:border-red-700 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-700'
            } dark:bg-gray-800 dark:text-gray-200`}
            placeholder="Describe your course, what students will learn, who it's for, etc."
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            A detailed description helps students understand what they'll learn and why they should enroll.
          </p>
        </div>
      </div>

      {/* Basic Information Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Language <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200"
            >
              {languages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Level */}
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Level <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200"
            >
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.category
                  ? 'border-red-300 dark:border-red-700 text-red-900 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-700'
              } dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Subcategory */}
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subcategory
          </label>
          <div className="mt-1">
            <select
              id="subcategory"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              disabled={!formData.category}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            >
              {getSubcategoryOptions().map((subcategory) => (
                <option key={subcategory.value} value={subcategory.value}>
                  {subcategory.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Topic (optional) */}
        <div className="sm:col-span-2">
          <label htmlFor="primaryTopic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Topic (Optional)
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="primaryTopic"
              name="primaryTopic"
              value={formData.primaryTopic}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-gray-200"
              placeholder="e.g., React Hooks, Machine Learning, Digital Marketing"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Adding a primary topic can help your course rank better in search results.
          </p>
        </div>
      </div>
    </form>
  );
};

export default BasicInfoForm;
