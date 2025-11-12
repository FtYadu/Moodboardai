
import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import type { Operation } from '@google/genai';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. App may not function correctly.");
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImages = async (prompt: string, aspectRatio: string, numberOfImages: number): Promise<string[]> => {
    const ai = getAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    }
    throw new Error("Image generation failed or returned no images.");
};

export const getSuggestionsFromAnalysis = async (images: {base64: string, mimeType: string}[]): Promise<string[]> => {
    const ai = getAI();

    // 1. Analyze images to get a theme
    const analysisParts = [
        ...images.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })),
        { text: "Briefly describe the shared visual theme of these images for a moodboard. Focus on style, mood, and color palette in one short phrase." }
    ];

    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: analysisParts },
    });
    
    const theme = analysisResponse.text;

    // 2. Generate new images based on the theme
    const generationPrompt = `A diverse set of 4 aesthetically pleasing images for a mood board with the theme: "${theme}". Provide different styles and compositions.`;

    return await generateImages(generationPrompt, '1:1', 4);
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("Image editing failed to return an image.");
};

export const generateVideo = async (prompt?: string, image?: { imageBytes: string, mimeType: string }, aspectRatio?: "16:9" | "9:16"): Promise<Operation> => {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: image,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });
    return operation;
};

export const checkVideoOperation = async (operation: Operation): Promise<Operation> => {
    const ai = getAI();
    return await ai.operations.getVideosOperation({ operation: operation });
};

export const fetchVideo = async (uri: string): Promise<Blob> => {
    const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    return response.blob();
};

export const analyzeContent = async (prompt: string, fileData?: { base64: string, mimeType: string }, useThinking: boolean = false, useSearch: boolean = false): Promise<{text: string, groundingChunks: any[] | undefined}> => {
    const ai = getAI();
    const parts = [];
    if (fileData) {
        parts.push({ inlineData: { data: fileData.base64, mimeType: fileData.mimeType } });
    }
    parts.push({ text: prompt });

    const model = useThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
            ...(useThinking && { thinkingConfig: { thinkingBudget: 32768 } }),
            ...(useSearch && { tools: [{ googleSearch: {} }] }),
        },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { text: response.text, groundingChunks };
};

export const createChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};
