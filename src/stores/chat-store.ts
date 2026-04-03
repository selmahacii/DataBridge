import { create } from 'zustand';

// Chat store — used by the Data Assistant feature.
// Conversations are ephemeral (in-memory only) for now.
// TODO: persist to IndexedDB or server-side storage.

export interface ChatMessageMetadata {
  chartData?: Record<string, unknown>;
  sqlQuery?: string;
  sources?: string[];
  pipelineId?: string;
  dataSourceId?: string;
  error?: boolean;
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessagePreview: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  conversations: ConversationSummary[];
  currentConversationId: string | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  addUserMessage: (content: string, metadata?: ChatMessageMetadata) => string;
  addAssistantMessage: (content: string, metadata?: ChatMessageMetadata) => string;
  addSystemMessage: (content: string) => string;
  setTyping: (typing: boolean) => void;
  updateLastAssistantMessage: (content: string, metadata?: ChatMessageMetadata) => void;
  clearMessages: () => void;
  loadConversation: (id: string) => void;
  startNewConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
}

function generateId(): string {
  // simple enough for client-side IDs. no need for uuid library.
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateConversationTitle(firstMessage: string): string {
  // Take first ~40 chars of the first user message as the conversation title
  const cleaned = firstMessage.replace(/\n/g, ' ').trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37) + '...';
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isTyping: false,
  conversations: [],
  currentConversationId: null,

  addMessage: (message) =>
    set((state) => {
      const newMessages = [...state.messages, message];

      // If this is the first user message in a new conversation, auto-title it
      const needsTitle =
        message.role === 'user' &&
        state.currentConversationId &&
        state.conversations.find((c) => c.id === state.currentConversationId)?.title === 'New Chat';

      let updatedConversations = [...state.conversations];

      if (needsTitle) {
        const title = generateConversationTitle(message.content);
        updatedConversations = updatedConversations.map((c) =>
          c.id === state.currentConversationId
            ? { ...c, title, updatedAt: new Date() }
            : c
        );
      } else if (state.currentConversationId) {
        updatedConversations = updatedConversations.map((c) =>
          c.id === state.currentConversationId
            ? {
                ...c,
                updatedAt: new Date(),
                messageCount: newMessages.length,
                lastMessagePreview:
                  message.content.length > 60
                    ? message.content.slice(0, 57) + '...'
                    : message.content,
              }
            : c
        );
      }

      return { messages: newMessages, conversations: updatedConversations };
    }),

  addUserMessage: (content, metadata) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'user',
      content,
      timestamp: new Date(),
      metadata,
    };
    get().addMessage(message);
    return id;
  },

  addAssistantMessage: (content, metadata) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata,
    };
    get().addMessage(message);
    return id;
  },

  addSystemMessage: (content) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    get().addMessage(message);
    return id;
  },

  setTyping: (typing) => set({ isTyping: typing }),

  updateLastAssistantMessage: (content, metadata) =>
    set((state) => {
      const msgIndex = [...state.messages].reverse().findIndex((m) => m.role === 'assistant');
      if (msgIndex === -1) return state;

      const realIndex = state.messages.length - 1 - msgIndex;
      const updatedMessages = [...state.messages];
      updatedMessages[realIndex] = {
        ...updatedMessages[realIndex],
        content,
        ...(metadata ? { metadata } : {}),
      };

      return { messages: updatedMessages };
    }),

  clearMessages: () => set({ messages: [], isTyping: false, currentConversationId: null }),

  loadConversation: (id) => {
    // TODO: in a real app this would load messages from the server.
    // for now we just switch the active conversation id.
    set({ currentConversationId: id, messages: [] });
  },

  startNewConversation: () => {
    const id = generateId();
    const summary: ConversationSummary = {
      id,
      title: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      lastMessagePreview: '',
    };
    set((state) => ({
      currentConversationId: id,
      messages: [],
      conversations: [summary, ...state.conversations],
    }));
    return id;
  },

  deleteConversation: (id) =>
    set((state) => {
      const filtered = state.conversations.filter((c) => c.id !== id);
      const shouldClearMessages = state.currentConversationId === id;
      return {
        conversations: filtered,
        messages: shouldClearMessages ? [] : state.messages,
        currentConversationId: shouldClearMessages
          ? filtered[0]?.id ?? null
          : state.currentConversationId,
      };
    }),

  renameConversation: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),
}));

export const selectLastMessage = (state: ChatState): ChatMessage | undefined =>
  state.messages[state.messages.length - 1];

export const selectUserMessages = (state: ChatState): ChatMessage[] =>
  state.messages.filter((m) => m.role === 'user');

export const selectMessagesForApi = (state: ChatState): Array<{ role: string; content: string }> =>
  state.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

export const selectCurrentConversation = (state: ChatState): ConversationSummary | undefined =>
  state.conversations.find((c) => c.id === state.currentConversationId);

export const selectHasMessages = (state: ChatState): boolean => state.messages.length > 0;
