import express from "express";
import "dotenv/config";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Manus-like está vivo 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Você é um assistente que ajuda a programar."
        },
        { role: "user", content: userMessage }
      ]
    })
  });

  const data = await response.json();
  res.json({ answer: data.choices[0].message.content });
});

app.listen(3000);
