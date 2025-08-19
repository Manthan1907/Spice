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
    const cacheKey = 'pickup_lines';
    
    // Check for rapid consecutive requests (Generate More behavior)
    const tracker = requestTracker.get(cacheKey);
    const now = Date.now();
    let isConsecutiveRequest = false;
    let previousReplies: string[] = [];
    
    if (tracker && (now - tracker.lastRequest) < 10000) { // Within 10 seconds
      tracker.count++;
      tracker.lastRequest = now;
      isConsecutiveRequest = tracker.count > 1;
      previousReplies = tracker.previousReplies || [];
    } else {
      requestTracker.set(cacheKey, { count: 1, lastRequest: now, previousReplies: [] });
    }
    
    // Force bypass for consecutive requests (Generate More clicks)
    const shouldBypass = bypassCache || isConsecutiveRequest;
    
    // Only check cache if NOT bypassing
    if (!shouldBypass) {
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Create uniqueness instructions based on previous responses
    const uniquenessInstruction = previousReplies.length > 0 
      ? ` IMPORTANT: Do NOT repeat these previous pickup lines: ${previousReplies.map(r => `"${r}"`).join(', ')}. Generate something completely different.`
      : '';
    
    const randomSeed = shouldBypass ? ` (Style variant #${tracker?.count || 1})` : '';
    
    const categoryVariations = [
      "chemistry/science themed",
      "food and cooking",
      "music and dance",
      "travel and adventure",
      "books and movies",
      "sports and fitness",
      "technology and gaming",
      "art and creativity",
      "nature and weather",
      "smooth compliments"
    ];
    
    const selectedCategory = categoryVariations[Math.floor(Math.random() * categoryVariations.length)];
    
    const systemPrompt = `You are Rizz AI, a conversational assistant specialized in generating engaging, human-like pickup lines.

🎯 CRITICAL UNIQUENESS REQUIREMENT: 
You MUST generate a ${selectedCategory} pickup line that is completely different from any magician/disappearing references.

Core Instructions:
• Always sound natural, short, and human-like.
• Adapt to casual texting style (not robotic).
• Keep it punchy and witty.
• Generate diverse styles: smooth, clever, funny, confident, sweet
• AVOID overused lines like "Are you a magician?" - be creative!

Pickup Line Requirements:
• Flirty 💘 - Playful, smooth, and charming.
• Light teasing is welcome.
• Modern and conversation-starting.
• Clever but not cheesy.
• Max 1-2 emojis if it strengthens the tone.
• Keep it safe and respectful.
• Focus on ${selectedCategory} theme

${randomSeed}${uniquenessInstruction}

Generate exactly 1 unique ${selectedCategory} pickup line. Respond with JSON in this format: { "replies": ["line1"], "tone": "flirty" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate a creative ${selectedCategory} pickup line.${shouldBypass ? ' Make it unique and completely different from any previous lines.' : ''}${uniquenessInstruction}

BANNED PHRASES (DO NOT USE):
- "Are you a magician"
- "everyone else disappears"  
- Any variation of magician/disappearing themes

Generate something completely fresh and original focused on ${selectedCategory}.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 50, // Increased for more variety
      temperature: shouldBypass ? 0.95 : 0.85, // Higher creativity for more diverse lines
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.replies || !Array.isArray(result.replies)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Check for banned/overused phrases and retry if found
    const bannedPhrases = ["magician", "disappear", "everyone else"];
    const generatedLine = result.replies[0]?.toLowerCase() || "";
    
    if (bannedPhrases.some(phrase => generatedLine.includes(phrase))) {
      // Force retry with different category
      const fallbackLines = [
        "Do you have a map? Because I just got lost in your eyes 😍",
        "Are you WiFi? Because I'm feeling a connection 📶",
        "If you were a vegetable, you'd be a cute-cumber 🥒",
        "Are you a parking ticket? Because you've got fine written all over you 😏",
        "Do you believe in love at first sight, or should I walk by again? 😉",
        "Are you a loan? Because you've got my interest 💰",
        "If kisses were snowflakes, I'd send you a blizzard ❄️",
        "Are you a camera? Because every time I look at you, I smile 📸"
      ];
      
      // Pick a random fallback that wasn't used recently
      let fallbackLine;
      let attempts = 0;
      do {
        fallbackLine = fallbackLines[Math.floor(Math.random() * fallbackLines.length)];
        attempts++;
      } while (previousReplies.includes(fallbackLine) && attempts < 10);
      
      result.replies[0] = fallbackLine;
    }

    const finalResponse = {
      replies: result.replies.slice(0, 1),
      tone: "flirty"
    };

    // Store the new pickup line in tracker for uniqueness checking
    const currentTracker = requestTracker.get(cacheKey);
    if (currentTracker) {
      currentTracker.previousReplies.push(finalResponse.replies[0]);
      // Keep only last 5 pickup lines to avoid overly long history
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
    console.error("Error generating pickup lines:", error);
    throw new Error("Failed to generate pickup lines: " + (error as Error).message);
  }
}
