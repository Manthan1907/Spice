import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvxzwcuuuakvaovxasqv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eHp3Y3V1dWFrdmFvdnhhc3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTQzMzksImV4cCI6MjA3MTE3MDMzOX0.cZNPTC_cIVMjoXwkZlBOyVfap62aWcRWiEaqOCWi5Do'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API endpoints for Edge Functions
export const API_ENDPOINTS = {
  generateReplies: `${supabaseUrl}/functions/v1/generate-replies`,
  analyzeImage: `${supabaseUrl}/functions/v1/analyze-image`
}

// Helper function to call Supabase Edge Functions
export async function callSupabaseFunction(
  endpoint: string,
  data: any,
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    let errorMessage = 'Function call failed'
    try {
      const error = await response.json()
      errorMessage = error.error || error.details || errorMessage
    } catch (e) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  return await response.json()
}
