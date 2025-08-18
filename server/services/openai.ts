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
          content: `You are a dating and chat expert. ${instruction} Generate exactly 3 different reply options that are contextually appropriate for the given message. Keep replies natural, engaging, and under 150 characters each. Respond with JSON in this format: { "replies": ["reply1", "reply2", "reply3"], "tone": "${tone}" }`
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
      replies: result.replies.slice(0, 3),
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
          content: `Generate 3 creative, fun, and respectful pickup lines that are clever but not cheesy. Make them modern, witty, and conversation starters. Respond with JSON in this format: { "replies": ["line1", "line2", "line3"], "tone": "flirty" }`
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
      replies: result.replies.slice(0, 3),
      tone: "flirty"
    };
  } catch (error) {
    console.error("Error generating pickup lines:", error);
    throw new Error("Failed to generate pickup lines: " + (error as Error).message);
  }
}
