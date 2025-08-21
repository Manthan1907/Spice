// Spice AI Supabase Configuration
// Replace these with your actual values from Supabase dashboard

export const SUPABASE_CONFIG = {
  url: 'https://rvxzwcuuuakvaovxasqv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eHp3Y3V1dWFrdmFvdnhhc3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTQzMzksImV4cCI6MjA3MTE3MDMzOX0.cZNPTC_cIVMjoXwkZlBOyVfap62aWcRWiEaqOCWi5Do'
}

// API Endpoints
export const API_ENDPOINTS = {
  generateReplies: `${SUPABASE_CONFIG.url}/functions/v1/generate-replies`,
  analyzeImage: `${SUPABASE_CONFIG.url}/functions/v1/analyze-image`
}
