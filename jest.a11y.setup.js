// Import testing-library methods
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Add custom jest matchers
expect.extend(toHaveNoViolations);
