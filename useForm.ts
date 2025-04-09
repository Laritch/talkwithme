import { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { z, ZodType, ZodError } from 'zod';

/**
 * Hook return type
 */
interface UseForm<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  setFieldError: (field: keyof T, error: string | null) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e: FormEvent) => void;
}

/**
 * Form hook options
 */
interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ZodType<T>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Create a form handling hook with validation
 *
 * @param options Form options including initial values and validation schema
 * @returns Form state and handlers
 */
export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>): UseForm<T> {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  /**
   * Validate a specific field
   */
  const validateField = useCallback((field: keyof T): boolean => {
    if (!validationSchema) return true;

    try {
      // Create a partial schema for just this field
      const fieldSchema = z.object({ [field]: validationSchema.shape[field as string] }) as ZodType<Pick<T, keyof T>>;
      fieldSchema.parse({ [field]: values[field] } as Pick<T, keyof T>);

      // Clear the error if validation passes
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        // Set the error message for this field
        const fieldError = error.errors.find(err => err.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        }
      }
      return false;
    }
  }, [validationSchema, values]);

  /**
   * Validate the entire form
   */
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      setIsValidating(true);
      validationSchema.parse(values);

      // Clear all errors if validation passes
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        // Set all error messages
        const newErrors: Partial<Record<keyof T, string>> = {};

        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          newErrors[field] = err.message;
        });

        setErrors(newErrors);
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validationSchema, values]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    // Handle different input types
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    }

    setValues(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    setIsDirty(true);

    // Validate on change if enabled
    if (validateOnChange && touched[name as keyof T]) {
      validateField(name as keyof T);
    }
  }, [touched, validateField, validateOnChange]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur if enabled
    if (validateOnBlur) {
      validateField(name as keyof T);
    }
  }, [validateField, validateOnBlur]);

  /**
   * Set a field value programmatically
   */
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));

    setIsDirty(true);

    // Validate the field if it's been touched
    if (validateOnChange && touched[field]) {
      validateField(field);
    }
  }, [touched, validateField, validateOnChange]);

  /**
   * Set a field touched state programmatically
   */
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched,
    }));

    // Validate the field if set to touched
    if (isTouched && validateOnBlur) {
      validateField(field);
    }
  }, [validateField, validateOnBlur]);

  /**
   * Set a field error programmatically
   */
  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [field]: error || undefined,
    }));
  }, []);

  /**
   * Reset the form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((submitHandler: (values: T) => Promise<void> | void) => {
    return async (e: FormEvent) => {
      e.preventDefault();

      setIsSubmitting(true);

      // Validate all fields
      const isValid = validateForm();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);

      setTouched(allTouched);

      if (isValid) {
        try {
          await submitHandler(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }

      setIsSubmitting(false);
    };
  }, [values, validateForm]);

  // Calculate if the form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    isValidating,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    validateField,
    validateForm,
    handleSubmit,
  };
}
