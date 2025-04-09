const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const db = require('./db');
const recommendationService = require('./services/recommendationService');

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'letschat_development_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS for socket.io
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === 'production' ? 'https://your-production-domain.com' : CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' ? 'https://your-production-domain.com' : CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname))); // Serve files from the current directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Check for token in cookies or Authorization header
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'client' } = req.body;

    // Check if user already exists
    const existingUser = db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = db.users.create({
      email,
      passwordHash,
      name,
      role,
      status: 'online',
      avatar: `/uploads/avatars/default-${role}.png` // Default avatar based on role
    });

    // Remove sensitive data before sending response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    // Generate token
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update user status
    db.users.update(user.id, { status: 'online' });

    // Remove sensitive data before sending response
    const { passwordHash, ...userWithoutPassword } = user;

    // Generate token
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // Clear token cookie
  res.clearCookie('token');

  // Update user status
  if (req.user && req.user.id) {
    db.users.update(req.user.id, { status: 'offline' });
  }

  res.json({ message: 'Logout successful' });
});

// User routes
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    // Get all users
    const allUsers = db.users.getAll();

    // Remove sensitive data
    const users = Object.values(allUsers).map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Get user
    const user = db.users.getById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Message routes
app.get('/api/messages', authenticateToken, (req, res) => {
  try {
    const { userId } = req.query;

    if (userId) {
      // Get conversation between current user and specified user
      const messages = db.messages.getConversation(req.user.id, userId);
      return res.json(messages);
    }

    // Get all messages for current user
    const sentMessages = db.messages.findBySenderId(req.user.id);
    const receivedMessages = db.messages.findByReceiverId(req.user.id);
    const messages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const { receiverId, content, type = 'text' } = req.body;

    // Create message
    const message = db.messages.create({
      senderId: req.user.id,
      receiverId,
      content,
      type,
      timestamp: new Date().toISOString(),
      read: false
    });

    // Emit message through socket
    io.to(receiverId).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Session routes
app.get('/api/sessions', authenticateToken, (req, res) => {
  try {
    let sessions;

    if (req.user.role === 'expert') {
      // Get sessions where user is expert
      sessions = db.sessions.findByExpertId(req.user.id);
    } else if (req.user.role === 'client') {
      // Get sessions where user is client
      sessions = db.sessions.findByClientId(req.user.id);
    } else if (req.user.role === 'admin') {
      // Admins can see all sessions
      sessions = db.sessions.getAll();
    } else {
      sessions = [];
    }

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

app.post('/api/sessions', authenticateToken, (req, res) => {
  try {
    const { expertId, title, startTime, endTime, notes, type } = req.body;

    // Create session
    const session = db.sessions.create({
      expertId,
      clientId: req.user.id,
      title,
      startTime,
      endTime,
      status: 'scheduled',
      notes,
      type
    });

    // Notify expert
    io.to(expertId).emit('new_session', session);

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session' });
  }
});

app.patch('/api/sessions/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get session
    const session = db.sessions.getById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update session status
    const updatedSession = db.sessions.update(id, { status });

    // Notify users
    io.to(session.expertId).emit('session_updated', updatedSession);
    io.to(session.clientId).emit('session_updated', updatedSession);

    res.json(updatedSession);
  } catch (error) {
    console.error(`Error updating session ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating session' });
  }
});

// Resource routes
app.get('/api/resources', authenticateToken, (req, res) => {
  try {
    const { category, featured } = req.query;

    let resources;

    if (category) {
      // Get resources by category
      resources = db.resources.findByCategory(category);
    } else if (featured === 'true') {
      // Get featured resources
      resources = db.resources.findFeatured();
    } else {
      // Get all resources
      resources = db.resources.getAll();
    }

    // Filter by access level based on user role
    resources = resources.filter(resource => {
      if (resource.accessLevel === 'all') return true;
      if (resource.accessLevel === 'premium' && (req.user.role === 'expert' || req.user.role === 'admin')) return true;
      return false;
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

app.post('/api/resources', authenticateToken, (req, res) => {
  try {
    // Only experts and admins can create resources
    if (req.user.role !== 'expert' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to create resources' });
    }

    const { title, type, category, tags, url, description, featured, accessLevel } = req.body;

    // Create resource
    const resource = db.resources.create({
      title,
      type,
      category,
      tags,
      url,
      createdBy: req.user.id,
      description,
      featured: featured || false,
      accessLevel: accessLevel || 'all'
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Error creating resource' });
  }
});

// Forum routes
app.get('/api/forums', (req, res) => {
  try {
    const forums = db.forums.getAll();
    res.json(forums);
  } catch (error) {
    console.error('Error fetching forums:', error);
    res.status(500).json({ message: 'Error fetching forums' });
  }
});

app.get('/api/forums/:id', (req, res) => {
  try {
    const { id } = req.params;
    const forum = db.forums.getForumWithStats(id);

    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    res.json(forum);
  } catch (error) {
    console.error(`Error fetching forum ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching forum' });
  }
});

app.post('/api/forums', authenticateToken, (req, res) => {
  try {
    // Only admins can create forums
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to create forums' });
    }

    const { title, description, moderatorIds, imageUrl } = req.body;

    const forum = db.forums.create({
      title,
      description,
      moderatorIds: moderatorIds || [],
      imageUrl: imageUrl || null,
      status: 'active',
      order: Date.now(), // Use timestamp as order for now
      topicCount: 0,
      postCount: 0
    });

    res.status(201).json(forum);
  } catch (error) {
    console.error('Error creating forum:', error);
    res.status(500).json({ message: 'Error creating forum' });
  }
});

app.put('/api/forums/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Only admins or moderators can update forums
    const forum = db.forums.getById(id);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    if (req.user.role !== 'admin' && !forum.moderatorIds.includes(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized to update forum' });
    }

    const { title, description, moderatorIds, imageUrl, status, order } = req.body;

    // Admins can update all fields, moderators can only update some
    let updates = {};

    if (req.user.role === 'admin') {
      // Admin can update all fields
      updates = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(moderatorIds !== undefined && { moderatorIds }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status !== undefined && { status }),
        ...(order !== undefined && { order })
      };
    } else {
      // Moderators can only update description
      updates = {
        ...(description !== undefined && { description })
      };
    }

    const updatedForum = db.forums.update(id, updates);

    res.json(updatedForum);
  } catch (error) {
    console.error(`Error updating forum ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating forum' });
  }
});

// Topic routes
app.get('/api/forums/:forumId/topics', (req, res) => {
  try {
    const { forumId } = req.params;
    const { sort = 'latest' } = req.query;

    // Check if forum exists
    const forum = db.forums.getById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    // Get topics for this forum
    let topics = db.topics.findByForumId(forumId);

    // Sort topics
    switch (sort) {
      case 'latest':
        topics = topics.sort((a, b) => new Date(b.lastPostAt) - new Date(a.lastPostAt));
        break;
      case 'popular':
        topics = topics.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
        topics = topics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        topics = topics.sort((a, b) => new Date(b.lastPostAt) - new Date(a.lastPostAt));
    }

    res.json(topics);
  } catch (error) {
    console.error(`Error fetching topics for forum ${req.params.forumId}:`, error);
    res.status(500).json({ message: 'Error fetching topics' });
  }
});

app.get('/api/topics/:id', (req, res) => {
  try {
    const { id } = req.params;
    const topic = db.topics.getTopicWithPosts(id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Increment view count
    db.topics.incrementViews(id);

    res.json(topic);
  } catch (error) {
    console.error(`Error fetching topic ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching topic' });
  }
});

app.post('/api/forums/:forumId/topics', authenticateToken, (req, res) => {
  try {
    const { forumId } = req.params;
    const { title, content, tags } = req.body;

    // Check if forum exists and is active
    const forum = db.forums.getById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    if (forum.status !== 'active') {
      return res.status(400).json({ message: 'Cannot create topic in inactive forum' });
    }

    // Create new topic
    const topic = db.topics.create({
      forumId,
      title,
      content,
      authorId: req.user.id,
      isPinned: false,
      isLocked: false,
      views: 0,
      lastPostAt: new Date().toISOString(),
      status: 'active',
      postCount: 1,
      tags: tags || []
    });

    res.status(201).json(topic);
  } catch (error) {
    console.error(`Error creating topic in forum ${req.params.forumId}:`, error);
    res.status(500).json({ message: 'Error creating topic' });
  }
});

app.put('/api/topics/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, isPinned, isLocked, status, tags } = req.body;

    // Get topic
    const topic = db.topics.getById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Get forum
    const forum = db.forums.getById(topic.forumId);

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isModerator = forum && forum.moderatorIds.includes(req.user.id);
    const isAuthor = topic.authorId === req.user.id;

    if (!isAdmin && !isModerator && !isAuthor) {
      return res.status(403).json({ message: 'Unauthorized to update topic' });
    }

    // Different updates based on role
    let updates = {};

    if (isAdmin || isModerator) {
      // Admins and moderators can update all fields
      updates = {
        ...(title !== undefined && { title }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isLocked !== undefined && { isLocked }),
        ...(status !== undefined && { status }),
        ...(tags !== undefined && { tags })
      };
    } else if (isAuthor) {
      // Authors can only update title and tags
      updates = {
        ...(title !== undefined && { title }),
        ...(tags !== undefined && { tags })
      };
    }

    const updatedTopic = db.topics.update(id, updates);

    res.json(updatedTopic);
  } catch (error) {
    console.error(`Error updating topic ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating topic' });
  }
});

// Post routes
app.post('/api/topics/:topicId/posts', authenticateToken, (req, res) => {
  try {
    const { topicId } = req.params;
    const { content, attachments } = req.body;

    // Get topic
    const topic = db.topics.getById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if topic is locked
    if (topic.isLocked) {
      return res.status(400).json({ message: 'Cannot reply to locked topic' });
    }

    // Create new post
    const post = db.posts.create({
      topicId,
      forumId: topic.forumId,
      content,
      authorId: req.user.id,
      isFirstPost: false,
      status: 'active',
      reactions: { like: [], helpful: [] },
      attachments: attachments || []
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(`Error creating post in topic ${req.params.topicId}:`, error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { content, status } = req.body;

    // Get post
    const post = db.posts.getById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get topic and forum
    const topic = db.topics.getById(post.topicId);
    const forum = topic ? db.forums.getById(topic.forumId) : null;

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isModerator = forum && forum.moderatorIds.includes(req.user.id);
    const isAuthor = post.authorId === req.user.id;

    if (!isAdmin && !isModerator && !isAuthor) {
      return res.status(403).json({ message: 'Unauthorized to update post' });
    }

    // Different updates based on role
    let updates = {};

    if (isAdmin || isModerator) {
      // Admins and moderators can update content and status
      updates = {
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status })
      };
    } else if (isAuthor) {
      // Authors can only update content
      updates = {
        ...(content !== undefined && { content })
      };
    }

    const updatedPost = db.posts.update(id, updates);

    res.json(updatedPost);
  } catch (error) {
    console.error(`Error updating post ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating post' });
  }
});

// Post reactions
app.post('/api/posts/:id/reactions', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    // Validate reaction type
    if (!['like', 'helpful'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    // Add reaction
    const post = db.posts.addReaction(id, req.user.id, type);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Reaction added', post });
  } catch (error) {
    console.error(`Error adding reaction to post ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error adding reaction' });
  }
});

app.delete('/api/posts/:id/reactions/:type', authenticateToken, (req, res) => {
  try {
    const { id, type } = req.params;

    // Validate reaction type
    if (!['like', 'helpful'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    // Remove reaction
    const post = db.posts.removeReaction(id, req.user.id, type);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Reaction removed', post });
  } catch (error) {
    console.error(`Error removing reaction from post ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error removing reaction' });
  }
});

// Search topics
app.get('/api/search/topics', (req, res) => {
  try {
    const { query, forumId } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search topics
    let results = db.topics.search(query);

    // Filter by forum if specified
    if (forumId) {
      results = results.filter(topic => topic.forumId === forumId);
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching topics:', error);
    res.status(500).json({ message: 'Error searching topics' });
  }
});

// Recommendation API
app.get('/api/recommendations/forums', authenticateToken, (req, res) => {
  try {
    const { limit } = req.query;
    const userId = req.user.id;

    const recommendations = recommendationService.getForumRecommendations(
      userId,
      limit ? parseInt(limit, 10) : undefined
    );

    // Track this interaction
    recommendationService.trackUserInteraction(
      userId,
      null,
      null,
      'view',
      { recommendationType: 'forums' }
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting forum recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

app.get('/api/recommendations/topics/:forumId', authenticateToken, (req, res) => {
  try {
    const { forumId } = req.params;
    const { limit } = req.query;
    const userId = req.user.id;

    const recommendations = recommendationService.getTopicRecommendations(
      userId,
      forumId,
      limit ? parseInt(limit, 10) : undefined
    );

    // Track this interaction
    recommendationService.trackUserInteraction(
      userId,
      forumId,
      null,
      'view',
      { recommendationType: 'topics' }
    );

    res.json(recommendations);
  } catch (error) {
    console.error(`Error getting topic recommendations for forum ${req.params.forumId}:`, error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

app.post('/api/recommendations/feedback', authenticateToken, (req, res) => {
  try {
    const { recommendationId, forumId, rating } = req.body;
    const userId = req.user.id;

    if (!recommendationId || !forumId || rating === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const success = recommendationService.trackUserInteraction(
      userId,
      forumId,
      null,
      'recommendation_feedback',
      { recommendationId, forumId, rating }
    );

    if (success) {
      res.json({ message: 'Feedback recorded successfully' });
    } else {
      res.status(500).json({ message: 'Failed to record feedback' });
    }
  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    res.status(500).json({ message: 'Error recording feedback' });
  }
});

app.post('/api/user/interests', authenticateToken, (req, res) => {
  try {
    const { interest } = req.body;
    const userId = req.user.id;

    if (!interest) {
      return res.status(400).json({ message: 'Interest is required' });
    }

    const success = recommendationService.trackUserInteraction(
      userId,
      null,
      null,
      'explicit_interest',
      { interest }
    );

    if (success) {
      res.json({ message: 'Interest added successfully' });
    } else {
      res.status(500).json({ message: 'Failed to add interest' });
    }
  } catch (error) {
    console.error('Error adding user interest:', error);
    res.status(500).json({ message: 'Error adding interest' });
  }
});

app.get('/api/user/segment', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const segment = recommendationService.getUserSegment(userId);

    res.json(segment);
  } catch (error) {
    console.error('Error getting user segment:', error);
    res.status(500).json({ message: 'Error getting user segment' });
  }
});

// Track page view
app.post('/api/track/view', authenticateToken, (req, res) => {
  try {
    const { forumId, topicId, duration } = req.body;
    const userId = req.user.id;

    if (!forumId) {
      return res.status(400).json({ message: 'Forum ID is required' });
    }

    const success = recommendationService.trackUserInteraction(
      userId,
      forumId,
      topicId,
      'view',
      { duration: duration || 0 }
    );

    if (success) {
      res.json({ message: 'View tracked successfully' });
    } else {
      res.status(500).json({ message: 'Failed to track view' });
    }
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ message: 'Error tracking view' });
  }
});

// Track search
app.post('/api/track/search', authenticateToken, (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const success = recommendationService.trackUserInteraction(
      userId,
      null,
      null,
      'search',
      { query }
    );

    if (success) {
      res.json({ message: 'Search tracked successfully' });
    } else {
      res.status(500).json({ message: 'Failed to track search' });
    }
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ message: 'Error tracking search' });
  }
});

// Track forum click
app.post('/api/track/click', authenticateToken, (req, res) => {
  try {
    const { forumId } = req.body;
    const userId = req.user.id;

    if (!forumId) {
      return res.status(400).json({ message: 'Forum ID is required' });
    }

    const success = recommendationService.trackUserInteraction(
      userId,
      forumId,
      null,
      'click',
      {}
    );

    if (success) {
      res.json({ message: 'Click tracked successfully' });
    } else {
      res.status(500).json({ message: 'Failed to track click' });
    }
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Error tracking click' });
  }
});

// Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.name);

  // Update user status
  if (socket.user?.id) {
    db.users.update(socket.user.id, { status: 'online' });

    // Join room for user ID to receive direct messages
    socket.join(socket.user.id);

    // Notify other users
    socket.broadcast.emit('userStatusChanged', {
      userId: socket.user.id,
      status: 'online'
    });
  }

  // Handle sending messages
  socket.on('send_message', (messageData, callback) => {
    try {
      const { receiverId, content, type = 'text' } = messageData;

      // Create message
      const message = db.messages.create({
        senderId: socket.user.id,
        receiverId,
        content,
        type,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Send to receiver
      socket.to(receiverId).emit('new_message', message);

      // Acknowledge receipt
      if (callback) {
        callback({
          status: 'success',
          message
        });
      }
    } catch (error) {
      console.error('Error handling send_message:', error);
      if (callback) {
        callback({
          status: 'error',
          message: 'Failed to send message'
        });
      }
    }
  });

  // Handle joining a session room
  socket.on('join_session', (sessionId) => {
    console.log(`User ${socket.user.name} joined session ${sessionId}`);
    socket.join(`session-${sessionId}`);
  });

  // Handle leaving a session room
  socket.on('leave_session', (sessionId) => {
    console.log(`User ${socket.user.name} left session ${sessionId}`);
    socket.leave(`session-${sessionId}`);
  });

  // Handle marking messages as read
  socket.on('mark_messages_read', ({ senderId }) => {
    try {
      // Get unread messages from sender
      const messages = db.messages.getConversation(socket.user.id, senderId)
        .filter(msg => msg.senderId === senderId && !msg.read);

      // Mark messages as read
      messages.forEach(msg => {
        db.messages.update(msg.id, { read: true });
      });

      // Notify sender that messages were read
      socket.to(senderId).emit('messages_read', {
        userId: socket.user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle forum topic and post events
  socket.on('join_forum', (forumId) => {
    console.log(`User ${socket.user.name} joined forum ${forumId}`);
    socket.join(`forum-${forumId}`);
  });

  socket.on('leave_forum', (forumId) => {
    console.log(`User ${socket.user.name} left forum ${forumId}`);
    socket.leave(`forum-${forumId}`);
  });

  socket.on('join_topic', (topicId) => {
    console.log(`User ${socket.user.name} joined topic ${topicId}`);
    socket.join(`topic-${topicId}`);
  });

  socket.on('leave_topic', (topicId) => {
    console.log(`User ${socket.user.name} left topic ${topicId}`);
    socket.leave(`topic-${topicId}`);
  });

  socket.on('new_forum_post', async (postData, callback) => {
    try {
      const { topicId, content, attachments } = postData;

      // Get topic
      const topic = db.topics.getById(topicId);
      if (!topic) {
        return callback({
          status: 'error',
          message: 'Topic not found'
        });
      }

      // Check if topic is locked
      if (topic.isLocked) {
        return callback({
          status: 'error',
          message: 'Cannot reply to locked topic'
        });
      }

      // Create new post
      const post = db.posts.create({
        topicId,
        forumId: topic.forumId,
        content,
        authorId: socket.user.id,
        isFirstPost: false,
        status: 'active',
        reactions: { like: [], helpful: [] },
        attachments: attachments || []
      });

      // Get author information to include with the post
      const author = db.users.getById(socket.user.id);
      const authorInfo = author ? {
        id: author.id,
        name: author.name,
        avatar: author.avatar,
        role: author.role
      } : null;

      // Emit to topic room
      io.to(`topic-${topicId}`).emit('forum_post_created', {
        ...post,
        author: authorInfo
      });

      // Emit to forum room
      io.to(`forum-${topic.forumId}`).emit('topic_updated', {
        id: topic.id,
        lastPostAt: post.createdAt,
        postCount: topic.postCount + 1
      });

      // Acknowledge receipt
      if (callback) {
        callback({
          status: 'success',
          post
        });
      }
    } catch (error) {
      console.error('Error handling new_forum_post:', error);
      if (callback) {
        callback({
          status: 'error',
          message: 'Failed to create post'
        });
      }
    }
  });

  socket.on('forum_typing', ({ topicId, isTyping }) => {
    socket.to(`topic-${topicId}`).emit('forum_user_typing', {
      topicId,
      userId: socket.user.id,
      userName: socket.user.name,
      isTyping
    });
  });

  // Handle moderation events
  socket.on('moderate_post', async ({ postId, action, reason }, callback) => {
    try {
      const post = db.posts.getById(postId);
      if (!post) {
        return callback({
          status: 'error',
          message: 'Post not found'
        });
      }

      // Get topic and forum
      const topic = db.topics.getById(post.topicId);
      const forum = topic ? db.forums.getById(topic.forumId) : null;

      // Check if user is a moderator or admin
      const isAdmin = socket.user.role === 'admin';
      const isModerator = forum && forum.moderatorIds.includes(socket.user.id);

      if (!isAdmin && !isModerator) {
        return callback({
          status: 'error',
          message: 'Unauthorized to moderate posts'
        });
      }

      let updatedPost;

      switch (action) {
        case 'hide':
          updatedPost = db.posts.update(postId, {
            status: 'hidden',
            moderationInfo: {
              moderatorId: socket.user.id,
              action: 'hide',
              reason,
              timestamp: new Date().toISOString()
            }
          });
          break;

        case 'restore':
          updatedPost = db.posts.update(postId, {
            status: 'active',
            moderationInfo: {
              moderatorId: socket.user.id,
              action: 'restore',
              reason,
              timestamp: new Date().toISOString()
            }
          });
          break;

        default:
          return callback({
            status: 'error',
            message: 'Invalid moderation action'
          });
      }

      // Emit to topic room
      io.to(`topic-${post.topicId}`).emit('post_moderated', {
        postId,
        action,
        moderatorId: socket.user.id,
        moderatorName: socket.user.name,
        timestamp: updatedPost.moderationInfo.timestamp
      });

      // Acknowledge receipt
      if (callback) {
        callback({
          status: 'success',
          post: updatedPost
        });
      }
    } catch (error) {
      console.error('Error handling moderate_post:', error);
      if (callback) {
        callback({
          status: 'error',
          message: 'Failed to moderate post'
        });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user?.name || 'Anonymous');

    if (socket.user?.id) {
      const userId = socket.user.id;

      // Update user status
      db.users.update(userId, { status: 'offline' });

      // Notify other users
      socket.broadcast.emit('userStatusChanged', {
        userId,
        status: 'offline'
      });
    }
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html from the current directory
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the server at http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});
