import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔐 Lê a GROQ_API_KEY (env OU secret em arquivo)
let GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY && fs.existsSync("/secrets/GROQ_API_KEY")) {
  GROQ_API_KEY = fs.readFileSync("/secrets/GROQ_API_KEY", "utf8").trim();
}

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY não encontrada (env nem /secrets)");
  process.exit(1);
}

// rota raiz (health check)
app.get("/", (req, res) => {
  res.send("Manus-like está vivo 🚀");
});

// rota de chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: "Você é um assistente que ajuda a programar."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro Groq:", errText);
      return res.status(500).json({ error: "Erro na Groq API" });
    }

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "Sem resposta da IA"
    });

  } catch (err) {
    console.error("Erro geral:", err);
    res.status(500).json({ error: "Erro ao falar com a IA" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
