/**
 * AI Message Analyzer
 *
 * This component analyzes messages for potential policy violations
 * and automatically flags suspicious content for admin review.
 */

// Configuration for content analysis
const ANALYSIS_CONFIG = {
    // Words and phrases that might indicate policy violations (simplified for demo)
    suspiciousTerms: [
        // Personal information solicitation
        "social security", "passport", "credit card", "bank account", "password",
        // External contact attempts
        "whatsapp", "telegram", "signal", "meet outside", "personal email",
        // Harassment indicators
        "idiot", "stupid", "hate you", "loser", "incompetent",
        // Scam indicators
        "guarantee results", "100% success", "secret method", "offshore", "untraceable",
        // Inappropriate solicitation
        "dating", "meet up", "personal relationship", "dinner together", "personal contact"
    ],

    // Violation categories for classification
    violationCategories: {
        PERSONAL_INFO: 'personal_info_solicitation',
        EXTERNAL_CONTACT: 'external_contact_attempt',
        HARASSMENT: 'harassment_or_abuse',
        SCAM: 'potential_scam',
        INAPPROPRIATE: 'inappropriate_solicitation',
        SPAM: 'spam_content'
    },

    // Severity levels for different violations
    severityLevels: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },

    // Confidence threshold for automated flagging (0-1)
    flaggingThreshold: 0.7
};

// Message Analyzer Class
class MessageAnalyzer {
    constructor(config = ANALYSIS_CONFIG) {
        this.config = config;
        this.analyzedMessages = [];

        // Initialize ML model if available
        this.modelReady = false;
        this.initializeModel();

        console.log("Message Analyzer initialized");
    }

    // Initialize ML model (in a real implementation, would load from a server)
    async initializeModel() {
        // Simulate model loading
        setTimeout(() => {
            this.modelReady = true;
            console.log("AI model ready for advanced analysis");
        }, 1000);
    }

    // Main analysis method
    analyzeMessage(message) {
        // Skip very short messages
        if (message.content.length < 5) {
            return {
                analyzed: false,
                reason: 'Message too short for analysis',
                violations: [],
                flagged: false
            };
        }

        // Normalize content for analysis
        const normalizedContent = message.content.toLowerCase();
        const violations = [];
        let highestSeverity = null;

        // Run all checks
        this.checkPersonalInfoSolicitation(normalizedContent, violations);
        this.checkExternalContactAttempt(normalizedContent, violations);
        this.checkHarassmentIndicators(normalizedContent, violations);
        this.checkScamIndicators(normalizedContent, violations);
        this.checkInappropriateSolicitation(normalizedContent, violations);
        this.checkSpamPatterns(normalizedContent, message, violations);

        // Determine highest severity level
        violations.forEach(violation => {
            if (!highestSeverity || this.getSeverityRank(violation.severity) > this.getSeverityRank(highestSeverity)) {
                highestSeverity = violation.severity;
            }
        });

        // Calculate confidence score
        const confidenceScore = this.calculateConfidenceScore(violations);

        // Determine if message should be auto-flagged
        const shouldFlag = confidenceScore >= this.config.flaggingThreshold;

        // Store analysis result
        const result = {
            messageId: message.id,
            analyzed: true,
            violations: violations,
            confidenceScore: confidenceScore,
            highestSeverity: highestSeverity,
            flagged: shouldFlag,
            flagReason: shouldFlag ? this.generateFlagReason(violations) : null,
            timestamp: new Date().toISOString()
        };

        this.analyzedMessages.push(result);

        // If message is flagged, trigger notification
        if (shouldFlag && typeof window.notifyAdmins === 'function') {
            window.notifyAdmins('message_flagged', {
                messageId: message.id,
                conversationId: message.conversationId,
                flagReason: result.flagReason,
                severity: highestSeverity,
                confidence: confidenceScore
            });
        }

        return result;
    }

    // Checks for personal information solicitation
    checkPersonalInfoSolicitation(content, violations) {
        const personalInfoTerms = [
            "social security", "ssn", "passport", "credit card", "bank account",
            "password", "id number", "account number", "routing number", "identification"
        ];

        const personalInfoPatterns = [
            /send .*(?:photo|picture|id|documentation|passport)/i,
            /share .*(?:account|login|password)/i,
            /need .*(?:personal|private|financial|bank) information/i
        ];

        if (this.matchesAnyTerm(content, personalInfoTerms) || this.matchesAnyPattern(content, personalInfoPatterns)) {
            violations.push({
                category: this.config.violationCategories.PERSONAL_INFO,
                severity: this.config.severityLevels.HIGH,
                details: 'Potential personal information solicitation detected'
            });
        }
    }

    // Checks for attempts to move conversation outside the platform
    checkExternalContactAttempt(content, violations) {
        const externalContactTerms = [
            "whatsapp", "telegram", "signal", "email me", "call me", "text me",
            "meet outside", "personal email", "phone number", "my cell", "direct message"
        ];

        const externalContactPatterns = [
            /(?:contact|reach|email|text|call|message) me (?:at|on|via|through|with)/i,
            /(?:here is|my|use|this is) (?:my|the) (?:email|phone|contact|whatsapp|telegram)/i,
            /let(?:'|')?s (?:talk|chat|meet|connect) (?:off|outside)/i,
            /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/ // Email pattern
        ];

        if (this.matchesAnyTerm(content, externalContactTerms) || this.matchesAnyPattern(content, externalContactPatterns)) {
            violations.push({
                category: this.config.violationCategories.EXTERNAL_CONTACT,
                severity: this.config.severityLevels.MEDIUM,
                details: 'Potential attempt to take communication outside the platform'
            });
        }
    }

    // Checks for harassment or abusive language
    checkHarassmentIndicators(content, violations) {
        const harassmentTerms = [
            "idiot", "stupid", "hate you", "loser", "incompetent", "moron", "useless",
            "pathetic", "worthless", "wasting my time", "terrible"
        ];

        // More complex patterns of harassment
        const harassmentPatterns = [
            /you (?:are|seem|sound|look) (?:stupid|dumb|incompetent|useless)/i,
            /(?:hate|despise) (?:you|your|working with you)/i,
            /(?:worst|terrible|horrible) (?:expert|service|advice|consultant)/i
        ];

        if (this.matchesAnyTerm(content, harassmentTerms) || this.matchesAnyPattern(content, harassmentPatterns)) {
            violations.push({
                category: this.config.violationCategories.HARASSMENT,
                severity: this.config.severityLevels.HIGH,
                details: 'Potential harassment or abusive language detected'
            });
        }
    }

    // Checks for potential scam indicators
    checkScamIndicators(content, violations) {
        const scamTerms = [
            "guarantee results", "100% success", "secret method", "offshore", "untraceable",
            "investment opportunity", "double your money", "risk-free", "hidden technique",
            "loophole", "quick rich", "tax-free", "bypass regulations"
        ];

        const scamPatterns = [
            /(?:guarantee|assured|certain|definite) (?:results|success|outcome|profit)/i,
            /(?:secret|special|unknown|exclusive) (?:method|technique|strategy|approach)/i,
            /(?:avoid|evade|bypass|circumvent) (?:tax|regulation|law|oversight|authorities)/i
        ];

        if (this.matchesAnyTerm(content, scamTerms) || this.matchesAnyPattern(content, scamPatterns)) {
            violations.push({
                category: this.config.violationCategories.SCAM,
                severity: this.config.severityLevels.HIGH,
                details: 'Potential scam or fraudulent content detected'
            });
        }
    }

    // Checks for inappropriate solicitation
    checkInappropriateSolicitation(content, violations) {
        const inappropriateTerms = [
            "dating", "meet up", "personal relationship", "dinner together", "personal contact",
            "romantic", "date", "relationship", "private meeting", "non-professional"
        ];

        const inappropriatePatterns = [
            /(?:meet|see) (?:you|each other) (?:in person|privately|outside)/i,
            /(?:interested in|looking for) (?:a|more than|beyond) (?:date|relationship|friendship)/i,
            /(?:personal|private|intimate) (?:relationship|connection|meeting)/i
        ];

        if (this.matchesAnyTerm(content, inappropriateTerms) || this.matchesAnyPattern(content, inappropriatePatterns)) {
            violations.push({
                category: this.config.violationCategories.INAPPROPRIATE,
                severity: this.config.severityLevels.MEDIUM,
                details: 'Potential inappropriate relationship solicitation'
            });
        }
    }

    // Checks for spam patterns
    checkSpamPatterns(content, message, violations) {
        // Check for excessive capitalization
        const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (content.length > 20 && uppercaseRatio > 0.5) {
            violations.push({
                category: this.config.violationCategories.SPAM,
                severity: this.config.severityLevels.LOW,
                details: 'Excessive capitalization (possible spam)'
            });
        }

        // Check for excessive repetition
        const wordCounts = {};
        const words = content.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
            if (word.length > 3) { // Only count meaningful words
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });

        const repeatedWords = Object.keys(wordCounts).filter(word => wordCounts[word] >= 4);
        if (repeatedWords.length > 0 && words.length > 20) {
            violations.push({
                category: this.config.violationCategories.SPAM,
                severity: this.config.severityLevels.LOW,
                details: 'Excessive word repetition (possible spam)'
            });
        }

        // Check for URLs - many URLs could indicate spam
        const urlCount = (content.match(/https?:\/\/\S+/g) || []).length;
        if (urlCount >= 3) {
            violations.push({
                category: this.config.violationCategories.SPAM,
                severity: this.config.severityLevels.LOW,
                details: 'Multiple URLs detected (possible spam)'
            });
        }
    }

    // Utility: Check if content contains any of the specified terms
    matchesAnyTerm(content, terms) {
        return terms.some(term => content.includes(term.toLowerCase()));
    }

    // Utility: Check if content matches any of the specified regex patterns
    matchesAnyPattern(content, patterns) {
        return patterns.some(pattern => pattern.test(content));
    }

    // Calculate a confidence score based on violations
    calculateConfidenceScore(violations) {
        if (violations.length === 0) return 0;

        // Assign weights to each severity level
        const severityWeights = {
            [this.config.severityLevels.LOW]: 0.3,
            [this.config.severityLevels.MEDIUM]: 0.6,
            [this.config.severityLevels.HIGH]: 0.8,
            [this.config.severityLevels.CRITICAL]: 1.0
        };

        // Calculate weighted score
        let totalWeight = 0;
        violations.forEach(violation => {
            totalWeight += severityWeights[violation.severity] || 0.5;
        });

        // Normalize score to 0-1 range with a cap
        let score = Math.min(totalWeight / 2, 1);
        return parseFloat(score.toFixed(2));
    }

    // Get numeric rank for severity level for comparison
    getSeverityRank(severity) {
        const ranks = {
            [this.config.severityLevels.LOW]: 1,
            [this.config.severityLevels.MEDIUM]: 2,
            [this.config.severityLevels.HIGH]: 3,
            [this.config.severityLevels.CRITICAL]: 4
        };
        return ranks[severity] || 0;
    }

    // Generate a human-readable flag reason
    generateFlagReason(violations) {
        if (violations.length === 0) return 'Unknown reason';

        // Use the highest severity violation as the primary reason
        let highestViolation = violations[0];
        for (let i = 1; i < violations.length; i++) {
            if (this.getSeverityRank(violations[i].severity) > this.getSeverityRank(highestViolation.severity)) {
                highestViolation = violations[i];
            }
        }

        const categoryDescriptions = {
            [this.config.violationCategories.PERSONAL_INFO]: 'Requesting personal information',
            [this.config.violationCategories.EXTERNAL_CONTACT]: 'Attempting to communicate outside platform',
            [this.config.violationCategories.HARASSMENT]: 'Harassment or abusive language',
            [this.config.violationCategories.SCAM]: 'Potential fraudulent activity',
            [this.config.violationCategories.INAPPROPRIATE]: 'Inappropriate relationship solicitation',
            [this.config.violationCategories.SPAM]: 'Spam or promotional content'
        };

        return categoryDescriptions[highestViolation.category] || highestViolation.details;
    }

    // Get analytics about analyzed messages
    getAnalytics() {
        const totalAnalyzed = this.analyzedMessages.length;
        const flaggedMessages = this.analyzedMessages.filter(m => m.flagged);

        // Count violations by category
        const violationsByCategory = {};
        flaggedMessages.forEach(message => {
            message.violations.forEach(violation => {
                violationsByCategory[violation.category] = (violationsByCategory[violation.category] || 0) + 1;
            });
        });

        // Count by severity
        const flaggedBySeverity = {};
        flaggedMessages.forEach(message => {
            flaggedBySeverity[message.highestSeverity] = (flaggedBySeverity[message.highestSeverity] || 0) + 1;
        });

        return {
            totalMessagesAnalyzed: totalAnalyzed,
            totalFlagged: flaggedMessages.length,
            flagRatio: totalAnalyzed > 0 ? flaggedMessages.length / totalAnalyzed : 0,
            violationsByCategory,
            flaggedBySeverity,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Initialize the analyzer when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance for the messaging system to use
    window.messageAnalyzer = new MessageAnalyzer();

    // Add message analysis to message sending process
    const originalSendMessage = window.sendMessage;
    if (typeof originalSendMessage === 'function') {
        window.sendMessage = function(...args) {
            // Get the message content (assuming it's the first argument)
            const messageContent = args[0];

            // Analyze the message before sending
            const analysisResult = window.messageAnalyzer.analyzeMessage({
                id: 'msg_' + Date.now(),
                content: messageContent,
                senderId: 'current_user', // Would be actual user ID in real app
                conversationId: 'current_conversation' // Would be actual conversation ID
            });

            // If flagged and above threshold, warn user
            if (analysisResult.confidenceScore > 0.5) {
                const proceed = confirm(
                    `This message may violate our community guidelines (${analysisResult.flagReason}).\n\n` +
                    `Do you want to continue sending it?`
                );

                if (!proceed) {
                    return false;
                }
            }

            // Call the original function with all arguments
            return originalSendMessage.apply(this, args);
        };
    }
});
