// Supabase Configuration and Client Setup

// TypeScript declaration for Vite env variables
// Remove custom ImportMeta and ImportMetaEnv interfaces, Vite provides these types automatically.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'SkillCompass';

// File upload utilities
export const uploadFile = async (file: File, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Get public URL for uploaded file
export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Delete file from storage
export const deleteFile = async (path: string) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};