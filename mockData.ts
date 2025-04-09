import { Course } from '@/components/CourseCard';
import { Chat, Message } from '@/store/slices/chatSlice';

// User roles and mock users
export type UserRole = 'student' | 'instructor' | 'therapist' | 'legal_consultant' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string; // For experts (therapists, legal consultants)
  rating?: number; // For experts
  verified?: boolean; // For experts
}

// Mock Users
export const mockUsers: User[] = [
  // Students
  {
    id: 'student1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'student',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 'student2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    role: 'student',
    avatar: 'https://i.pravatar.cc/150?img=25',
  },

  // Instructors
  {
    id: 'instructor1',
    name: 'Prof. Robert Smith',
    email: 'robert.smith@example.com',
    role: 'instructor',
    avatar: 'https://i.pravatar.cc/150?img=3',
    specialization: 'Computer Science',
    verified: true,
  },
  {
    id: 'instructor2',
    name: 'Dr. Amanda Williams',
    email: 'amanda.w@example.com',
    role: 'instructor',
    avatar: 'https://i.pravatar.cc/150?img=13',
    specialization: 'Data Science',
    verified: true,
  },

  // Therapists
  {
    id: 'therapist1',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@example.com',
    role: 'therapist',
    avatar: 'https://i.pravatar.cc/150?img=32',
    specialization: 'Cognitive Behavioral Therapy',
    rating: 4.9,
    verified: true,
  },

  // Legal Consultants
  {
    id: 'legal1',
    name: 'James Wilson, Esq.',
    email: 'james.wilson@example.com',
    role: 'legal_consultant',
    avatar: 'https://i.pravatar.cc/150?img=8',
    specialization: 'Contract Law',
    rating: 4.7,
    verified: true,
  },

  // Clients
  {
    id: 'client1',
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    role: 'client',
    avatar: 'https://i.pravatar.cc/150?img=19',
  },
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course1',
    title: 'Introduction to JavaScript',
    instructor: 'Prof. Robert Smith',
    price: 49.99,
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    rating: 4.5,
    ratingCount: 1250,
    duration: '6h 30m',
    level: 'Beginner',
    category: 'Web Development',
    tags: ['JavaScript', 'Programming', 'Web'],
    discount: null,
    enrolledCount: 3500,
  },
  {
    id: 'course2',
    title: 'Advanced React Patterns',
    instructor: 'Prof. Robert Smith',
    price: 79.99,
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2',
    rating: 4.8,
    ratingCount: 850,
    duration: '8h 15m',
    level: 'Advanced',
    category: 'Web Development',
    tags: ['React', 'JavaScript', 'Frontend'],
    discount: 20,
    enrolledCount: 1800,
  },
  {
    id: 'course3',
    title: 'Python for Data Science',
    instructor: 'Dr. Amanda Williams',
    price: 69.99,
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935',
    rating: 4.6,
    ratingCount: 2100,
    duration: '10h 45m',
    level: 'Intermediate',
    category: 'Data Science',
    tags: ['Python', 'Data Analysis', 'Machine Learning'],
    discount: null,
    enrolledCount: 5200,
  },
  {
    id: 'course4',
    title: 'UI/UX Design Fundamentals',
    instructor: 'Sarah Thompson',
    price: 59.99,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    rating: 4.7,
    ratingCount: 1800,
    duration: '7h 20m',
    level: 'Beginner',
    category: 'Design',
    tags: ['UI/UX', 'Design', 'Figma'],
    discount: 15,
    enrolledCount: 2900,
  },
  {
    id: 'course5',
    title: 'Full Stack Web Development',
    instructor: 'Prof. Robert Smith',
    price: 89.99,
    thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159',
    rating: 4.9,
    ratingCount: 3200,
    duration: '15h 30m',
    level: 'Intermediate',
    category: 'Web Development',
    tags: ['Node.js', 'React', 'MongoDB', 'Full Stack'],
    discount: null,
    enrolledCount: 7800,
  },
  {
    id: 'course6',
    title: 'iOS App Development with Swift',
    instructor: 'David Miller',
    price: 79.99,
    thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890',
    rating: 4.5,
    ratingCount: 980,
    duration: '9h 15m',
    level: 'Intermediate',
    category: 'Mobile Development',
    tags: ['iOS', 'Swift', 'Mobile'],
    discount: null,
    enrolledCount: 1500,
  }
];

// Mock Chats
export const mockChats: Chat[] = [
  // Course-related chat
  {
    id: 'chat1',
    title: 'JavaScript Course Support',
    participants: [
      {
        id: 'student1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: 'student',
      },
      {
        id: 'instructor1',
        name: 'Prof. Robert Smith',
        avatar: 'https://i.pravatar.cc/150?img=3',
        role: 'instructor',
      },
    ],
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },

  // Another course chat
  {
    id: 'chat2',
    title: 'Python Data Science Assistance',
    participants: [
      {
        id: 'student1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: 'student',
      },
      {
        id: 'instructor2',
        name: 'Dr. Amanda Williams',
        avatar: 'https://i.pravatar.cc/150?img=13',
        role: 'instructor',
      },
    ],
    unreadCount: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },

  // Therapy session chat
  {
    id: 'chat3',
    title: 'Therapy Session - Dr. Emily Chen',
    participants: [
      {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor', // Using instructor as the role for UI display purposes
      },
    ],
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // Legal consultation chat
  {
    id: 'chat4',
    title: 'Legal Consultation - Contract Review',
    participants: [
      {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor', // Using instructor as the role for UI display purposes
      },
    ],
    unreadCount: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Messages
export const mockMessages: Record<string, Message[]> = {
  // JavaScript course chat
  'chat1': [
    {
      id: 'msg1',
      chatId: 'chat1',
      sender: {
        id: 'student1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: 'student',
      },
      content: 'Hello Professor, I have a question about JavaScript promises.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg2',
      chatId: 'chat1',
      sender: {
        id: 'instructor1',
        name: 'Prof. Robert Smith',
        avatar: 'https://i.pravatar.cc/150?img=3',
        role: 'instructor',
      },
      content: 'Hi John! What would you like to know about promises?',
      timestamp: new Date(Date.now() - 1 * 60 * 58 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg3',
      chatId: 'chat1',
      sender: {
        id: 'student1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: 'student',
      },
      content: 'I'm struggling with async/await syntax. Can you explain how it relates to promises?',
      timestamp: new Date(Date.now() - 1 * 60 * 56 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg4',
      chatId: 'chat1',
      sender: {
        id: 'instructor1',
        name: 'Prof. Robert Smith',
        avatar: 'https://i.pravatar.cc/150?img=3',
        role: 'instructor',
      },
      content: 'Sure! Async/await is syntactic sugar over promises. It makes asynchronous code look more like synchronous code.\n\nFor example, instead of using .then() chains, you can write:\n\nasync function fetchData() {\n  try {\n    const result = await fetch("/data");\n    const data = await result.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
  ],

  // Python course chat
  'chat2': [
    {
      id: 'msg5',
      chatId: 'chat2',
      sender: {
        id: 'instructor2',
        name: 'Dr. Amanda Williams',
        avatar: 'https://i.pravatar.cc/150?img=13',
        role: 'instructor',
      },
      content: 'Welcome to the Python Data Science course! Feel free to ask questions here.',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg6',
      chatId: 'chat2',
      sender: {
        id: 'student1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: 'student',
      },
      content: 'Thanks! I'm having trouble with the pandas groupby function. Can you help?',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg7',
      chatId: 'chat2',
      sender: {
        id: 'instructor2',
        name: 'Dr. Amanda Williams',
        avatar: 'https://i.pravatar.cc/150?img=13',
        role: 'instructor',
      },
      content: 'I'll prepare some examples for you. In the meantime, check out the pandas documentation section on groupby.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'delivered',
    },
  ],

  // Therapy chat
  'chat3': [
    {
      id: 'msg8',
      chatId: 'chat3',
      sender: {
        id: 'therapist1',
        name: 'Dr. Emily Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        role: 'instructor',
      },
      content: 'Hello Michael, how have you been feeling since our last session?',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg9',
      chatId: 'chat3',
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      content: 'Much better, Dr. Chen. I've been practicing those mindfulness exercises you recommended.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
  ],

  // Legal consultation chat
  'chat4': [
    {
      id: 'msg10',
      chatId: 'chat4',
      sender: {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
      content: 'Hello Michael, I've reviewed the contract you sent. There are a few clauses we should discuss.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg11',
      chatId: 'chat4',
      sender: {
        id: 'client1',
        name: 'Michael Brown',
        avatar: 'https://i.pravatar.cc/150?img=19',
        role: 'client',
      },
      content: 'Thanks for looking into this. Which clauses are concerning?',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg12',
      chatId: 'chat4',
      sender: {
        id: 'legal1',
        name: 'James Wilson, Esq.',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'instructor',
      },
      content: 'I'm concerned about the liability section on page 3 and the non-compete clause. I'll send you my recommendations shortly.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'delivered',
    },
  ]
};

// Update mockChats with last messages
for (const chatId in mockMessages) {
  const messages = mockMessages[chatId];
  if (messages.length > 0) {
    const chatIndex = mockChats.findIndex(chat => chat.id === chatId);
    if (chatIndex !== -1) {
      mockChats[chatIndex].lastMessage = messages[messages.length - 1];
    }
  }
}

// Enrollments mock data
export const mockEnrollments: Record<string, string[]> = {
  'student1': ['course1', 'course2', 'course3'],
  'student2': ['course1', 'course5'],
};
