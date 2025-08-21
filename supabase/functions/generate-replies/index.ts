import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { text, tone } = await req.json()

    if (!text || !tone) {
      return new Response(
        JSON.stringify({ error: 'Missing text or tone parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate replies using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tonePrompts = {
      flirty: "Generate 3 flirty, charming, and playful pickup lines",
      romantic: "Generate 3 romantic, sweet, and heartfelt pickup lines",
      funny: "Generate 3 witty, humorous, and entertaining pickup lines",
      casual: "Generate 3 casual, friendly, and laid-back pickup lines"
    }

    const prompt = `${tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.casual}

Make the pickup lines natural, engaging, and appropriate for the given tone. Keep each line under 100 characters. Return only the pickup lines, one per line, without numbers.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates engaging pickup lines.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const openaiData = await response.json()
    const generatedText = openaiData.choices[0]?.message?.content || ''
    
    // Split the response into individual replies
    const replies = generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 3)

    // If we don't have enough replies, generate some fallback ones
    while (replies.length < 3) {
      replies.push(`Hey there! ${tone === 'flirty' ? 'You caught my eye 😉' : 'Nice to meet you!'}`)
    }

    return new Response(
      JSON.stringify({ replies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
