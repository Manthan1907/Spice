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

    // Generate simple pickup lines without OpenAI for now
    const pickupLines = {
      flirty: [
        "Hey there! You caught my eye 😉",
        "Is your name Google? Because you've got everything I've been searching for!",
        "Are you a parking ticket? Because you've got FINE written all over you!"
      ],
      romantic: [
        "You must be a magician because whenever I look at you, everyone else disappears!",
        "Are you made of copper and tellurium? Because you're Cu-Te!",
        "Do you have a map? I keep getting lost in your eyes!"
      ],
      funny: [
        "Are you a time traveler? Because I can't imagine my future without you!",
        "Do you like science? Because we have chemistry!",
        "Are you a keyboard? Because you're just my type!"
      ],
      casual: [
        "Hey! Nice to meet you 😊",
        "What's up? You seem pretty cool!",
        "Hi there! How's your day going?"
      ]
    }

    const replies = pickupLines[tone as keyof typeof pickupLines] || pickupLines.casual

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
