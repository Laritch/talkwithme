import { nanoid } from 'nanoid';
import { Element, ElementType, ModerationStatus } from '../types';

// Sample demo elements to show moderation capabilities
export const createDemoElements = (userId: string): Element[] => {
  const now = Date.now();

  return [
    // Approved content
    {
      id: nanoid(),
      type: ElementType.Text,
      x: 50,
      y: 50,
      text: 'Welcome to Whiteboard Moderation Demo!',
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fontSize: 24,
      fontFamily: 'Arial',
      moderationStatus: ModerationStatus.Approved,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    },
    {
      id: nanoid(),
      type: ElementType.Text,
      x: 50,
      y: 100,
      text: 'Try adding some text and shapes.',
      strokeColor: '#2563eb',
      backgroundColor: 'transparent',
      fontSize: 16,
      fontFamily: 'Arial',
      moderationStatus: ModerationStatus.Approved,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    },

    // Flagged content (will be shown with warning indicator)
    {
      id: nanoid(),
      type: ElementType.Text,
      x: 50,
      y: 150,
      text: 'This text contains "offensive" content and will be flagged.',
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fontSize: 16,
      fontFamily: 'Arial',
      moderationStatus: ModerationStatus.Flagged,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    },

    // Rectangle (will be auto-approved)
    {
      id: nanoid(),
      type: ElementType.Rectangle,
      x: 500,
      y: 100,
      width: 150,
      height: 100,
      strokeColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      moderationStatus: ModerationStatus.Approved,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    },

    // Another flagged element
    {
      id: nanoid(),
      type: ElementType.Text,
      x: 300,
      y: 300,
      text: 'I think this is inappropriate text',
      strokeColor: '#ef4444',
      backgroundColor: 'transparent',
      fontSize: 16,
      fontFamily: 'Arial',
      moderationStatus: ModerationStatus.Flagged,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    },
  ];
};

export default createDemoElements;
