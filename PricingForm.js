import { useState } from 'react';

const PricingForm = ({ initialData = {}, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    price: initialData.price || '',
    salePrice: initialData.salePrice || '',
    hasSalePrice: initialData.salePrice ? true : false,
    isFreeCourse: initialData.isFreeCourse || false,
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      // Handle checkbox changes
      if (name === 'isFreeCourse' && checked) {
        setFormData({
          ...formData,
          [name]: checked,
          price: '0',
          salePrice: '',
          hasSalePrice: false
        });
      } else if (name === 'hasSalePrice' && !checked) {
        setFormData({
          ...formData,
          [name]: checked,
          salePrice: ''
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked
        });
      }
    } else if (name === 'price' || name === 'salePrice') {
      // Handle price inputs (numbers only)
      if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.isFreeCourse) {
      if (!formData.price) {
        newErrors.price = 'Course price is required';
      } else if (Number(formData.price) <= 0) {
        newErrors.price = 'Price must be greater than 0';
      } else if (Number(formData.price) > 999.99) {
        newErrors.price = 'Price cannot exceed 999.99';
      }

      if (formData.hasSalePrice) {
        if (!formData.salePrice) {
          newErrors.salePrice = 'Sale price is required';
        } else if (Number(formData.salePrice) <= 0) {
          newErrors.salePrice = 'Sale price must be greater than 0';
        } else if (Number(formData.salePrice) >= Number(formData.price)) {
          newErrors.salePrice = 'Sale price must be less than regular price';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const submissionData = {
        ...formData,
        price: formData.isFreeCourse ? '0' : formData.price,
        salePrice: formData.hasSalePrice ? formData.salePrice : '',
      };

      onSubmit(submissionData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
          Course Pricing
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set the right price for your course to maximize your earnings.
        </p>
      </div>

      {/* Free Course Checkbox */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="isFreeCourse"
            name="isFreeCourse"
            type="checkbox"
            checked={formData.isFreeCourse}
            onChange={handleChange}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
            disabled={isSubmitting}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isFreeCourse" className="font-medium text-gray-700 dark:text-gray-300">
            This is a free course
          </label>
          <p className="text-gray-500 dark:text-gray-400">
            Free courses typically attract more students but may be perceived as less valuable.
          </p>
        </div>
      </div>

      {/* Course Price */}
      <div className={formData.isFreeCourse ? 'opacity-50' : ''}>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Price {!formData.isFreeCourse && <span className="text-red-600">*</span>}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="text"
            name="price"
            id="price"
            value={formData.price}
            onChange={handleChange}
            className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
              errors.price ? 'border-red-500 dark:border-red-500' : ''
            }`}
            placeholder="0.00"
            aria-describedby="price-currency"
            disabled={isSubmitting || formData.isFreeCourse}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm" id="price-currency">
              USD
            </span>
          </div>
        </div>

        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Set a competitive price based on the course content, length, and market demand.
        </p>
      </div>

      {/* Sale Price */}
      <div className={formData.isFreeCourse ? 'opacity-50' : ''}>
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="hasSalePrice"
              name="hasSalePrice"
              type="checkbox"
              checked={formData.hasSalePrice}
              onChange={handleChange}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              disabled={isSubmitting || formData.isFreeCourse}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="hasSalePrice" className="font-medium text-gray-700 dark:text-gray-300">
              Offer a promotional price
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              A promotional price can help attract more students to your new course.
            </p>
          </div>
        </div>

        {formData.hasSalePrice && (
          <div className="mt-4 ml-7">
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sale Price <span className="text-red-600">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                name="salePrice"
                id="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  errors.salePrice ? 'border-red-500 dark:border-red-500' : ''
                }`}
                placeholder="0.00"
                aria-describedby="sale-price-currency"
                disabled={isSubmitting || formData.isFreeCourse}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="sale-price-currency">
                  USD
                </span>
              </div>
            </div>

            {errors.salePrice && (
              <p className="mt-1 text-sm text-red-600">{errors.salePrice}</p>
            )}

            {formData.price && formData.salePrice && !errors.salePrice && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Students save ${(Number(formData.price) - Number(formData.salePrice)).toFixed(2)} ({Math.round((1 - Number(formData.salePrice) / Number(formData.price)) * 100)}% off)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pricing Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Pricing Tips</h4>
        <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Price your course based on value, not just length.</li>
          <li>Research competitor pricing for similar courses in your category.</li>
          <li>Consider offering an introductory price for your first 100 students.</li>
          <li>Free courses attract more students but may signal lower quality.</li>
          <li>You'll earn 70% of the course price (after transaction fees).</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-5">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Back to Media
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Save Draft
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue to Publish'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PricingForm;
