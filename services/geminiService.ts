import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { VideoGenerationConfig, AudioGenerationConfig, ImageGenerationConfig } from "../types";

// Helper to get AI instance. 
// Note: For Veo/High-Res Image, we re-instantiate after key selection if needed in the component, 
// but for general use, we assume process.env.API_KEY is available or injected.
const getAI = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey: key });
};

// --- Text Generation ---
const SYSTEM_INSTRUCTION = `
You are OmniGen, an advanced AI creative assistant.
Rules:
1. Use simple, clear language unless advanced terms are requested.
2. No harmful, illegal, or unsafe content.
3. Structure outputs logically (headings, bullet points).
4. For Video requests: Provide complete AI video prompts + scene breakdowns.
5. For Image requests: Provide detailed image prompts.
6. For Audio/Voice: Provide dialogue + tone + mood instructions.
`;

export const generateTextResponse = async (
  prompt: string, 
  history: {role: string, parts: {text: string}[]}[]
): Promise<string> => {
  const ai = getAI();
  // Using gemini-2.5-flash for fast, responsive text chat
  const model = "gemini-2.5-flash";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    history: history,
  });

  const result = await chat.sendMessage({ message: prompt });
  return result.text || "No response generated.";
};

// --- Image Generation ---
export const generateImage = async (config: ImageGenerationConfig): Promise<string> => {
  const ai = getAI();
  // Using gemini-2.5-flash-image (Nano Banana) for general generation/editing
  // For editing, we simply include the image in the parts
  const model = "gemini-2.5-flash-image";
  
  const parts: any[] = [];
  
  // If editing, add the base image first
  if (config.baseImage) {
    parts.push({
      inlineData: {
        data: config.baseImage.data,
        mimeType: config.baseImage.mimeType
      }
    });
    parts.push({ text: `Edit this image: ${config.prompt}` });
  } else {
    parts.push({ text: config.prompt });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
      }
      // Note: outputMimeType/responseMimeType not supported for this model
    }
  });

  // Extract image
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error("No image data found in response");
};

// --- Video Generation (Veo) ---
export const generateVideo = async (config: VideoGenerationConfig): Promise<string> => {
  // IMPORTANT: Veo requires a user-selected paid key.
  // We assume the caller has handled window.aistudio.openSelectKey() and the key is ready in env or we pull fresh.
  // To be safe, we re-instantiate AI here. The SDK will pick up the selected key if injected into env, 
  // but effectively we rely on the environment variable being set by the platform or the default key.
  const ai = getAI(); 
  const model = "veo-3.1-fast-generate-preview";

  let operation;

  const requestConfig = {
    numberOfVideos: 1,
    resolution: config.resolution,
    aspectRatio: config.aspectRatio,
  };

  if (config.image) {
    operation = await ai.models.generateVideos({
      model,
      prompt: config.prompt,
      image: {
        imageBytes: config.image.data,
        mimeType: config.image.mimeType
      },
      config: requestConfig
    });
  } else {
    operation = await ai.models.generateVideos({
      model,
      prompt: config.prompt,
      config: requestConfig
    });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll interval
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed or no URI returned.");

  // Fetch the actual bytes using the URI + API Key
  const fetchUrl = `${videoUri}&key=${process.env.API_KEY}`;
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error("Failed to download video bytes");
  
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// --- Audio Generation (TTS) ---
export const generateSpeech = async (config: AudioGenerationConfig, audioContext: AudioContext): Promise<AudioBuffer> => {
  const ai = getAI();
  const model = "gemini-2.5-flash-preview-tts";

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: config.text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: config.voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");

  // Decode
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Use a decoding helper
  const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
  return audioBuffer;
};

// Helper for raw PCM decoding (as per guide)
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
