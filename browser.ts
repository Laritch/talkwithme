import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Export the worker instance
export const worker = setupWorker(...handlers);
