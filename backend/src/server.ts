import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { connectDatabase, getMessagesCollection } from "./db.js";

const app = express();
const PORT = 3001;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.5-flash-lite";

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
  });
});

// Normal chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({
        error: "conversationId is required",
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: message,
    });

    const responseText =
      result.text ?? "Sorry, I couldn't generate a response.";

    const collection = getMessagesCollection();

    await collection.insertOne({
      conversationId,
      userMessage: message,
      assistantMessage: responseText,
      createdAt: new Date(),
    });

    return res.json({
      response: responseText,
      conversationId,
    });
  } catch (error: any) {
    console.error("Chat error:", error);

    if (error?.status === 429) {
      return res.status(429).json({
        error:
          "Gemini is temporarily rate-limited. Please wait a moment and try again.",
      });
    }

    return res.status(500).json({
      error: "Failed to generate response.",
    });
  }
});

// List conversations
app.get("/api/conversations", async (_req, res) => {
  try {
    const collection = getMessagesCollection();

    const conversations = await collection
      .aggregate([
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $group: {
            _id: "$conversationId",
            lastMessage: {
              $first: "$assistantMessage",
            },
            lastUpdated: {
              $first: "$createdAt",
            },
          },
        },
        {
          $sort: {
            lastUpdated: -1,
          },
        },
      ])
      .toArray();

    return res.json({
      conversations: (
        conversations as Array<{
          _id: string;
          lastMessage: string;
          lastUpdated: Date;
        }>
      ).map((conversation) => ({
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
        lastUpdated: conversation.lastUpdated,
      })),
    });
  } catch (error) {
    console.error("Conversation list error:", error);

    return res.status(500).json({
      error: "Failed to load conversations.",
    });
  }
});

// Load conversation history
app.get("/api/chat/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const collection = getMessagesCollection();

    const messages = await collection
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .toArray();

    return res.json({
      conversationId,
      messages,
    });
  } catch (error) {
    console.error("History error:", error);

    return res.status(500).json({
      error: "Failed to load conversation history.",
    });
  }
});

// Save feedback
app.post("/api/feedback", async (req, res) => {
  try {
    const {
      conversationId,
      messageId,
      feedback,
    } = req.body;

    if (
      !conversationId ||
      typeof conversationId !== "string"
    ) {
      return res.status(400).json({
        error: "conversationId is required",
      });
    }

    if (
      !messageId ||
      typeof messageId !== "string"
    ) {
      return res.status(400).json({
        error: "messageId is required",
      });
    }

    if (feedback !== "up" && feedback !== "down") {
      return res.status(400).json({
        error: "feedback must be 'up' or 'down'",
      });
    }

    const collection = getMessagesCollection();

    const result = await collection.updateOne(
      {
        conversationId,
        assistantMessageId: messageId,
      },
      {
        $set: {
          feedback,
          feedbackUpdatedAt: new Date(),
        },
      },
    );

    return res.json({
      ok: true,
      matched: result.matchedCount,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Feedback error:", error);

    return res.status(500).json({
      error: "Failed to save feedback.",
    });
  }
});

// SSE streaming endpoint
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({
        error: "conversationId is required",
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();

    const responseStream = await ai.models.generateContentStream({
      model: MODEL,
      contents: message,
      config: {
        tools: [
          {
            googleSearch: {},
          },
        ],
      },
    });

    let fullResponse = "";
    let groundingMetadata: unknown = undefined;

    for await (const chunk of responseStream) {
      const text = chunk.text;

      if (text) {
        fullResponse += text;

        res.write(
          `data: ${JSON.stringify({
            text,
          })}\n\n`,
        );
      }

      const candidate = chunk.candidates?.[0];

      if (candidate?.groundingMetadata) {
        groundingMetadata = candidate.groundingMetadata;
      }

    }

    /*
     * Convert Gemini grounding metadata into a small,
     * frontend-friendly citation structure.
     */
    const citations: Array<{
      index: number;
      title: string;
      url: string;
    }> = [];

    const grounding = groundingMetadata as
      | {
          groundingChunks?: Array<{
            web?: {
              uri?: string;
              title?: string;
            };
          }>;
        }
      | undefined;

    const chunks = grounding?.groundingChunks ?? [];

    for (const chunk of chunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title;

      if (!uri) continue;

      if (
        citations.some(
          (citation) => citation.url === uri,
        )
      ) {
        continue;
      }

      citations.push({
        index: citations.length + 1,
        title: title || "Web source",
        url: uri,
      });
    }

    if (citations.length > 0) {
      res.write(
        `data: ${JSON.stringify({
          citations,
        })}\n\n`,
      );
    }

    const collection = getMessagesCollection();

    const assistantMessageId = crypto.randomUUID();

    await collection.insertOne({
      conversationId,
      userMessage: message,
      assistantMessage: fullResponse,
      assistantMessageId,
      citations,
      createdAt: new Date(),
    });

    res.write(
      `data: ${JSON.stringify({
        done: true,
        messageId: assistantMessageId,
        citations,
      })}\n\n`,
    );

    res.end();
  } catch (error: any) {
    console.error("Streaming error:", error);

    const status =
      typeof error?.status === "number"
        ? error.status
        : 500;

    const errorMessage =
      error?.message ||
      error?.error?.message ||
      "Unknown Gemini API error.";

    if (!res.headersSent) {
      return res.status(status).json({
        error: errorMessage,
        status,
      });
    }

    res.write(
      `data: ${JSON.stringify({
        error: errorMessage,
        status,
      })}\n\n`,
    );

    res.end();
  }
});

// Start server
async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(
        `Backend running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();