import OpenAI from "openai";
import { ElevenLabsClient, stream } from "elevenlabs";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

const PORT = process.env.PORT || 3001;

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, "public")));

//Initializing API clients
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const soundClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Starting");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "health ok" });
});

app.post("/api/analyze", async (req, res) => {
  try {
    // Get base64 image from request body
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Call OpenAI Vision API
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a hiking companion. You speak in a friendly funny tone. You are hiking with kids who have a lot of questions about their surroundings. They have just pointed out an area as marked by the red box. Tell them what it is and its role in nature. End by asking a thoughful questions that gets them thinking about other things in their surroundings. Don't mention the red box",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    // Extract the response content
    const content = response.choices[0].message.content;
    const initialResponse = {
      content: content,
    };
    const audioStream = await soundClient.textToSpeech.convertAsStream(
      "Yko7PKHZNXotIFUBG7I9",
      {
        text: content,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
      }
    );

    // Collect all chunks of audio data
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }

    // Create audio buffer and convert to base64
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString("base64");

    // Return both text and audio
    res.json({
      content: content,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Error calling the API:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
