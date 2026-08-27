import { supabase } from '../utils/supabaseClient';

export const noteService = {
  getNotes: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  createNote: async (userId, title = 'Untitled Note', folderId = 'general', content = '', tags = []) => {
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert({
          user_id: userId,
          title,
          folder_id: folderId,
          content,
          tags,
          is_favorite: false,
          revision_status: 'Not Reviewed'
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateNote: async (noteId, updates) => {
    try {
      // Don't update id or user_id
      const { id, user_id, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from('user_notes')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  deleteNote: async (noteId) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
      return { success: true, data: null, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
