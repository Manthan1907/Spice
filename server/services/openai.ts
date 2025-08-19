import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Simple response cache for faster repeated requests
const responseCache = new Map<string, { response: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track consecutive requests and previous responses for uniqueness
const requestTracker = new Map<string, { count: number, lastRequest: number, previousReplies: string[] }>();

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
    const cacheKey = getCacheKey(text, tone);
    // Check for rapid consecutive requests (Generate More behavior)
    const tracker = requestTracker.get(cacheKey);
    const now = Date.now();
    let isConsecutiveRequest = false;
    let previousReplies: string[] = [];
    
    if (tracker && (now - tracker.lastRequest) < 10000) { // Within 10 seconds (more generous)
      tracker.count++;
      tracker.lastRequest = now;
      isConsecutiveRequest = tracker.count > 1;
      previousReplies = tracker.previousReplies || [];
    } else {
      requestTracker.set(cacheKey, { count: 1, lastRequest: now, previousReplies: [] });
    }
    
    // Force bypass for consecutive requests (Generate More clicks) - ALWAYS for count > 1
    const shouldBypass = bypassCache || isConsecutiveRequest;
    
    // Only check cache if NOT bypassing
    if (!shouldBypass) {
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Enhanced mood instructions for more diverse responses
    const moodInstructions = {
      flirty: "Playful, smooth, charming with romantic undertones. Use pickup lines, compliments, or playful teasing. Vary between sweet and confident approaches. Max 1-2 emojis.",
      funny: "Witty, humorous, clever with jokes, puns, or absurd humor. Use wordplay, funny observations, or playful roasts. Vary between dad jokes and witty comebacks. Max 1-2 emojis.", 
      sarcastic: "Dry humor, witty comebacks, tongue-in-cheek responses. Use irony, playful roasts, or clever observations. Vary between subtle and obvious sarcasm. Max 1-2 emojis.",
      respectful: "Polite, thoughtful, genuine responses. Use encouragement, understanding, or thoughtful questions. Vary between supportive and curious approaches. Max 1-2 emojis."
    };

    const moodInstruction = moodInstructions[tone as keyof typeof moodInstructions] || moodInstructions.flirty;
    
    // Create uniqueness instructions based on previous responses
    const uniquenessInstruction = previousReplies.length > 0 
      ? ` IMPORTANT: Do NOT repeat these previous responses: ${previousReplies.map(r => `"${r}"`).join(', ')}. Generate something completely different.`
      : '';
    
    // Enhanced system prompt for more diverse and context-aware responses
    const randomSeed = shouldBypass ? ` (Style variant #${tracker?.count || 1})` : '';
    const contextInstruction = `Read the ENTIRE conversation for context, but respond ONLY to the most recent message.`;
    
    const systemPrompt = `You are Rizz AI, a witty conversation assistant. Generate 1 ${tone} reply that's SHORT (max 15 words) and perfectly matches the conversation context. 

${moodInstruction}

${contextInstruction} Make your response feel natural and human-like - as if texting a friend. Avoid generic responses.${randomSeed}${uniquenessInstruction}

JSON format: { "replies": ["reply"], "tone": "${tone}" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Full conversation context:
${text}

Generate a ${tone} reply to the LAST message that:
1. Shows you understand the conversation context
2. Responds specifically to what was just said
3. Matches the ${tone} tone perfectly
4. Feels natural and human (not robotic)
5. Stays under 15 words

${shouldBypass ? 'IMPORTANT: Make this response completely unique and different from any previous responses.' : ''}${uniquenessInstruction}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 50, // Very short responses
      temperature: shouldBypass ? 0.95 : 0.8 // Higher creativity for more diverse responses
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.replies || !Array.isArray(result.replies)) {
      throw new Error("Invalid response format from OpenAI");
    }

    const finalResponse = {
      replies: result.replies.slice(0, 1),
      tone: tone
    };

    // Store the new reply in tracker for uniqueness checking
    const currentTracker = requestTracker.get(cacheKey);
    if (currentTracker) {
      currentTracker.previousReplies.push(finalResponse.replies[0]);
      // Keep only last 5 replies to avoid overly long history
      if (currentTracker.previousReplies.length > 5) {
        currentTracker.previousReplies.shift();
      }
    }
    
    // Cache the response (unless bypassing cache)
    if (!shouldBypass) {
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
          role: "system",
          content: "You are an expert at reading chat screenshots and extracting conversation text accurately. Focus on identifying who said what and the exact message content."
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: `Please carefully examine this chat screenshot and extract ALL visible text messages in the conversation. 

IMPORTANT INSTRUCTIONS:
1. Read ALL messages visible in the image, from top to bottom
2. Include sender names/avatars if visible (like "John:", "Sarah:", etc.)
3. Preserve the exact wording and emojis 
4. Identify which message appears LAST/MOST RECENT in the conversation
5. Format the output as: [conversation context]\nLAST MESSAGE: [the final/most recent message]

If you cannot clearly read the text, respond with: "I'm unable to extract clear text from this image. The image may be blurry, low quality, or the text is not clearly visible."`
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
      max_tokens: 300, // Increased for better text extraction
      temperature: 0.1, // Low temperature for accurate OCR
    });

    const extractedText = visionResponse.choices[0].message.content || "";
    
    // Enhanced validation
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("No readable text content found in the image");
    }
    
    // Check if it's an error response
    if (extractedText.toLowerCase().includes("unable to extract") || 
        extractedText.toLowerCase().includes("cannot read") ||
        extractedText.toLowerCase().includes("blurry") ||
        extractedText.toLowerCase().includes("low quality")) {
      throw new Error("Image quality too low or text not clearly visible");
    }

    return extractedText;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image: " + (error as Error).message);
  }
}

export async function generatePickupLines(bypassCache: boolean = false): Promise<ReplyResponse> {
  try {
    // Use curated realistic pickup lines instead of AI generation to ensure quality
    const realisticLines = [
      "Your energy is contagious",
      "I had to come say hi", 
      "You seem like someone worth knowing",
      "What's your story?",
      "You look like trouble... the good kind",
      "Your smile just made my day better",
      "I'm getting major good vibes from you",
      "Something tells me you're fun to be around",
      "You caught my attention from across the room",
      "I have a feeling we'd get along",
      "You look like someone with great stories",
      "There's something magnetic about you",
      "I'm curious about what makes you smile like that",
      "You seem like the kind of person I'd want to know",
      "Your vibe is exactly what I needed today",
      "Mind if I join you?",
      "You have incredible style",
      "I love your confidence",
      "You seem like my kind of person",
      "There's something special about you",
      "I couldn't walk by without saying hi",
      "You have the best laugh",
      "I'm drawn to your energy",
      "You seem like someone I'd want to know better",
      "Your presence just lit up this place"
    ];

    const cacheKey = `pickup_lines_${Math.floor(Date.now() / 300000)}`; // 5-minute tracking
    
    // Get previously used lines from request tracker for uniqueness
    const tracker = requestTracker.get(cacheKey);
    const previousReplies = tracker?.previousReplies || [];
    
    // Find unused lines
    const availableLines = realisticLines.filter(line => !previousReplies.includes(line));
    
    // If all lines used recently, reset and use any line
    const linesToChooseFrom = availableLines.length > 0 ? availableLines : realisticLines;
    
    // Pick random line
    const selectedLine = linesToChooseFrom[Math.floor(Math.random() * linesToChooseFrom.length)];
    
    const finalResponse = {
      replies: [selectedLine],
      tone: "flirty" as const
    };

    // Update tracker with new line
    const currentTracker = requestTracker.get(cacheKey) || { count: 1, lastRequest: Date.now(), previousReplies: [] };
    currentTracker.previousReplies.push(selectedLine);
    // Keep only last 15 lines to prevent memory buildup
    if (currentTracker.previousReplies.length > 15) {
      currentTracker.previousReplies.shift();
    }
    requestTracker.set(cacheKey, currentTracker);

    return finalResponse;
  } catch (error) {
    console.error("Error generating pickup lines:", error);
    throw new Error("Failed to generate pickup lines: " + (error as Error).message);
  }
}
