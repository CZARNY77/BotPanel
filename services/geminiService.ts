import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateBotAdvice = async (
  prompt: string, 
  context: string = ''
): Promise<string> => {
  if (!apiKey) {
    return "No API Key found. Ensure API_KEY environment variable is set.";
  }

  try {
    const systemInstruction = `You are "Bot Copilot" - an intelligent assistant in a Discord bot configuration panel for server admins.
    
    Your goals:
    1. Help write engaging Welcome Messages using variables like {user} and {server}.
    2. Help create moderation rules.
    3. Suggest configurations in JSON format if requested.
    
    Style:
    - Be concise and helpful.
    - If generating a Discord message, use Markdown (bold, italics).
    - If asked for welcome config, you can return JSON with fields: title, description, footer.
    
    Language: English.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI assistant. Please try again later.";
  }
};