/**
 * AI Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============ Types ============
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIState {
  conversations: AIConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  streamingMessage: string | null;
}

export interface AIActions {
  setConversations: (conversations: AIConversation[]) => void;
  addConversation: (conversation: AIConversation) => void;
  updateConversation: (id: string, updates: Partial<AIConversation>) => void;
  removeConversation: (id: string) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingMessage: (message: string | null) => void;
  
  // Chat actions
  sendMessage: (content: string) => Promise<void>;
  createNewConversation: () => string;
  clearConversation: (id: string) => void;
}

export interface AISelectors {
  getActiveConversation: () => AIConversation | undefined;
  getConversationById: (id: string) => AIConversation | undefined;
}

type AIStore = AIState & AIActions & AISelectors;

const initialState: AIState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
  streamingMessage: null,
};

// ============ Store ============
export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setConversations: (conversations) => set({ conversations }),
      
      addConversation: (conversation) => set((state) => ({
        conversations: [...state.conversations, conversation],
      })),
      
      updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        ),
      })),
      
      removeConversation: (id) => set((state) => ({
        conversations: state.conversations.filter(c => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      })),
      
      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setStreamingMessage: (streamingMessage) => set({ streamingMessage }),
      
      sendMessage: async (content) => {
        const state = get();
        let conversationId = state.activeConversationId;
        
        // Create new conversation if none active
        if (!conversationId) {
          conversationId = state.createNewConversation();
        }
        
        const userMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };
        
        // Add user message
        state.updateConversation(conversationId, {
          messages: [...(state.getConversationById(conversationId)?.messages || []), userMessage],
        });
        
        set({ isLoading: true, error: null });
        
        try {
          // Call AI service
          const response = await window.electron.ai.chat(conversationId, content);
          
          const assistantMessage: AIMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
          };
          
          state.updateConversation(conversationId, {
            messages: [...(state.getConversationById(conversationId)?.messages || []), assistantMessage],
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'AI request failed' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      createNewConversation: () => {
        const id = crypto.randomUUID();
        const conversation: AIConversation = {
          id,
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        get().addConversation(conversation);
        set({ activeConversationId: id });
        return id;
      },
      
      clearConversation: (id) => {
        get().updateConversation(id, { messages: [] });
      },
      
      // Selectors
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find(c => c.id === activeConversationId);
      },
      
      getConversationById: (id) => {
        return get().conversations.find(c => c.id === id);
      },
    }),
    {
      name: 'ai-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);

export const useConversations = () => useAIStore((state) => state.conversations);
export const useActiveConversation = () => useAIStore((state) => state.getActiveConversation());
