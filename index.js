/**
 * Database Module
 *
 * This module provides a database-like interface for our JSON-based data storage.
 * It handles CRUD operations and manages data persistence.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Data file paths
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const RESOURCES_FILE = path.join(DATA_DIR, 'resources.json');
const FORUMS_FILE = path.join(DATA_DIR, 'forums.json');
const TOPICS_FILE = path.join(DATA_DIR, 'topics.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cache for data to avoid repeated disk reads
let cache = {
  users: null,
  messages: null,
  sessions: null,
  resources: null,
  forums: null,
  topics: null,
  posts: null,
  lastLoaded: {
    users: 0,
    messages: 0,
    sessions: 0,
    resources: 0,
    forums: 0,
    topics: 0,
    posts: 0
  }
};

// Cache TTL in milliseconds (5 seconds)
const CACHE_TTL = 5000;

/**
 * Load data from file
 * @param {string} type - Data type (users, messages, sessions, resources, forums, topics, posts)
 * @returns {Object|Array} The loaded data
 */
function loadData(type) {
  // Check if data is in cache and still fresh
  const now = Date.now();
  if (cache[type] && (now - cache.lastLoaded[type] < CACHE_TTL)) {
    return cache[type];
  }

  let filePath;
  let defaultValue;

  switch(type) {
    case 'users':
      filePath = USERS_FILE;
      defaultValue = {};
      break;
    case 'messages':
      filePath = MESSAGES_FILE;
      defaultValue = [];
      break;
    case 'sessions':
      filePath = SESSIONS_FILE;
      defaultValue = [];
      break;
    case 'resources':
      filePath = RESOURCES_FILE;
      defaultValue = [];
      break;
    case 'forums':
      filePath = FORUMS_FILE;
      defaultValue = [];
      break;
    case 'topics':
      filePath = TOPICS_FILE;
      defaultValue = [];
      break;
    case 'posts':
      filePath = POSTS_FILE;
      defaultValue = [];
      break;
    default:
      throw new Error(`Unknown data type: ${type}`);
  }

  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // Update cache
      cache[type] = data;
      cache.lastLoaded[type] = now;
      return data;
    } else {
      // File doesn't exist, return default value
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error loading ${type} data:`, error);
    return defaultValue;
  }
}

/**
 * Save data to file
 * @param {string} type - Data type (users, messages, sessions, resources, forums, topics, posts)
 * @param {Object|Array} data - The data to save
 * @returns {boolean} Success or failure
 */
function saveData(type, data) {
  let filePath;

  switch(type) {
    case 'users':
      filePath = USERS_FILE;
      break;
    case 'messages':
      filePath = MESSAGES_FILE;
      break;
    case 'sessions':
      filePath = SESSIONS_FILE;
      break;
    case 'resources':
      filePath = RESOURCES_FILE;
      break;
    case 'forums':
      filePath = FORUMS_FILE;
      break;
    case 'topics':
      filePath = TOPICS_FILE;
      break;
    case 'posts':
      filePath = POSTS_FILE;
      break;
    default:
      throw new Error(`Unknown data type: ${type}`);
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    // Update cache
    cache[type] = data;
    cache.lastLoaded[type] = Date.now();
    return true;
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    return false;
  }
}

/**
 * Clear cache for testing or when data changes externally
 */
function clearCache() {
  cache = {
    users: null,
    messages: null,
    sessions: null,
    resources: null,
    forums: null,
    topics: null,
    posts: null,
    lastLoaded: {
      users: 0,
      messages: 0,
      sessions: 0,
      resources: 0,
      forums: 0,
      topics: 0,
      posts: 0
    }
  };
}

// Generic CRUD operations

/**
 * Get all items of a type
 * @param {string} type - Data type
 * @returns {Array|Object} All items
 */
function getAll(type) {
  return loadData(type);
}

/**
 * Get item by ID
 * @param {string} type - Data type
 * @param {string} id - Item ID
 * @returns {Object|null} Found item or null
 */
function getById(type, id) {
  const data = loadData(type);

  if (type === 'users') {
    return data[id] || null;
  } else {
    return data.find(item => item.id === id) || null;
  }
}

/**
 * Find items by field value
 * @param {string} type - Data type
 * @param {string} field - Field to match on
 * @param {any} value - Value to match
 * @returns {Array} Matching items
 */
function findBy(type, field, value) {
  const data = loadData(type);

  if (type === 'users') {
    return Object.values(data).filter(item => item[field] === value);
  } else {
    return data.filter(item => item[field] === value);
  }
}

/**
 * Create new item
 * @param {string} type - Data type
 * @param {Object} item - Item to create
 * @returns {Object} Created item
 */
function create(type, item) {
  const data = loadData(type);
  const now = new Date().toISOString();

  // Generate ID if not provided
  if (!item.id) {
    item.id = uuidv4();
  }

  // Add timestamps
  item.createdAt = now;
  item.updatedAt = now;

  if (type === 'users') {
    data[item.id] = item;
  } else {
    data.push(item);
  }

  saveData(type, data);
  return item;
}

/**
 * Update existing item
 * @param {string} type - Data type
 * @param {string} id - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated item or null if not found
 */
function update(type, id, updates) {
  const data = loadData(type);
  updates.updatedAt = new Date().toISOString();

  if (type === 'users') {
    if (!data[id]) return null;

    data[id] = { ...data[id], ...updates };
    saveData(type, data);
    return data[id];
  } else {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...updates };
    saveData(type, data);
    return data[index];
  }
}

/**
 * Delete item by ID
 * @param {string} type - Data type
 * @param {string} id - Item ID
 * @returns {boolean} Success or failure
 */
function remove(type, id) {
  const data = loadData(type);

  if (type === 'users') {
    if (!data[id]) return false;

    delete data[id];
    return saveData(type, data);
  } else {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;

    data.splice(index, 1);
    return saveData(type, data);
  }
}

// Export database interface
module.exports = {
  users: {
    getAll: () => getAll('users'),
    getById: (id) => getById('users', id),
    findBy: (field, value) => findBy('users', field, value),
    create: (user) => create('users', user),
    update: (id, updates) => update('users', id, updates),
    remove: (id) => remove('users', id),
    findByEmail: (email) => findBy('users', 'email', email)[0] || null
  },
  messages: {
    getAll: () => getAll('messages'),
    getById: (id) => getById('messages', id),
    findBy: (field, value) => findBy('messages', field, value),
    create: (message) => create('messages', message),
    update: (id, updates) => update('messages', id, updates),
    remove: (id) => remove('messages', id),
    findBySenderId: (senderId) => findBy('messages', 'senderId', senderId),
    findByReceiverId: (receiverId) => findBy('messages', 'receiverId', receiverId),
    getConversation: (user1Id, user2Id) => {
      const messages = loadData('messages');
      return messages.filter(msg =>
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
  },
  sessions: {
    getAll: () => getAll('sessions'),
    getById: (id) => getById('sessions', id),
    findBy: (field, value) => findBy('sessions', field, value),
    create: (session) => create('sessions', session),
    update: (id, updates) => update('sessions', id, updates),
    remove: (id) => remove('sessions', id),
    findByExpertId: (expertId) => findBy('sessions', 'expertId', expertId),
    findByClientId: (clientId) => findBy('sessions', 'clientId', clientId),
    getUpcoming: () => {
      const sessions = loadData('sessions');
      const now = new Date();
      return sessions.filter(session => new Date(session.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
  },
  resources: {
    getAll: () => getAll('resources'),
    getById: (id) => getById('resources', id),
    findBy: (field, value) => findBy('resources', field, value),
    create: (resource) => create('resources', resource),
    update: (id, updates) => update('resources', id, updates),
    remove: (id) => remove('resources', id),
    findByCategory: (category) => findBy('resources', 'category', category),
    findFeatured: () => {
      const resources = loadData('resources');
      return resources.filter(resource => resource.featured);
    }
  },
  forums: {
    getAll: () => getAll('forums'),
    getById: (id) => getById('forums', id),
    findBy: (field, value) => findBy('forums', field, value),
    create: (forum) => create('forums', forum),
    update: (id, updates) => update('forums', id, updates),
    remove: (id) => remove('forums', id),
    updateCounts: (forumId) => {
      const forum = getById('forums', forumId);
      if (!forum) return null;

      const topics = loadData('topics').filter(topic => topic.forumId === forumId);
      const posts = loadData('posts').filter(post => post.forumId === forumId);

      const updates = {
        topicCount: topics.length,
        postCount: posts.length
      };

      return update('forums', forumId, updates);
    },
    getForumWithStats: (id) => {
      const forum = getById('forums', id);
      if (!forum) return null;

      const topics = loadData('topics').filter(topic => topic.forumId === id);
      const posts = loadData('posts').filter(post => post.forumId === id);

      const latestPosts = posts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      return {
        ...forum,
        topicCount: topics.length,
        postCount: posts.length,
        latestPosts
      };
    }
  },
  topics: {
    getAll: () => getAll('topics'),
    getById: (id) => getById('topics', id),
    findBy: (field, value) => findBy('topics', field, value),
    create: (topic) => {
      const newTopic = create('topics', topic);

      // Create first post
      if (newTopic) {
        const firstPost = {
          topicId: newTopic.id,
          forumId: newTopic.forumId,
          content: newTopic.content,
          authorId: newTopic.authorId,
          isFirstPost: true,
          status: 'active',
          reactions: { like: [], helpful: [] },
          attachments: []
        };

        create('posts', firstPost);

        // Update forum counts
        module.exports.forums.updateCounts(newTopic.forumId);
      }

      return newTopic;
    },
    update: (id, updates) => update('topics', id, updates),
    remove: (id) => {
      const topic = getById('topics', id);
      if (!topic) return false;

      // First remove all associated posts
      const posts = loadData('posts').filter(post => post.topicId === id);
      posts.forEach(post => remove('posts', post.id));

      // Then remove the topic
      const result = remove('topics', id);

      // Update forum counts
      if (result && topic.forumId) {
        module.exports.forums.updateCounts(topic.forumId);
      }

      return result;
    },
    findByForumId: (forumId) => findBy('topics', 'forumId', forumId),
    findByAuthorId: (authorId) => findBy('topics', 'authorId', authorId),
    incrementViews: (id) => {
      const topic = getById('topics', id);
      if (!topic) return null;

      return update('topics', id, { views: (topic.views || 0) + 1 });
    },
    getTopicWithPosts: (id) => {
      const topic = getById('topics', id);
      if (!topic) return null;

      const posts = loadData('posts')
        .filter(post => post.topicId === id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return {
        ...topic,
        posts
      };
    },
    search: (query) => {
      const topics = loadData('topics');
      const searchLower = query.toLowerCase();

      return topics.filter(topic =>
        topic.title.toLowerCase().includes(searchLower) ||
        topic.content.toLowerCase().includes(searchLower) ||
        (topic.tags && topic.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
  },
  posts: {
    getAll: () => getAll('posts'),
    getById: (id) => getById('posts', id),
    findBy: (field, value) => findBy('posts', field, value),
    create: (post) => {
      const newPost = create('posts', post);

      if (newPost) {
        // Update topic
        const topic = getById('topics', newPost.topicId);
        if (topic) {
          update('topics', topic.id, {
            lastPostAt: newPost.createdAt,
            postCount: (topic.postCount || 0) + 1
          });
        }

        // Update forum counts
        if (newPost.forumId) {
          module.exports.forums.updateCounts(newPost.forumId);
        }
      }

      return newPost;
    },
    update: (id, updates) => update('posts', id, updates),
    remove: (id) => {
      const post = getById('posts', id);
      if (!post) return false;

      // Remove the post
      const result = remove('posts', id);

      if (result) {
        // Update topic post count
        const topic = getById('topics', post.topicId);
        if (topic) {
          // Find new last post date
          const posts = loadData('posts')
            .filter(p => p.topicId === topic.id && p.id !== id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          const lastPostAt = posts.length > 0 ? posts[0].createdAt : topic.createdAt;

          update('topics', topic.id, {
            lastPostAt,
            postCount: Math.max(0, (topic.postCount || 0) - 1)
          });
        }

        // Update forum counts
        if (post.forumId) {
          module.exports.forums.updateCounts(post.forumId);
        }
      }

      return result;
    },
    findByTopicId: (topicId) => {
      const posts = findBy('posts', 'topicId', topicId);
      return posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    findByAuthorId: (authorId) => findBy('posts', 'authorId', authorId),
    addReaction: (id, userId, reactionType) => {
      const post = getById('posts', id);
      if (!post) return null;

      // Ensure reactions object exists
      if (!post.reactions) {
        post.reactions = { like: [], helpful: [] };
      }

      // Ensure the reaction type array exists
      if (!post.reactions[reactionType]) {
        post.reactions[reactionType] = [];
      }

      // Add user to the reaction if not already there
      if (!post.reactions[reactionType].includes(userId)) {
        post.reactions[reactionType].push(userId);
      }

      return update('posts', id, { reactions: post.reactions });
    },
    removeReaction: (id, userId, reactionType) => {
      const post = getById('posts', id);
      if (!post || !post.reactions || !post.reactions[reactionType]) return null;

      // Remove user from the reaction
      post.reactions[reactionType] = post.reactions[reactionType].filter(uid => uid !== userId);

      return update('posts', id, { reactions: post.reactions });
    }
  },
  clearCache
};
