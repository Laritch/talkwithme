import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String,
    required: true
  },
  // Add field for rich content (HTML)
  richContent: {
    type: String,
    default: null
  },
  fileUrl: String,
  fileType: String,
  fileName: String,
  isPrivate: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text'
  },
  deliveredAt: Date,
  isEncrypted: {
    type: Boolean,
    default: false
  },
  // Threading fields
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  threadCount: {
    type: Number,
    default: 0
  },
  // Add fields for quoting
  quotedMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  quotedText: String,
  quotedSender: String
}, { timestamps: true });

// Create indexes for faster querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ group: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Add method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  // If already read by this user, don't add again
  const alreadyRead = this.readBy.some(read =>
    read.user.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
  return this;
};

// Add static method to search messages by content
messageSchema.statics.searchMessages = async function(userId, searchTerm, options = {}) {
  const { limit = 20, page = 1, groupId = null } = options;
  const skip = (page - 1) * limit;

  // Construct query to search user's messages
  let query = {
    $or: [
      // Public messages
      { isPrivate: false, group: null },
      // Private messages sent or received by user
      {
        isPrivate: true,
        group: null,
        $or: [
          { sender: userId },
          { recipient: userId }
        ]
      }
    ],
    content: { $regex: searchTerm, $options: 'i' }
  };

  // If searching in a specific group
  if (groupId) {
    query = {
      group: groupId,
      content: { $regex: searchTerm, $options: 'i' }
    };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username profilePicture')
    .populate('recipient', 'username profilePicture')
    .populate('group', 'name avatar');
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
