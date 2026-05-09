import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyDMl8087e7cKwR7n65Fy8xYyzdH3US9ySM";

if (!API_KEY) {
  console.warn("GEMINI_API_KEY is missing. AI features will not work.");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY });

export const MODELS = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
};