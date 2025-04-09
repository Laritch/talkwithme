import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-expert.png'
  },
  category: {
    type: String,
    required: true,
    enum: ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical', 'Other']
  },
  specialization: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true,
    maxlength: 1000
  },
  credentials: {
    degree: String,
    certifications: [String],
    yearsOfExperience: Number,
    institution: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  consultationTypes: [{
    duration: {
      type: Number, // in minutes
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: String
  }],
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  metrics: {
    totalConsultations: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    retentionRate: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number, // in hours
      default: 0
    }
  },
  socialProfiles: {
    linkedin: String,
    twitter: String,
    website: String
  },
  languages: [String],
  acceptingNewClients: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  accountCreated: {
    type: Date,
    default: Date.now
  },
  documentUploads: [{
    name: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  // New fields for membership and loyalty features
  currentMembership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertMembership',
    default: null
  },
  membershipTier: {
    type: String,
    enum: ['basic', 'premium', 'elite'],
    default: 'basic'
  },
  baseCommissionRate: {
    type: Number,
    default: 0.18 // Default for basic tier
  },
  clientLoyaltyRelationships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientLoyalty'
  }],
  featuredExpert: {
    type: Boolean,
    default: false
  },
  searchPriority: {
    type: Number,
    default: 0 // Higher values will appear higher in search results
  },
  // Expert's region
  region: {
    type: String,
    default: 'global'
  },

  // Payment preferences
  paymentPreferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    minPayoutAmount: {
      type: Number,
      default: 50
    },
    autoPayout: {
      type: Boolean,
      default: false
    },
    payoutMethod: {
      type: String,
      enum: ['bank', 'paypal', 'stripe', 'telr', 'other'],
      default: 'bank'
    },
    payoutDetails: {
      // For bank transfers
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      swiftCode: String,
      iban: String,
      accountHolderName: String,

      // For PayPal
      paypalEmail: String,

      // For others
      otherDetails: mongoose.Schema.Types.Mixed
    }
  }
});

// Hash password before saving
expertSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if password is correct
expertSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile (without sensitive info)
expertSchema.methods.getPublicProfile = function() {
  const expertObj = this.toObject();

  // Remove sensitive fields
  delete expertObj.password;
  delete expertObj.verificationNotes;
  delete expertObj.verifiedBy;

  return expertObj;
};

// Methods to update status
expertSchema.methods.updateStatus = async function(status) {
  this.status = status;
  this.lastActive = new Date();
  return this.save();
};

// Method to update metrics after a consultation
expertSchema.methods.updateAfterConsultation = async function(consultationData) {
  // Update total consultations
  this.metrics.totalConsultations += 1;

  // Update total revenue
  this.metrics.totalRevenue += consultationData.price || 0;

  // Update completion rate
  if (consultationData.completed) {
    const completedCount = this.metrics.completionRate * (this.metrics.totalConsultations - 1);
    this.metrics.completionRate = (completedCount + 1) / this.metrics.totalConsultations;
  } else {
    const completedCount = this.metrics.completionRate * (this.metrics.totalConsultations - 1);
    this.metrics.completionRate = completedCount / this.metrics.totalConsultations;
  }

  // Update client loyalty if applicable
  if (consultationData.clientId && consultationData.completed) {
    try {
      const ClientLoyalty = mongoose.model('ClientLoyalty');

      // Find or create loyalty relationship
      let loyalty = await ClientLoyalty.findOne({
        expertId: this._id,
        clientId: consultationData.clientId
      });

      if (!loyalty) {
        // Create new loyalty relationship
        loyalty = new ClientLoyalty({
          expertId: this._id,
          clientId: consultationData.clientId,
          baseCommissionRate: this.baseCommissionRate,
          currentCommissionRate: this.baseCommissionRate,
          sessionCount: 0
        });

        // Add to expert's loyalty relationships
        this.clientLoyaltyRelationships.push(loyalty._id);
      }

      // Update session count and commission rates
      await loyalty.updateAfterSession();
    } catch (error) {
      console.error('Error updating client loyalty:', error);
    }
  }

  return this.save();
};

// Method to update rating
expertSchema.methods.updateRating = async function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;

  return this.save();
};

// Method to update membership tier
expertSchema.methods.updateMembershipTier = async function(tierName) {
  try {
    // Get tier data
    const MembershipTier = mongoose.model('MembershipTier');
    const ExpertMembership = mongoose.model('ExpertMembership');

    const tier = await MembershipTier.findOne({ name: tierName.toLowerCase() });
    if (!tier) throw new Error(`Membership tier ${tierName} not found`);

    // Update expert's tier data
    this.membershipTier = tierName.toLowerCase();
    this.baseCommissionRate = tier.commissionRate;

    // Set search priority and featured status based on tier
    if (tierName === 'elite') {
      this.searchPriority = 20;
      this.featuredExpert = true;
    } else if (tierName === 'premium') {
      this.searchPriority = 10;
      this.featuredExpert = false;
    } else {
      this.searchPriority = 0;
      this.featuredExpert = false;
    }

    // Create new membership record
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const membership = new ExpertMembership({
      expertId: this._id,
      tierId: tier._id,
      endDate: endDate,
      paymentMethod: 'credit_card', // Default
      paymentHistory: [{
        amount: tier.price,
        date: new Date(),
        status: 'completed',
        transactionId: `tr_${Date.now()}`
      }]
    });

    await membership.save();
    this.currentMembership = membership._id;

    return this.save();
  } catch (error) {
    console.error('Error updating membership tier:', error);
    throw error;
  }
};

// Static method to search experts
expertSchema.statics.searchExperts = async function(searchParams) {
  // Only include verified experts in search
  const query = { verificationStatus: 'verified' };

  // Add search criteria
  if (searchParams.category) {
    query.category = searchParams.category;
  }

  if (searchParams.specialization) {
    query.specialization = { $regex: searchParams.specialization, $options: 'i' };
  }

  if (searchParams.minRating) {
    query['rating.average'] = { $gte: parseFloat(searchParams.minRating) };
  }

  if (searchParams.languages) {
    query.languages = { $in: Array.isArray(searchParams.languages) ?
      searchParams.languages : [searchParams.languages] };
  }

  if (searchParams.acceptingNewClients) {
    query.acceptingNewClients = true;
  }

  // Get experts matching criteria
  let experts = await this.find(query)
    .select('-password -verificationNotes')
    .sort({ 'searchPriority': -1, 'rating.average': -1 }); // Sort by search priority first

  // Apply AI-powered matching if client data is provided
  if (searchParams.clientId && searchParams.query) {
    experts = await this.applyAIMatching(experts, searchParams.clientId, searchParams.query);
  }

  return experts;
};

// AI-powered matching method
expertSchema.statics.applyAIMatching = async function(experts, clientId, queryText) {
  try {
    // In a real implementation, this would call an ML service
    // For this demonstration, we'll use a simpler algorithm

    // Get client data
    const User = mongoose.model('User');
    const client = await User.findById(clientId);

    if (!client) return experts;

    // Get client's past consultations
    const ClientLoyalty = mongoose.model('ClientLoyalty');
    const loyalties = await ClientLoyalty.find({ clientId });

    // Get experts the client has worked with before
    const previousExpertIds = loyalties.map(l => l.expertId);

    // Score experts based on various factors
    const scoredExperts = experts.map(expert => {
      let score = 0;

      // Score 1: Previous relationship (highest weight)
      if (previousExpertIds.includes(expert._id.toString())) {
        score += 50;
      }

      // Score 2: Specialization match with query
      const specializationMatch = queryText.toLowerCase().includes(expert.specialization.toLowerCase()) ||
                                expert.specialization.toLowerCase().includes(queryText.toLowerCase());
      if (specializationMatch) {
        score += 30;
      }

      // Score 3: Rating (10 points per star above 3)
      if (expert.rating && expert.rating.average) {
        score += Math.max(0, (expert.rating.average - 3) * 10);
      }

      // Score 4: Response time (faster = better)
      if (expert.metrics && expert.metrics.responseTime) {
        // Lower response time gets higher score (max 10 points)
        score += Math.max(0, 10 - expert.metrics.responseTime);
      }

      return {
        expert,
        score,
        matchConfidence: score >= 70 ? "high" : score >= 40 ? "medium" : "low"
      };
    });

    // Sort by score (descending)
    scoredExperts.sort((a, b) => b.score - a.score);

    // Return experts in the new order
    return scoredExperts.map(item => ({
      ...item.expert.toObject(),
      matchScore: item.score,
      matchConfidence: item.matchConfidence
    }));
  } catch (error) {
    console.error("Error in AI matching:", error);
    return experts; // Return original list on error
  }
};

// Create indexes for faster searching
expertSchema.index({ category: 1, verificationStatus: 1 });
expertSchema.index({ specialization: 'text' });
expertSchema.index({ 'rating.average': -1 });
expertSchema.index({ searchPriority: -1 }); // Add index for search priority

const Expert = mongoose.model('Expert', expertSchema);

export default Expert;
