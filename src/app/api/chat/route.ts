import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const question = body?.message;

    if (typeof question !== "string" || !question.trim()) {
      return Response.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (question.length > 12000) {
      return Response.json(
        { error: "Your message is too long. Please shorten it." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const stream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: question.trim(),
      config: {
        systemInstruction:
          "You are EnterpriseHub AI, an assistant for a virtual data room. " +
          "Give clear, professional, well-organized answers. " +
          "Never claim to have accessed documents or company data that were not provided in the conversation. " +
          "When information is insufficient, explain what is missing.",
        maxOutputTokens: 2048,
      },
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error(
            "Gemini streaming failed:",
            error instanceof Error ? error.message : "Unknown error"
          );
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Gemini chat request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return Response.json(
      { error: "The AI request failed. Please try again." },
      { status: 500 }
    );
  }
}
