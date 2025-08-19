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
    const toneInstructions = {
      flirty: "Generate flirty, charming, and playfully romantic replies that show interest and confidence.",
      funny: "Generate humorous, witty, and entertaining replies that will make the conversation light and fun.",
      respectful: "Generate polite, thoughtful, and considerate replies that show genuine interest and respect.",
      sarcastic: "Generate clever, witty, and slightly sarcastic replies that are playful but not mean-spirited."
    };

    const instruction = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.flirty;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a dating and chat expert. ${instruction} Generate exactly 1 reply option that is contextually appropriate for the given message. Keep the reply natural, engaging, and under 150 characters. Respond with JSON in this format: { "replies": ["reply1"], "tone": "${tone}" }`
        },
        {
          role: "user",
          content: `Generate replies for this message: "${text}"`
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate 1 creative, fun, and respectful pickup line that is clever but not cheesy. Make it modern, witty, and a conversation starter. Respond with JSON in this format: { "replies": ["line1"], "tone": "flirty" }`
        },
        {
          role: "user",
          content: "Generate some creative pickup lines"
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
