'use client';

import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  validate: (value: T, formValues?: Record<string, any>) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [key: string]: ValidationRule<T>[];
};

type ValidationErrors = {
  [key: string]: string[];
};

/**
 * Custom hook for managing form validation
 * Provides validation rules, error messages, and validation functions
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<any>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Reset the form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  
  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Validate the field if it's been touched
      if (touched[name]) {
        validateField(name, value);
      }
    },
    [touched]
  );
  
  // Handle blur event to mark field as touched
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name, value);
    },
    []
  );

  // Handle direct value changes (useful for custom inputs)
  const setFieldValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        validateField(name, value);
      }
    },
    [touched]
  );

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: any) => {
      if (!validationRules[name]) return true;
      
      const fieldErrors: string[] = [];
      
      for (const rule of validationRules[name]) {
        if (!rule.validate(value, values)) {
          fieldErrors.push(rule.message);
        }
      }
      
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors,
      }));
      
      return fieldErrors.length === 0;
    },
    [values, validationRules]
  );
  
  // Validate all form fields
  const validateForm = useCallback(() => {
    const formErrors: ValidationErrors = {};
    let isValid = true;
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);
    
    // Validate each field
    Object.keys(values).forEach((key) => {
      if (validationRules[key]) {
        const fieldErrors: string[] = [];
        
        for (const rule of validationRules[key]) {
          if (!rule.validate(values[key], values)) {
            fieldErrors.push(rule.message);
          }
        }
        
        if (fieldErrors.length > 0) {
          formErrors[key] = fieldErrors;
          isValid = false;
        }
      }
    });
    
    setErrors(formErrors);
    return isValid;
  }, [values, validationRules]);
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    validateField,
    validateForm,
    resetForm,
  };
}

/**
 * Common validation rules for reuse across forms
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return true;
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    },
    message,
  }),
  
  email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
    validate: (value) => 
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
    message,
  }),
  
  minLength: (min: number, message = `Must be at least ${min} characters`): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message,
  }),
  
  maxLength: (max: number, message = `Must be no more than ${max} characters`): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message,
  }),
  
  number: (message = 'Please enter a valid number'): ValidationRule<any> => ({
    validate: (value) => !isNaN(Number(value)),
    message,
  }),
  
  min: (min: number, message = `Must be at least ${min}`): ValidationRule<number> => ({
    validate: (value) => Number(value) >= min,
    message,
  }),
  
  max: (max: number, message = `Must be no more than ${max}`): ValidationRule<number> => ({
    validate: (value) => Number(value) <= max,
    message,
  }),
  
  pattern: (pattern: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value) => pattern.test(value),
    message,
  }),
  
  match: (fieldToMatch: string, message = 'Fields do not match'): ValidationRule<any> => ({
    validate: (value, formValues) => formValues && formValues[fieldToMatch] === value,
    message,
  }),
  
  notEmptyArray: (message = 'Please select at least one option'): ValidationRule<any[]> => ({
    validate: (value) => Array.isArray(value) && value.length > 0,
    message,
  }),
};

export default useFormValidation; 