import "dotenv/config";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Simple response cache for faster repeated requests
const responseCache = new Map<string, { response: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track consecutive requests and previous responses for uniqueness
const requestTracker = new Map<string, { count: number, lastRequest: number, previousReplies: string[], similarPatterns: string[] }>();

// Global pickup lines history to prevent ALL repetition
const pickupLinesHistory = new Set<string>();
const pickupLinePatterns = new Set<string>();

// Enhanced similarity detection
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tokenizeWords(text: string): string[] {
  return normalizeWhitespace(text.toLowerCase())
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(' ')
    .filter(Boolean);
}

function buildNgrams(words: string[], n: number): Set<string> {
  const grams = new Set<string>();
  if (words.length === 0) return grams;
  if (words.length < n) {
    grams.add(words.join(' '));
    return grams;
  }
  for (let i = 0; i <= words.length - n; i++) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of Array.from(a)) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function isSimilarResponse(newReply: string, previousReplies: string[]): boolean {
  const newLower = normalizeWhitespace(newReply.toLowerCase());

  // Check for exact matches or very similar phrases
  for (const prev of previousReplies) {
    const prevLower = normalizeWhitespace(prev.toLowerCase());

    // Exact match
    if (newLower === prevLower) return true;

    // Check for similar starting phrases
    if (
      newLower.startsWith(prevLower.substring(0, Math.min(10, prevLower.length))) ||
      prevLower.startsWith(newLower.substring(0, Math.min(10, newLower.length)))
    ) {
      return true;
    }

    // Check for common repetitive patterns
    const commonPatterns = [
      'only because',
      'you know',
      'come on',
      "can't resist",
      'love it',
      'deep down',
      'secretly',
      'guilty as',
      'what can i say',
      "couldn't resist",
    ];

    for (const pattern of commonPatterns) {
      if (newLower.includes(pattern) && prevLower.includes(pattern)) {
        return true;
      }
    }

    // N-gram Jaccard similarity on word bigrams for style overlap
    const newBigrams = buildNgrams(tokenizeWords(newLower), 2);
    const prevBigrams = buildNgrams(tokenizeWords(prevLower), 2);
    const bigramSim = jaccardSimilarity(newBigrams, prevBigrams);
    if (bigramSim >= 0.5) return true;
  }

  return false;
}

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
      requestTracker.set(cacheKey, { count: 1, lastRequest: now, previousReplies: [], similarPatterns: [] });
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
      flirty: `You are an AI trained to generate short, flirty, playful, and slightly adult-tinged text replies. 
Your job is to create messages that feel natural, witty, and attractive without being repetitive. 

RULES:
1. Replies must stay SHORT and MEDIUM — never essays, never one-word. (Ideal: 2-3 lines, max 20 words). 
2. Always maintain a FLIRTY tone — teasing, suggestive, fun, sometimes a little bold, but never explicit or vulgar. 
3. Every reply must be UNIQUE. Never reuse the same structure, words, or phrasing across different responses. 
   - If you've written something like "thinking about you," don't write it again in future outputs. 
   - Vary sentence openings (avoid starting always with "I," "Can't wait," "Just…"). 
   - Use synonyms, metaphors, emojis (sparingly), and playful twists for variety.
4. Flirty ≠ charming. Keep replies slightly cheeky and suggestive, not just sweet.  
   Example vibes: playful dares, light innuendos, teasing compliments, cheeky confidence. 
5. Replies must sound human, casual, and spontaneous — like a witty person texting, not a script. 
6. Match the **context of user input** — replies should feel like direct responses, not generic pickup lines.  
7. Never break character as a flirty texter.

STYLE INSTRUCTIONS:
- Use teasing compliments: "You're trouble in the best way 😏"
- Use playful dares: "Bet you can't handle me 😉"
- Use cheeky curiosity: "Careful, you're making me want to misbehave…"
- Keep it fun, never cringe, never repetitive.

Your goal:  
Always generate fresh, unique, short, flirty replies that make the other person smile, blush, or get curious.`,
      funny: "Witty, humorous, clever with jokes, puns, or absurd humor. Use wordplay, funny observations, or playful roasts. Vary between dad jokes and witty comebacks. Max 1-2 emojis.", 
      sarcastic: "Dry humor, witty comebacks, tongue-in-cheek responses. Use irony, playful roasts, or clever observations. Vary between subtle and obvious sarcasm. Max 1-2 emojis.",
      respectful: "Polite, thoughtful, genuine responses. Use encouragement, understanding, or thoughtful questions. Vary between supportive and curious approaches. Max 1-2 emojis."
    };

    const moodInstruction = moodInstructions[tone as keyof typeof moodInstructions] || moodInstructions.flirty;
    
    // Create uniqueness instructions based on previous responses
    const uniquenessInstruction = previousReplies.length > 0 
      ? ` CRITICAL: Do NOT use these repetitive patterns or similar responses: ${previousReplies.map(r => `"${r}"`).join(', ')}. 

AVOID THESE OVERUSED PHRASES:
- "Only because..."
- "You know..."
- "Come on..."
- "Can't resist..."
- "Love it..."
- "Deep down..."
- "Secretly..."
- "Guilty as..."
- "What can I say..."
- "Couldn't resist..."

Generate something COMPLETELY DIFFERENT in style, approach, and wording. Be creative and unique!`
      : '';
    
    // Enhanced system prompt for more diverse and context-aware responses
    const randomSeed = shouldBypass ? ` (Style variant #${tracker?.count || 1})` : '';
    const contextInstruction = `Read the ENTIRE conversation for context, but respond ONLY to the most recent message.`;
    
    const systemPrompt = `${moodInstruction}

${contextInstruction}${randomSeed}${uniquenessInstruction}

JSON format: { "replies": ["reply"], "tone": "${tone}" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cost-effective GPT-4o mini for text reply generation - 95% cheaper than GPT-4o
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Conversation context:
${text}

Generate a natural, flirty response that fits the conversation.${shouldBypass ? ' Make this response completely unique and different from any previous responses.' : ''}${uniquenessInstruction}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 80, // Allow for 2-3 sentences as specified in flirty prompt
      temperature: shouldBypass ? 0.95 : 0.8 // Higher creativity for more diverse responses
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.replies || !Array.isArray(result.replies)) {
      throw new Error("Invalid response format from OpenAI");
    }

    const newReply = result.replies[0];
    
    // Check if the new response is too similar to previous ones
    if (previousReplies.length > 0 && isSimilarResponse(newReply, previousReplies)) {
      // If similar, try one more time with stronger uniqueness instruction
      const strongerUniquenessInstruction = `URGENT: The previous response was too similar. Generate something COMPLETELY DIFFERENT. Avoid ALL these patterns: ${previousReplies.slice(-3).map(r => `"${r}"`).join(', ')}. Be creative, unique, and avoid repetitive phrases!`;
      
      const retryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt.replace(uniquenessInstruction, strongerUniquenessInstruction)
          },
          {
            role: "user",
            content: `Full conversation context:
${text}

Generate a natural, flirty response that is COMPLETELY DIFFERENT from previous responses. Be creative and unique!`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 80,
        temperature: 0.95, // Higher creativity for retry
      });
      
      const retryResult = JSON.parse(retryResponse.choices[0].message.content || "{}");
      if (retryResult.replies && Array.isArray(retryResult.replies)) {
        result.replies = retryResult.replies;
      }
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
    // Validate base64 image
    if (!base64Image || base64Image.length < 100) {
      throw new Error("Invalid or empty image data");
    }

    // Check if base64 is valid
    try {
      Buffer.from(base64Image, 'base64');
    } catch (e) {
      throw new Error("Invalid base64 image format");
    }

    console.log("Starting image analysis with OpenAI Vision API...");
    
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Keep GPT-4o for image analysis - requires vision capabilities not available in mini version
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
      max_tokens: 500, // Increased for better text extraction
      temperature: 0.1, // Low temperature for accurate OCR
    });

    const extractedText = visionResponse.choices[0].message.content || "";
    
    console.log("OpenAI Vision API response received");
    
    // Enhanced validation
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("No readable text content found in the image. Please ensure the image contains clear, readable chat messages.");
    }
    
    // Check if it's an error response
    if (extractedText.toLowerCase().includes("unable to extract") || 
        extractedText.toLowerCase().includes("cannot read") ||
        extractedText.toLowerCase().includes("blurry") ||
        extractedText.toLowerCase().includes("low quality") ||
        extractedText.toLowerCase().includes("not clearly visible")) {
      throw new Error("Image quality too low or text not clearly visible. Please upload a clearer screenshot with readable text.");
    }

    console.log("Image analysis completed successfully");
    return extractedText;
  } catch (error) {
    console.error("Error analyzing image:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        throw new Error("OpenAI API rate limit exceeded. Please try again in a moment.");
      } else if (error.message.includes("invalid api key")) {
        throw new Error("OpenAI API key is invalid. Please check your configuration.");
      } else if (error.message.includes("quota")) {
        throw new Error("OpenAI API quota exceeded. Please check your account limits.");
      } else {
        throw new Error("Failed to analyze image: " + error.message);
      }
    }
    
    throw new Error("Failed to analyze image: Unknown error occurred");
  }
}

// Helper function to normalize pickup lines for similarity detection
function normalizePickupLine(line: string): string {
  return line.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// Helper function to extract key patterns from pickup lines
function extractPickupLinePattern(line: string): string {
  const normalized = normalizePickupLine(line);
  // Extract the first 5 words as the pattern
  return normalized.split(' ').slice(0, 5).join(' ');
}

// Check if a pickup line is too similar to existing ones
function isPickupLineSimilar(newLine: string): boolean {
  const normalized = normalizePickupLine(newLine);
  const pattern = extractPickupLinePattern(newLine);
  
  // Check exact matches
  if (pickupLinesHistory.has(normalized)) {
    return true;
  }
  
  // Check pattern matches
  if (pickupLinePatterns.has(pattern)) {
    return true;
  }
  
  // Check for similar patterns in existing lines
  for (const existingPattern of pickupLinePatterns) {
    const similarity = jaccardSimilarity(
      new Set(pattern.split(' ')),
      new Set(existingPattern.split(' '))
    );
    if (similarity > 0.6) { // 60% similarity threshold
      return true;
    }
  }
  
  return false;
}

export async function generatePickupLines(bypassCache: boolean = false): Promise<ReplyResponse> {
  try {
    console.log("Generating unique pickup lines...");
    
    // Diverse pickup line categories with more variety
    const pickupLineCategories = [
      "smooth and confident opener",
      "playful flirty tease", 
      "witty conversation starter",
      "charming direct approach",
      "clever observational pickup line",
      "bold but respectful line",
      "funny pickup line",
      "sweet romantic opener",
      "nerdy/geeky pickup line",
      "food-related pickup line",
      "music/movie reference pickup line",
      "compliment-based pickup line",
      "question-style pickup line",
      "metaphor-based pickup line",
      "time/date themed pickup line"
    ];
    
    const selectedCategory = pickupLineCategories[Math.floor(Math.random() * pickupLineCategories.length)];
    
    // Create comprehensive uniqueness instruction using global history
    const historyArray = Array.from(pickupLinesHistory);
    const recentLines = historyArray.slice(-15); // Last 15 lines
    
    const uniquenessInstruction = recentLines.length > 0 
      ? ` CRITICAL: NEVER repeat or create similar versions of these pickup lines: ${recentLines.map(r => `"${r}"`).join(', ')}. 
      
AVOID THESE PATTERNS:
- Starting with "Are you..." if already used
- Using same topics (Google, parking ticket, etc.) if already used
- Similar joke structures or wordplay patterns
- Any variation of previously generated lines

Generate something COMPLETELY DIFFERENT in approach, topic, and structure.`
      : '';
    
    const systemPrompt = `You are Rizz AI, the ultimate pickup line generator. Create COMPLETELY UNIQUE pickup lines that have NEVER been generated before.

🎯 PICKUP LINE REQUIREMENTS:
• Must be a proper pickup line that shows romantic/flirty interest
• Sound confident, charming, and playful
• ${selectedCategory} style approach
• Modern dating/texting style that actually works
• ABSOLUTELY NO repetition of previous lines or similar patterns
• Creative, fresh, and memorable

STYLE VARIETY (choose different approaches):
• Question format: "Are you...?" or "Do you...?"
• Statement format: "You must be..." or "I think..."
• Compliment format: "You're so..." with a twist
• Hypothetical: "If you were..." or "If I could..."
• Direct: "I have to tell you..." or "Can I..."
• Metaphor: Comparing to objects/concepts
• Wordplay: Puns and clever language
• Pop culture: References to movies/songs/memes
• Food/drink themes
• Technology themes
• Science/math themes

Style Guidelines:
• Keep it punchy and memorable (5-15 words)
• Include flirty/romantic intent - not just friendly
• Can be slightly cheesy but still clever
• Use 0-1 emojis maximum
• Make it sound like an actual pickup line, not a compliment
• MUST be completely different from any previous lines

${uniquenessInstruction}

Generate 1 completely unique ${selectedCategory}. JSON: { "replies": ["line"], "tone": "flirty" }`;

    let attempts = 0;
    const maxAttempts = 3;
    let finalResponse: ReplyResponse | null = null;

    while (attempts < maxAttempts && !finalResponse) {
      attempts++;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate a completely unique ${selectedCategory} pickup line that has NEVER been generated before. Make it creative, fresh, and different from all previous lines.${uniquenessInstruction}

MUST BE COMPLETELY UNIQUE - no repetition of previous patterns, topics, or structures.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 80,
        temperature: 0.9 + (attempts * 0.1), // Increase randomness with each attempt
        presence_penalty: 0.6, // Discourage repetition
        frequency_penalty: 0.6  // Discourage frequent patterns
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.replies || !Array.isArray(result.replies)) {
        continue;
      }

      const newLine = result.replies[0];
      
      // Check if the line is unique
      if (!isPickupLineSimilar(newLine)) {
        // Store the unique line in global history
        const normalized = normalizePickupLine(newLine);
        const pattern = extractPickupLinePattern(newLine);
        
        pickupLinesHistory.add(normalized);
        pickupLinePatterns.add(pattern);
        
        // Keep history manageable (last 100 lines)
        if (pickupLinesHistory.size > 100) {
          const oldestLines = Array.from(pickupLinesHistory).slice(0, 20);
          oldestLines.forEach(line => {
            pickupLinesHistory.delete(line);
            const oldPattern = extractPickupLinePattern(line);
            pickupLinePatterns.delete(oldPattern);
          });
        }
        
        finalResponse = {
          replies: [newLine],
          tone: "flirty"
        };
        
        console.log(`Unique pickup line generated on attempt ${attempts}: "${newLine}"`);
        break;
      } else {
        console.log(`Attempt ${attempts}: Line too similar to existing ones, retrying...`);
      }
    }
    
    // If all attempts failed, generate a completely unique fallback
    if (!finalResponse) {
      console.log("All attempts failed, generating time-based unique fallback");
      const timestamp = Date.now();
      const uniqueId = timestamp.toString().slice(-4);
      finalResponse = {
        replies: [`Are you a rare gem? Because finding you feels like winning the lottery! (${uniqueId})`],
        tone: "flirty"
      };
      
      // Store the fallback too
      const normalized = normalizePickupLine(finalResponse.replies[0]);
      pickupLinesHistory.add(normalized);
    }
    
    console.log("Pickup line generation completed successfully");
    return finalResponse;
  } catch (error) {
    console.error("Error generating pickup lines:", error);
    throw new Error("Failed to generate pickup lines: " + (error as Error).message);
  }
}
