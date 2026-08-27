import { supabase } from '../utils/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const chatService = {
  createChatSession: async (userId, title = 'New Chat') => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: userId, title })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getChatHistory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`*`)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getSessions: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getMessages: async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  sendMessage: async (userId, sessionId, message) => {
    try {
      let currentSessionId = sessionId;
      
      // If no session exists, create one
      if (!currentSessionId) {
        const sessionRes = await chatService.createChatSession(userId, message.substring(0, 30) + '...');
        if (!sessionRes.success) {
          alert('Error creating chat session: ' + sessionRes.error);
          throw new Error(sessionRes.error);
        }
        currentSessionId = sessionRes.data.id;
      }

      // 1. Save user message to DB
      const { data: userMsg, error: userError } = await supabase
        .from('chat_messages')
        .insert({ session_id: currentSessionId, role: 'user', content: message })
        .select()
        .single();
      
      if (userError) throw userError;

      // 2. Call Gemini
      const apiKey = localStorage.getItem('GEMINI_API_KEY');
      let aiResponseContent = "I'm sorry, you need to configure your Gemini API Key in the Settings page first.";

      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `You are an expert technical AI mentor. The user says: ${message}` }] }]
          });
          
          aiResponseContent = result.response.text();
        } catch (geminiError) {
          console.error("Gemini API Error:", geminiError);
          aiResponseContent = "Sorry, I encountered an error communicating with Google Gemini. Check your API key.";
        }
      }

      // 3. Save AI message to DB
      const { data: aiMsg, error: aiError } = await supabase
        .from('chat_messages')
        .insert({ session_id: currentSessionId, role: 'assistant', content: aiResponseContent })
        .select()
        .single();
        
      if (aiError) throw aiError;

      return { success: true, data: { userMsg, aiMsg, sessionId: currentSessionId }, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
