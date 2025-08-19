import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Simple response cache for faster repeated requests
const responseCache = new Map<string, { response: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(text: string, tone: string): string {
  return `${text.toLowerCase().trim()}_${tone}`;
}

function getCachedResponse(cacheKey: string): any | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }
  return null;
}

function setCachedResponse(cacheKey: string, response: any): void {
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
  
  // Clean old entries (simple cleanup)
  if (responseCache.size > 100) {
    const oldEntries = Array.from(responseCache.entries())
      .filter(([, value]) => Date.now() - value.timestamp > CACHE_DURATION);
    oldEntries.forEach(([key]) => responseCache.delete(key));
  }
}

export interface ReplyResponse {
  replies: string[];
  tone: string;
}

export async function generateReplies(text: string, tone: string, bypassCache: boolean = false): Promise<ReplyResponse> {
  try {
    // Only check cache if NOT bypassing
    if (!bypassCache) {
      const cacheKey = getCacheKey(text, tone);
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Optimized shorter prompt for faster processing
    const moodInstructions = {
      flirty: "Playful, smooth, charming. Light teasing welcome. Max 1-2 emojis.",
      funny: "Witty, humorous, absurd. Clever wordplay. Max 1-2 emojis.", 
      sarcastic: "Dry humor, tongue-in-cheek. Slight roast but never mean. Max 1-2 emojis.",
      respectful: "Polite, thoughtful, considerate. Max 1-2 emojis."
    };

    const moodInstruction = moodInstructions[tone as keyof typeof moodInstructions] || moodInstructions.flirty;
    
    const randomSeed = bypassCache ? ` Vary your response style (seed: ${Math.random().toString(36).substr(2, 5)}).` : '';
    const systemPrompt = `You are Rizz AI. Generate 1 ${tone} reply that's VERY SHORT (max 15 words), natural, human-like texting style. ${moodInstruction} Reply to ONLY the last message.${randomSeed} JSON format: { "replies": ["reply"], "tone": "${tone}" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Chat context: "${text}"\n\nGenerate a ${tone} reply to the LAST message only. Keep it under 15 words.${bypassCache ? ` Make it unique and different from previous responses.` : ''}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 50, // Very short responses
      temperature: bypassCache ? 0.9 : 0.8 // Higher randomness for fresh replies
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.replies || !Array.isArray(result.replies)) {
      throw new Error("Invalid response format from OpenAI");
    }

    const finalResponse = {
      replies: result.replies.slice(0, 1),
      tone: tone
    };

    // Cache the response (unless bypassing cache)
    if (!bypassCache) {
      const cacheKey = getCacheKey(text, tone);
      setCachedResponse(cacheKey, finalResponse);
    }
    
    return finalResponse;
  } catch (error) {
    console.error("Error generating replies:", error);
    throw new Error("Failed to generate replies: " + (error as Error).message);
  }
}

export async function analyzeImageWithVision(base64Image: string): Promise<string> {
  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Extract all text from this chat screenshot. Identify each message and put the LAST/MOST RECENT message at the END. Format as: [earlier messages...]\nLAST MESSAGE: [the most recent message]"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 200, // Optimized for faster OCR processing
    });

    return visionResponse.choices[0].message.content || "";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image: " + (error as Error).message);
  }
}

export async function generatePickupLines(): Promise<ReplyResponse> {
  try {
    const systemPrompt = `You are Rizz AI, a conversational assistant specialized in generating engaging, human-like pickup lines.

🎯 Core Instructions
• Always sound natural, short, and human-like.
• Adapt to casual texting style (not robotic).
• Keep it punchy and witty.

Pickup Line Requirements:
• Flirty 💘 - Playful, smooth, and charming.
• Light teasing is welcome.
• Modern and conversation-starting.
• Clever but not cheesy.
• Max 1-2 emojis if it strengthens the tone.
• Keep it safe and respectful.

Generate exactly 1 pickup line. Respond with JSON in this format: { "replies": ["line1"], "tone": "flirty" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: "Generate a creative pickup line"
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 40, // Very short pickup lines
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.replies || !Array.isArray(result.replies)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return {
      replies: result.replies.slice(0, 1),
      tone: "flirty"
    };
  } catch (error) {
    console.error("Error generating pickup lines:", error);
    throw new Error("Failed to generate pickup lines: " + (error as Error).message);
  }
}
