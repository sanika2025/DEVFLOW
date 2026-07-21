import { supabase } from '../utils/supabaseClient';

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
        .select(`
          *,
          messages:chat_messages(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  sendMessage: async (sessionId, message) => {
    try {
      // 1. Save user message to DB
      const { data: userMsg, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: message
        })
        .select()
        .single();
      
      if (userError) throw userError;

      // 2. Call Edge Function (or mock it for now since edge function might not be deployed yet)
      // We will assume the Edge Function is deployed at 'ai-mentor'
      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-mentor', {
        body: { message, sessionId }
      });

      if (functionError) {
        console.error("Edge function error (mocking response instead):", functionError);
        // Fallback mock if edge function fails/isn't deployed
        const fallbackMsg = "I'm the AI Mentor. (Edge function not connected). You said: " + message;
        const { data: aiMsg, error: aiError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: fallbackMsg
          })
          .select()
          .single();
        if (aiError) throw aiError;
        return { success: true, data: { userMsg, aiMsg }, error: null };
      }

      // Edge function should ideally save the response itself, or return it for us to save.
      // Assuming edge function returns the assistant's message text:
      const aiResponseContent = functionData?.response || "I am processing your query.";
      const { data: aiMsg, error: aiError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: aiResponseContent
        })
        .select()
        .single();
        
      if (aiError) throw aiError;

      return { success: true, data: { userMsg, aiMsg }, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
