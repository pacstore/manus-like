import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(express.json());

// caminho absoluto
const __dirname = process.cwd();

// 🔐 GROQ_API_KEY (env ou secrets)
let GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY && fs.existsSync("/secrets/GROQ_API_KEY")) {
  GROQ_API_KEY = fs.readFileSync("/secrets/GROQ_API_KEY", "utf8").trim();
}

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY não encontrada");
  process.exit(1);
}

// 🌐 servir frontend
app.use(express.static(__dirname));

// rota principal → abre o chat
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// rota chat
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
              content:
                "Você é um assistente sênior de programação. Explique com clareza e exemplos."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "Sem resposta"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao falar com a IA" });
  }
});

// start
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
