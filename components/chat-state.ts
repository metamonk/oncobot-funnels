export interface ChatState {
  // UI state
  hasSubmitted: boolean;
  hasManuallyScrolled: boolean;
  showSignInPrompt: boolean;
  showHealthProfilePrompt: boolean;
  hasShownSignInPrompt: boolean;
  hasShownHealthProfilePrompt: boolean;
  commandDialogOpen: boolean;
  anyDialogOpen: boolean;

  // Chat data
  suggestedQuestions: string[];
  attachments: Attachment[];
  selectedVisibilityType: 'public' | 'private';
}

interface Attachment {
  name: string;
  contentType: string;
  url: string;
  size: number;
}

export type ChatAction =
  | { type: 'SET_HAS_SUBMITTED'; payload: boolean }
  | { type: 'SET_HAS_MANUALLY_SCROLLED'; payload: boolean }
  | { type: 'SET_SHOW_SIGNIN_PROMPT'; payload: boolean }
  | { type: 'SET_SHOW_HEALTH_PROFILE_PROMPT'; payload: boolean }
  | { type: 'SET_HAS_SHOWN_SIGNIN_PROMPT'; payload: boolean }
  | { type: 'SET_HAS_SHOWN_HEALTH_PROFILE_PROMPT'; payload: boolean }
  | { type: 'SET_COMMAND_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_ANY_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_SUGGESTED_QUESTIONS'; payload: string[] }
  | { type: 'SET_ATTACHMENTS'; payload: Attachment[] }
  | { type: 'SET_VISIBILITY_TYPE'; payload: 'public' | 'private' }
  | { type: 'RESET_SUGGESTED_QUESTIONS' }
  | { type: 'RESET_UI_STATE' };

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_HAS_SUBMITTED':
      return { ...state, hasSubmitted: action.payload };

    case 'SET_HAS_MANUALLY_SCROLLED':
      return { ...state, hasManuallyScrolled: action.payload };

    case 'SET_SHOW_SIGNIN_PROMPT':
      return { ...state, showSignInPrompt: action.payload };

    case 'SET_SHOW_HEALTH_PROFILE_PROMPT':
      return { ...state, showHealthProfilePrompt: action.payload };

    case 'SET_HAS_SHOWN_SIGNIN_PROMPT':
      return { ...state, hasShownSignInPrompt: action.payload };

    case 'SET_HAS_SHOWN_HEALTH_PROFILE_PROMPT':
      return { ...state, hasShownHealthProfilePrompt: action.payload };

    case 'SET_COMMAND_DIALOG_OPEN':
      return { ...state, commandDialogOpen: action.payload };

    case 'SET_ANY_DIALOG_OPEN':
      return { ...state, anyDialogOpen: action.payload };

    case 'SET_SUGGESTED_QUESTIONS':
      return { ...state, suggestedQuestions: action.payload };

    case 'SET_ATTACHMENTS':
      return { ...state, attachments: action.payload };

    case 'SET_VISIBILITY_TYPE':
      return { ...state, selectedVisibilityType: action.payload };

    case 'RESET_SUGGESTED_QUESTIONS':
      return { ...state, suggestedQuestions: [] };

    case 'RESET_UI_STATE':
      return {
        ...state,
        hasSubmitted: false,
        hasManuallyScrolled: false,
        showSignInPrompt: false,
        showHealthProfilePrompt: false,
      };

    default:
      return state;
  }
};

export const createInitialState = (
  initialVisibility: 'public' | 'private' = 'private',
  hasShownSignInPrompt: boolean = false,
  hasShownHealthProfilePrompt: boolean = false,
): ChatState => ({
  hasSubmitted: false,
  hasManuallyScrolled: false,
  showSignInPrompt: false,
  showHealthProfilePrompt: false,
  hasShownSignInPrompt,
  hasShownHealthProfilePrompt,
  commandDialogOpen: false,
  anyDialogOpen: false,
  suggestedQuestions: [],
  attachments: [],
  selectedVisibilityType: initialVisibility,
});
