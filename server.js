import OpenAI from "openai";
import { ElevenLabsClient, stream } from "elevenlabs";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const PORT = process.env.PORT || 3001;

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, "public")));

const openai = new OpenAI();

function encodeImage(imagePath) {
  // Convert image to base64
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString("base64");
}

const imagePath = fullImageDataURL;
const base64Image = encodeImage(imagePath);

async function analyzeImage() {
  try {
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
    });

    console.log(response.choices[0]);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
}

analyzeImage();
