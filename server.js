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

const PORT = process.env.PORT || 6001;

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
    // Get base64 image and mode from request body
    const { base64Image, mode } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Define prompts based on setting selected
    let prompt;
    let voiceId;

    switch (mode) {
      case "education":
        voiceId = "Yko7PKHZNXotIFUBG7I9";
        prompt =
          "You are a nature educator/companion for kids in the age group of 7 to 10 years old. Keep your comments friendly, and light, with an emphasis on being educational about nature. Your goal is to make nature and their surroundings accessible to these kids in an interesting but informative way. Be calm but authoritative, also be an engaging personality. You want to make these complex concepts around nature and the natural world accessible and inspiring for young children. The kid has just pointed out an area as marked by the red box. FOCUS PRIMARILY ON WHAT IS INSIDE THE RED BOX. Give interesting facts about the specific object, plant, or feature that is highlighted by the red box. Provide specific and detailed comments about that particular element that encourages them to think critically about it and find similar patterns or related elements in their surroundings. In the end ask them a question that could inspire conversations with their friends about what they see in the red box. Don't mention the red box. Always end with a complete sentence.";
        break;
      case "speculative":
        voiceId = "XB0fDUnXU5powFXDhCwa";
        prompt =
          "You are a creative nature explorer for the age group of 7 to 10 years old. You speak in a knowledgeable, imaginative and curious tone. You are helping kids explore the mysteries of nature. FOCUS PRIMARILY ON WHAT IS INSIDE THE RED BOX. Use the red box highlighted area in the photo/video by the user to ask questions that will encourage exploration and discovery of the specific object or feature that is highlighted. Describe in detail what you see inside the red box and speculate about its history, purpose, or hidden stories. Please remind them to be careful and safe while investigating the area! Ask them a question that they continue to speculate about in regards to what they're seeing inside the red box. Don't mention the red box. Always end with a complete sentence.";
        break;
      case "mindful":
        voiceId = "piTKgcLEGmPE4e6mEKli";
        prompt =
          "You are a hiking friend focused on mindfulness for the age group of 7 to 10 years old. You speak in a calm and reflective tone. You must have a friendly, charismatic and positive demeanor inviting the kids to interact with the space. You are helping kids connect deeply with their natural surroundings. They have just pointed out an area as marked by the red box. FOCUS PRIMARILY ON WHAT IS INSIDE THE RED BOX. Using the red box highlighted area as reference, talk about relaxing and peaceful things you notice about the specific object or feature that is highlighted. Ask them to do something calming with that specific element in their surroundings that will encourage them to put their phones down for a few minutes while they are out on this hike. Encourage them to be mindful and grateful about that particular aspect of nature. Guide them to observe the details, textures, and movements of what's inside the red box. Encourage them to notice how it makes them feel. End by suggesting a moment of quiet observation of that specific element. Don't mention the red box. Always end with a complete sentence.";
        break;
      case "funny":
        voiceId = "ThT5KcBeYPX3keUQqHPh";
        prompt =
          "You are a silly hiking friend for the age group of 7 to 10-years old. You are a joker and silly, and want to have fun, your responses should reflect this kind of personality. FOCUS PRIMARILY ON WHAT IS INSIDE THE RED BOX. Give funny facts about the specific object, plant, or feature that is highlighted by the red box. Make sure the funny facts reveal something about that particular element of nature that the kid may not know about. Don't mention the red box. Always end with a complete sentence.";
        break;
      default:
        voiceId = "Yko7PKHZNXotIFUBG7I9";
        prompt =
          "You are a hiking companion. You speak in a friendly funny tone. You are hiking with kids who have a lot of questions about their surroundings. They have just pointed out an area as marked by the red box. FOCUS PRIMARILY ON WHAT IS INSIDE THE RED BOX. Tell them what the specific object or feature inside the red box is and its role in nature. End by asking a thoughtful question that gets them thinking about other things in their surroundings that are similar to what's inside the red box. Don't mention the red box. Always end with a complete sentence.";
    }

    let duration = 50;

    // Call OpenAI Vision API
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    // Extract the response content
    const content = response.choices[0].message.content;
    const initialResponse = {
      content: content,
    };

    const audioStream = await soundClient.textToSpeech.convertAsStream(
      voiceId,
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
