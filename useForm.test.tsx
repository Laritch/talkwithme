import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useForm } from '../useForm';
import { z } from 'zod';

describe('useForm hook', () => {
  // Define a simple schema for testing
  const testSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Must be at least 18 years old'),
    agree: z.boolean().refine(val => val === true, {
      message: 'You must agree to terms',
    }),
  });

  // Define initial values
  const initialValues = {
    name: '',
    email: '',
    age: 0,
    agree: false,
  };

  it('should initialize with initial values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values with handleChange', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Create a mock event for text input
    const mockEvent = {
      target: {
        name: 'name',
        value: 'John Doe',
        type: 'text',
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(mockEvent);
    });

    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.isDirty).toBe(true);
  });

  it('should mark field as touched on blur', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    const mockEvent = {
      target: {
        name: 'email',
        value: '', // Empty string will fail validation
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleBlur(mockEvent);
    });

    expect(result.current.touched.email).toBe(true);
  });

  it('should validate a field when touched', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
        validateOnBlur: true,
      })
    );

    // Update the email field with invalid value
    act(() => {
      result.current.setFieldValue('email', 'not-an-email');
      result.current.setFieldTouched('email', true);
    });

    expect(result.current.errors.email).toBe('Invalid email address');
  });

  it('should validate the entire form', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    act(() => {
      result.current.validateForm();
    });

    // Multiple validation errors should exist
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    expect(result.current.isValid).toBe(false);
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Change some values
    act(() => {
      result.current.setFieldValue('name', 'John');
      result.current.setFieldValue('email', 'john@example.com');
    });

    // Ensure values changed
    expect(result.current.values.name).toBe('John');
    expect(result.current.values.email).toBe('john@example.com');

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    // Check values are reset
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('should handle form submission with validation', async () => {
    const mockSubmit = jest.fn();

    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Set up valid form data
    act(() => {
      result.current.setFieldValue('name', 'John Doe');
      result.current.setFieldValue('email', 'john@example.com');
      result.current.setFieldValue('age', 25);
      result.current.setFieldValue('agree', true);
    });

    // Submit the form
    await act(async () => {
      const submitHandler = result.current.handleSubmit(mockSubmit);
      await submitHandler({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    // Verify the submit function was called with valid data
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      agree: true,
    });
  });

  it('should not submit if validation fails', async () => {
    const mockSubmit = jest.fn();

    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationSchema: testSchema,
      })
    );

    // Set up invalid form data (name too short, email invalid)
    act(() => {
      result.current.setFieldValue('name', 'Jo');
      result.current.setFieldValue('email', 'invalid-email');
    });

    // Submit the form
    await act(async () => {
      const submitHandler = result.current.handleSubmit(mockSubmit);
      await submitHandler({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    // Verify the submit function was not called
    expect(mockSubmit).not.toHaveBeenCalled();

    // Verify errors exist
    expect(result.current.errors.name).toBe('Name must be at least 3 characters');
    expect(result.current.errors.email).toBe('Invalid email address');
  });
});
