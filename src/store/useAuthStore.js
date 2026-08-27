import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    // Get initial session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error.message);
      // If there's an error (e.g. invalid refresh token), clear the stale session
      await supabase.auth.signOut();
      set({ user: null, profile: null, loading: false });
    } else if (session?.user) {
      set({ user: session.user });
      await get().fetchProfile(session.user.id);
    } else {
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ profile: null, loading: false });
      }
    });
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
      }
      
      set({ profile: data, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      set({ profile: data });
      return { success: true, data };
    } catch (err) {
      console.error('Error updating profile:', err.message);
      return { success: false, error: err.message };
    }
  },

  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating password:', err.message);
      return { success: false, error: err.message };
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
    set({ loading: false });
    return { success: true, data };
  },

  signup: async (email, password, fullName) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
    
    set({ loading: false });
    return { success: true, data };
  },

  logout: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  }
}));
