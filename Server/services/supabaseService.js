const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'SkillCompass';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Upload file to Supabase storage
const uploadFile = async (file, filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};

// Get public URL for uploaded file
const getPublicUrl = (filePath) => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

// Delete file from storage
const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase delete error:', error);
    throw error;
  }
};

// Check if file exists
const fileExists = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      });

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('File exists check error:', error);
    return false;
  }
};

module.exports = {
  uploadFile,
  getPublicUrl,
  deleteFile,
  fileExists,
  supabase
};