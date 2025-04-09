/**
 * Utility functions for the chat application
 */

// Format timestamp for display
export const formatTimestamp = (timestamp) => {
  const messageTime = new Date(timestamp);
  return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Get file icon based on mimetype
export const getFileIcon = (mimetype) => {
  if (mimetype.includes('image')) return 'fa-image';
  if (mimetype.includes('pdf')) return 'fa-file-pdf';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'fa-file-word';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'fa-file-excel';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) return 'fa-file-archive';
  if (mimetype.includes('audio')) return 'fa-file-audio';
  if (mimetype.includes('video')) return 'fa-file-video';
  if (mimetype.includes('text')) return 'fa-file-alt';
  return 'fa-file';
};

// Debounce function to limit function calls
export const debounce = (func, delay) => {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Store data in localStorage
export const storeUserData = (userData) => {
  localStorage.setItem('chat_user', JSON.stringify(userData));
};

// Retrieve user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('chat_user');
  return userData ? JSON.parse(userData) : null;
};

// Clear user data on logout
export const clearUserData = () => {
  localStorage.removeItem('chat_user');
};

// Handle file uploads
export const uploadFile = async (file, endpoint) => {
  try {
    const formData = new FormData();
    formData.append('attachment', file);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Handle profile picture uploads
export const uploadProfilePicture = async (file, userId) => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('userId', userId);

    const response = await fetch('/api/users/profile-picture', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Profile picture upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile upload error:', error);
    throw error;
  }
};

// Check if a file is an image
export const isImageFile = (mimetype) => {
  return mimetype.startsWith('image/');
};

// Create a displayable filename (truncate if too long)
export const truncateFilename = (filename, maxLength = 20) => {
  if (filename.length <= maxLength) return filename;

  const extension = filename.split('.').pop();
  const name = filename.substring(0, filename.length - extension.length - 1);

  const truncatedName = name.substring(0, maxLength - extension.length - 3) + '...';
  return `${truncatedName}.${extension}`;
};
