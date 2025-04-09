import axios from 'axios';
import { ModerationReason, ModerationResult, ModerationStatus, Element } from '../types';

// Default blocklist for text moderation
const DEFAULT_BLOCKLIST = [
  'profanity',
  'offensive',
  'inappropriate',
  // Add more default blocked terms
];

// Default patterns to catch in drawings (simplified for demo)
const DEFAULT_PATTERN_BLOCKLIST = [
  // These would be more sophisticated in a real system
  'penis',
  'swastika',
  'middle finger',
];

interface ModerateTextOptions {
  sensitivity?: number;
  customBlocklist?: string[];
  customAllowlist?: string[];
}

interface ModerateDrawingOptions {
  sensitivity?: number;
}

class ModerationService {
  private apiKey: string | null = null;
  private apiEndpoint = 'https://api.content-moderation.example.com/v1/moderate';
  private blockList: string[] = [...DEFAULT_BLOCKLIST];
  private allowList: string[] = [];
  private sensitivity = 75; // Default sensitivity (0-100)

  constructor() {
    // In a real implementation, you'd load these from environment or config
    this.apiKey = null; // process.env.MODERATION_API_KEY;
  }

  // Configure the moderation service
  configure(options: {
    apiKey?: string;
    apiEndpoint?: string;
    blockList?: string[];
    allowList?: string[];
    sensitivity?: number;
  }) {
    if (options.apiKey) this.apiKey = options.apiKey;
    if (options.apiEndpoint) this.apiEndpoint = options.apiEndpoint;
    if (options.blockList) this.blockList = [...DEFAULT_BLOCKLIST, ...options.blockList];
    if (options.allowList) this.allowList = options.allowList;
    if (options.sensitivity !== undefined) this.sensitivity = options.sensitivity;
  }

  // Check text content using external API
  async moderateTextExternal(text: string): Promise<ModerationResult> {
    try {
      if (!this.apiKey) {
        return this.moderateTextLocal(text);
      }

      const response = await axios.post(
        this.apiEndpoint,
        {
          text,
          sensitivity: this.sensitivity,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const data = response.data;
      return {
        status: this.mapApiStatusToInternal(data.status),
        reason: this.determineReason(data),
        confidence: data.confidence || 0,
        message: data.message || '',
      };
    } catch (error) {
      console.error('Error calling moderation API:', error);
      // Fallback to local moderation if API fails
      return this.moderateTextLocal(text);
    }
  }

  // Local text moderation as fallback or for simple cases
  moderateTextLocal(text: string, options: ModerateTextOptions = {}): ModerationResult {
    const sensitivity = options.sensitivity || this.sensitivity;
    const blockList = [...this.blockList, ...(options.customBlocklist || [])];
    const allowList = [...this.allowList, ...(options.customAllowlist || [])];

    // Normalize text for comparison
    const normalizedText = text.toLowerCase();

    // Check if text is in allow list (whitelist)
    for (const allowed of allowList) {
      if (normalizedText === allowed.toLowerCase()) {
        return {
          status: ModerationStatus.Approved,
          confidence: 100,
        };
      }
    }

    // Check against blocklist
    for (const blocked of blockList) {
      if (normalizedText.includes(blocked.toLowerCase())) {
        return {
          status: ModerationStatus.Rejected,
          reason: ModerationReason.ProfaneLanguage,
          confidence: 95,
          message: `Text contains blocked term: ${blocked}`,
        };
      }
    }

    // Simple profanity check (would be more sophisticated in real implementation)
    // Lower sensitivity means more permissive
    const profanityRegex = /profanity|inappropriate|offensive/i;
    if (profanityRegex.test(normalizedText) && sensitivity > 50) {
      return {
        status: ModerationStatus.Flagged,
        reason: ModerationReason.ProfaneLanguage,
        confidence: 70,
        message: 'Text may contain inappropriate language',
      };
    }

    return {
      status: ModerationStatus.Approved,
      confidence: 85,
    };
  }

  // For drawing/sketch moderation (simplified)
  moderateDrawing(element: Element, options: ModerateDrawingOptions = {}): ModerationResult {
    // In a real implementation, this would use shape detection algorithms
    // or send the sketch data to an external AI vision API

    const sensitivity = options.sensitivity || this.sensitivity;

    // Simplified pattern detection for demo
    // For a real implementation, this would be much more sophisticated
    // using computer vision or AI image analysis

    // We're simulating the process here, assuming drawings have been
    // converted to pattern names through a shape detection algorithm
    const detectedPatterns = this.simulatePatternDetection(element);

    for (const pattern of detectedPatterns) {
      if (DEFAULT_PATTERN_BLOCKLIST.includes(pattern)) {
        return {
          status: ModerationStatus.Rejected,
          reason: ModerationReason.OffensiveContent,
          confidence: 85,
          message: `Drawing contains inappropriate pattern: ${pattern}`,
        };
      }
    }

    // This is where you might have more sophisticated logic
    // based on the shapes, points, etc.

    return {
      status: ModerationStatus.Approved,
      confidence: 80,
    };
  }

  // Simulate pattern detection (in a real system, this would use ML/AI)
  private simulatePatternDetection(element: Element): string[] {
    // This is a placeholder - in a real implementation this would use
    // advanced shape recognition algorithms or AI vision APIs

    // For demo purposes, just return empty array
    // (no offensive patterns detected)
    return [];
  }

  // Moderate any element based on its type
  async moderateElement(element: Element): Promise<ModerationResult> {
    switch (element.type) {
      case 'text':
        if (element.text) {
          return await this.moderateTextExternal(element.text);
        }
        break;

      case 'rectangle':
      case 'ellipse':
      case 'line':
      case 'pencil':
        return this.moderateDrawing(element);
    }

    return {
      status: ModerationStatus.Approved,
      confidence: 100,
    };
  }

  // Helper functions
  private mapApiStatusToInternal(apiStatus: string): ModerationStatus {
    switch (apiStatus?.toLowerCase()) {
      case 'approved':
      case 'safe':
      case 'ok':
        return ModerationStatus.Approved;
      case 'flagged':
      case 'review':
        return ModerationStatus.Flagged;
      case 'rejected':
      case 'block':
      case 'unsafe':
        return ModerationStatus.Rejected;
      default:
        return ModerationStatus.Pending;
    }
  }

  private determineReason(apiResponse: any): ModerationReason {
    const reason = apiResponse.reason?.toLowerCase() || '';

    if (reason.includes('profane') || reason.includes('language')) {
      return ModerationReason.ProfaneLanguage;
    } else if (reason.includes('offensive') || reason.includes('content')) {
      return ModerationReason.OffensiveContent;
    } else if (reason.includes('symbol')) {
      return ModerationReason.UnwantedSymbols;
    }

    return ModerationReason.Other;
  }
}

// Export singleton instance
export const moderationService = new ModerationService();
