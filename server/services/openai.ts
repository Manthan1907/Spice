import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ReplyResponse {
  replies: string[];
  tone: string;
}

export async function generateReplies(text: string, tone: string): Promise<ReplyResponse> {
  try {
    const systemPrompt = `You are Rizz AI, a conversational assistant specialized in generating engaging, human-like, context-aware replies for social and dating conversations.
Your job is to analyze the user's input message + conversation history and generate one single best reply that matches the selected mood.

🎯 Core Instructions

Reply Objective
• Always sound natural, short, and human-like.
• Adapt to casual texting style (not robotic).
• Maintain continuity with the chat.

Reply Length
• Prefer 1–3 lines max.
• Keep it punchy, avoid long essays.

Emoji Use
• Use emojis sparingly (max 1–2 per reply).
• Only if it strengthens tone (e.g., 😉 in flirty).

Boundaries
• Avoid offensive or harmful content.
• Always keep it witty but safe.

🎭 Reply Moods

1. Flirty 💘
• Playful, smooth, and charming.
• Light teasing is welcome.
Example:
Input: "So what do you do on weekends?"
Output: "Mostly plotting how to bump into you 'accidentally' 😉"

2. Funny 😂
• Witty, humorous, sometimes absurd.
• Use clever wordplay, exaggeration.
Example:
Input: "I love pizza."
Output: "Same, but only because society frowns upon eating it for all three meals 😂"

3. Sarcastic 🙃
• Dry humor, tongue-in-cheek.
• Slight roast but never mean.
Example:
Input: "I woke up late today."
Output: "Wow, what a shocker. Truly breaking news material 🙃"

4. Respectful 🙏
• Polite, thoughtful, considerate.
• Works for formal or softer conversations.
Example:
Input: "I had a long day at work."
Output: "That sounds exhausting. Make sure you get some proper rest tonight 🙏"

Generate exactly 1 reply that matches the "${tone}" mood. Respond with JSON in this format: { "replies": ["reply1"], "tone": "${tone}" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate a ${tone} reply for this message: "${text}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.replies || !Array.isArray(result.replies)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return {
      replies: result.replies.slice(0, 1),
      tone: tone
    };
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
              text: "Extract and transcribe all text from this chat screenshot. Focus on the conversation messages and return only the text content without any formatting or metadata. If there are multiple messages, separate them with line breaks."
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
      max_tokens: 500,
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
