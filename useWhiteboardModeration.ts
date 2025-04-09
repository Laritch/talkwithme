import { useCallback, useMemo } from 'react';
import useWhiteboardStore from '../store/useWhiteboardStore';
import { Element, ElementType, ModerationConfig, ModerationStatus, ModerationReason } from '../types';
import { moderationService } from '../services/moderationService';

// Custom hook to manage whiteboard moderation
const useWhiteboardModeration = () => {
  // Access store state
  const {
    elements,
    flaggedElements,
    moderationConfig,
    updateModerationConfig,
    moderateElement,
    reviewFlaggedElement,
    updateElement,
  } = useWhiteboardStore();

  // Get elements by moderation status
  const getElementsByStatus = useCallback((status: ModerationStatus) => {
    return elements.filter(element => element.moderationStatus === status);
  }, [elements]);

  // Get pending elements
  const pendingElements = useMemo(() => {
    return getElementsByStatus(ModerationStatus.Pending);
  }, [getElementsByStatus]);

  // Get flagged elements
  const flaggedElementsCount = useMemo(() => {
    return flaggedElements.length;
  }, [flaggedElements]);

  // Get rejected elements
  const rejectedElements = useMemo(() => {
    return getElementsByStatus(ModerationStatus.Rejected);
  }, [getElementsByStatus]);

  // Check if an element is visible based on moderation status and config
  const isElementVisible = useCallback((element: Element): boolean => {
    if (!moderationConfig.enabled) {
      return true; // Show all elements if moderation is disabled
    }

    switch (element.moderationStatus) {
      case ModerationStatus.Approved:
        return true;
      case ModerationStatus.Pending:
        return true; // Show pending elements, they're awaiting moderation
      case ModerationStatus.Flagged:
        return true; // Show flagged elements, but they may need visual indication
      case ModerationStatus.Rejected:
        return !moderationConfig.blockRejected; // Only show if not blocking rejected
      default:
        return true;
    }
  }, [moderationConfig]);

  // Filter visible elements based on moderation status
  const visibleElements = useMemo(() => {
    return elements.filter(isElementVisible);
  }, [elements, isElementVisible]);

  // Moderate all pending elements
  const moderateAllPending = useCallback(async () => {
    const results = await Promise.all(
      pendingElements.map(element => moderateElement(element.id))
    );
    return results;
  }, [pendingElements, moderateElement]);

  // Update moderation sensitivity
  const updateSensitivity = useCallback((sensitivity: number) => {
    updateModerationConfig({ sensitivity });
  }, [updateModerationConfig]);

  // Enable or disable automatic moderation
  const toggleAutoModeration = useCallback((enabled: boolean) => {
    updateModerationConfig({ autoModerate: enabled });
  }, [updateModerationConfig]);

  // Enable or disable moderation completely
  const toggleModeration = useCallback((enabled: boolean) => {
    updateModerationConfig({ enabled });
  }, [updateModerationConfig]);

  // Add custom blocked terms
  const addToBlocklist = useCallback((terms: string[]) => {
    updateModerationConfig({
      customBlocklist: [
        ...(moderationConfig.customBlocklist || []),
        ...terms,
      ],
    });

    // Update the moderation service
    moderationService.configure({
      blockList: terms,
    });
  }, [moderationConfig, updateModerationConfig]);

  // Add custom allowed terms
  const addToAllowlist = useCallback((terms: string[]) => {
    updateModerationConfig({
      customAllowlist: [
        ...(moderationConfig.customAllowlist || []),
        ...terms,
      ],
    });

    // Update the moderation service
    moderationService.configure({
      allowList: terms,
    });
  }, [moderationConfig, updateModerationConfig]);

  // Approve a flagged element
  const approveElement = useCallback((elementId: string) => {
    reviewFlaggedElement(elementId, true);
  }, [reviewFlaggedElement]);

  // Reject a flagged element
  const rejectElement = useCallback((elementId: string) => {
    reviewFlaggedElement(elementId, false);
  }, [reviewFlaggedElement]);

  // Flag an element for manual review
  const flagElementForReview = useCallback((elementId: string, reason?: ModerationReason) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    updateElement(elementId, {
      moderationStatus: ModerationStatus.Flagged,
      moderationReason: reason || ModerationReason.Other,
    });
  }, [elements, updateElement]);

  // Get element statistics by moderation status
  const moderationStats = useMemo(() => {
    return {
      total: elements.length,
      approved: getElementsByStatus(ModerationStatus.Approved).length,
      pending: pendingElements.length,
      flagged: flaggedElements.length,
      rejected: rejectedElements.length,
    };
  }, [elements, getElementsByStatus, pendingElements, flaggedElements, rejectedElements]);

  return {
    // State
    moderationConfig,
    pendingElements,
    flaggedElements,
    flaggedElementsCount,
    rejectedElements,
    visibleElements,
    moderationStats,

    // Actions
    isElementVisible,
    moderateElement,
    moderateAllPending,
    approveElement,
    rejectElement,
    flagElementForReview,
    updateModerationConfig,
    updateSensitivity,
    toggleAutoModeration,
    toggleModeration,
    addToBlocklist,
    addToAllowlist,
  };
};

export default useWhiteboardModeration;
