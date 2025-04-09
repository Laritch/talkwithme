// In a real application, this would connect to a database
// For demonstration, we use an in-memory store

export interface User {
  id: string;
  email: string;
  password: string; // This would be hashed in production
  name: string;
  role: 'user' | 'admin';
  region: string;
  defaultPaymentMethod?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  createdAt: Date;
}

// Mock users database
const users: User[] = [
  {
    id: '1',
    email: 'user@example.com',
    // In production, this would be hashed
    password: '$2a$10$8Dvuq1Oiw8AShpH92VzyxubgGfU2GsUE/imJL.QLDdQWkQP1aOPfK', // password123
    name: 'Regular User',
    role: 'user',
    region: 'Kenya',
    defaultPaymentMethod: 'mpesa',
    twoFactorEnabled: false,
    createdAt: new Date('2023-01-01')
  },
  {
    id: '2',
    email: 'admin@example.com',
    // In production, this would be hashed
    password: '$2a$10$8Dvuq1Oiw8AShpH92VzyxubgGfU2GsUE/imJL.QLDdQWkQP1aOPfK', // password123
    name: 'Admin User',
    role: 'admin',
    region: 'US',
    defaultPaymentMethod: 'payoneer',
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Example 2FA secret
    createdAt: new Date('2022-06-15')
  },
  {
    id: '3',
    email: 'user2@example.com',
    // In production, this would be hashed
    password: '$2a$10$8Dvuq1Oiw8AShpH92VzyxubgGfU2GsUE/imJL.QLDdQWkQP1aOPfK', // password123
    name: 'European User',
    role: 'user',
    region: 'EU',
    defaultPaymentMethod: 'payoneer',
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXZ', // Example 2FA secret
    createdAt: new Date('2023-03-20')
  }
];

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const user = users.find(u => u.email === email);
  return user || null;
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  const user = users.find(u => u.id === id);
  return user || null;
}

// Update user's last login
export async function updateUserLastLogin(id: string): Promise<void> {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      lastLogin: new Date()
    };
  }
}

// Enable 2FA for a user
export async function enableTwoFactor(id: string, secret: string): Promise<void> {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      twoFactorEnabled: true,
      twoFactorSecret: secret
    };
  }
}

// Update user's default payment method
export async function updateDefaultPaymentMethod(id: string, method: string): Promise<void> {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      defaultPaymentMethod: method
    };
  }
}

// Get user's preferred region for payment processing
export async function getUserRegion(id: string): Promise<string | null> {
  const user = await findUserById(id);
  return user ? user.region : null;
}
