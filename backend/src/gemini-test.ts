import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
  apiKey,
});

async function main(): Promise<void> {
  console.log("Testing Gemini...");

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "Say hello in one short sentence.",
  });

  console.log("Gemini response:");
  console.log(response.text);
}

main().catch((error: unknown) => {
  console.error("Gemini test failed:");
  console.error(error);
  process.exit(1);
});