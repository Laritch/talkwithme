import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { Element, ElementType, ModerationConfig, ModerationStatus, Point } from '../types';
import { moderationService } from '../services/moderationService';
import createDemoElements from '../utils/demoElements';

interface WhiteboardState {
  elements: Element[];
  selectedElement: Element | null;
  history: Element[][];
  historyIndex: number;
  isDrawing: boolean;
  tool: ElementType;
  strokeColor: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  roughness: number;
  userId: string;
  moderationConfig: ModerationConfig;
  flaggedElements: Element[];

  // Actions
  addElement: (element: Omit<Element, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'moderationStatus'>) => Promise<Element>;
  updateElement: (id: string, updates: Partial<Element>) => Promise<void>;
  deleteElement: (id: string) => void;
  setSelectedElement: (element: Element | null) => void;
  setTool: (tool: ElementType) => void;
  setStrokeColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setRoughness: (roughness: number) => void;
  undo: () => void;
  redo: () => void;
  clearWhiteboard: () => void;
  updateModerationConfig: (config: Partial<ModerationConfig>) => void;
  moderateElement: (elementId: string) => Promise<Element>;
  reviewFlaggedElement: (elementId: string, approved: boolean) => void;
}

// Default moderation configuration
const DEFAULT_MODERATION_CONFIG: ModerationConfig = {
  enabled: true,
  autoModerate: true,
  blockRejected: true,
  sensitivity: 75,
  moderateText: true,
  moderateDrawings: true,
  notifyOnFlag: true,
};

const useWhiteboardStore = create<WhiteboardState>((set, get) => {
  // Create a unique user ID for this session
  const userId = nanoid();

  // Generate demo elements
  const demoElements = createDemoElements(userId);

  // Initialize the store with demo elements
  return {
    elements: demoElements,
    selectedElement: null,
    history: [demoElements],
    historyIndex: 0,
    isDrawing: false,
    tool: ElementType.Pencil,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fontSize: 18,
    fontFamily: 'Arial',
    roughness: 1,
    userId,
    moderationConfig: DEFAULT_MODERATION_CONFIG,
    flaggedElements: demoElements.filter(el => el.moderationStatus === ModerationStatus.Flagged),

    // Add a new element with automatic moderation
    addElement: async (elementData) => {
      const { userId, moderationConfig } = get();

      // Create the new element with pending moderation status
      const newElement: Element = {
        id: nanoid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        moderationStatus: ModerationStatus.Pending,
        ...elementData,
      };

      // Update state immediately with pending status
      set((state) => ({
        elements: [...state.elements, newElement],
        history: [...state.history.slice(0, state.historyIndex + 1), [...state.elements, newElement]],
        historyIndex: state.historyIndex + 1,
      }));

      // If moderation is enabled, check the element
      if (moderationConfig.enabled && moderationConfig.autoModerate) {
        return await get().moderateElement(newElement.id);
      }

      return newElement;
    },

    // Update an existing element
    updateElement: async (id, updates) => {
      const { elements, moderationConfig } = get();
      const elementIndex = elements.findIndex(el => el.id === id);

      if (elementIndex === -1) return;

      const updatedElement = {
        ...elements[elementIndex],
        ...updates,
        updatedAt: Date.now(),
      };

      // Update element in state
      set((state) => {
        const newElements = [...state.elements];
        newElements[elementIndex] = updatedElement;

        return {
          elements: newElements,
          history: [...state.history.slice(0, state.historyIndex + 1), newElements],
          historyIndex: state.historyIndex + 1,
        };
      });

      // If content changed and moderation is enabled, re-moderate the element
      const contentUpdated = updates.text !== undefined || updates.points !== undefined;
      if (contentUpdated && moderationConfig.enabled && moderationConfig.autoModerate) {
        await get().moderateElement(id);
      }
    },

    // Delete an element
    deleteElement: (id) => {
      set((state) => {
        const filteredElements = state.elements.filter(el => el.id !== id);
        return {
          elements: filteredElements,
          selectedElement: state.selectedElement?.id === id ? null : state.selectedElement,
          history: [...state.history.slice(0, state.historyIndex + 1), filteredElements],
          historyIndex: state.historyIndex + 1,
        };
      });
    },

    // Set the selected element
    setSelectedElement: (element) => {
      set({ selectedElement: element });
    },

    // Set the active tool
    setTool: (tool) => {
      set({ tool });
    },

    // Set the stroke color
    setStrokeColor: (color) => {
      set({ strokeColor: color });
    },

    // Set the background color
    setBackgroundColor: (color) => {
      set({ backgroundColor: color });
    },

    // Set the font size
    setFontSize: (size) => {
      set({ fontSize: size });
    },

    // Set the font family
    setFontFamily: (family) => {
      set({ fontFamily: family });
    },

    // Set the roughness
    setRoughness: (roughness) => {
      set({ roughness: roughness });
    },

    // Undo the last action
    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          return {
            historyIndex: state.historyIndex - 1,
            elements: [...state.history[state.historyIndex - 1]],
          };
        }
        return state;
      });
    },

    // Redo the last undone action
    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          return {
            historyIndex: state.historyIndex + 1,
            elements: [...state.history[state.historyIndex + 1]],
          };
        }
        return state;
      });
    },

    // Clear the whiteboard
    clearWhiteboard: () => {
      set((state) => ({
        elements: [],
        selectedElement: null,
        history: [...state.history.slice(0, state.historyIndex + 1), []],
        historyIndex: state.historyIndex + 1,
      }));
    },

    // Update moderation configuration
    updateModerationConfig: (config) => {
      set((state) => ({
        moderationConfig: {
          ...state.moderationConfig,
          ...config,
        },
      }));

      // Update the moderation service sensitivity
      if (config.sensitivity !== undefined) {
        moderationService.configure({
          sensitivity: config.sensitivity,
        });
      }
    },

    // Moderate a specific element
    moderateElement: async (elementId) => {
      const { elements, moderationConfig } = get();
      const elementIndex = elements.findIndex(el => el.id === elementId);

      if (elementIndex === -1) {
        throw new Error(`Element with ID ${elementId} not found`);
      }

      const element = elements[elementIndex];

      // Skip moderation if disabled or not applicable for this element type
      if (!moderationConfig.enabled ||
          (element.type === ElementType.Text && !moderationConfig.moderateText) ||
          (element.type !== ElementType.Text && !moderationConfig.moderateDrawings)) {
        // Automatically approve if moderation is disabled for this type
        set((state) => {
          const newElements = [...state.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            moderationStatus: ModerationStatus.Approved,
          };
          return { elements: newElements };
        });
        return elements[elementIndex];
      }

      try {
        // Call moderation service
        const result = await moderationService.moderateElement(element);

        // Update element with moderation result
        set((state) => {
          const newElements = [...state.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            moderationStatus: result.status,
            moderationReason: result.reason,
          };

          // Add to flagged elements if flagged or rejected
          let newFlaggedElements = [...state.flaggedElements];
          if (result.status === ModerationStatus.Flagged ||
              result.status === ModerationStatus.Rejected) {
            if (!newFlaggedElements.some(el => el.id === element.id)) {
              newFlaggedElements.push(newElements[elementIndex]);
            }
          } else {
            // Remove from flagged if approved
            newFlaggedElements = newFlaggedElements.filter(el => el.id !== element.id);
          }

          return {
            elements: newElements,
            flaggedElements: newFlaggedElements,
          };
        });

        return {
          ...element,
          moderationStatus: result.status,
          moderationReason: result.reason,
        };
      } catch (error) {
        console.error('Error during moderation:', error);

        // Set to pending if moderation fails
        set((state) => {
          const newElements = [...state.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            moderationStatus: ModerationStatus.Pending,
          };
          return { elements: newElements };
        });

        return element;
      }
    },

    // Review a flagged element (approve or reject)
    reviewFlaggedElement: (elementId, approved) => {
      set((state) => {
        const elementIndex = state.elements.findIndex(el => el.id === elementId);
        if (elementIndex === -1) return state;

        const newElements = [...state.elements];
        newElements[elementIndex] = {
          ...newElements[elementIndex],
          moderationStatus: approved ? ModerationStatus.Approved : ModerationStatus.Rejected,
        };

        return {
          elements: newElements,
          flaggedElements: state.flaggedElements.filter(el => el.id !== elementId),
        };
      });
    },
  };
});

export default useWhiteboardStore;
