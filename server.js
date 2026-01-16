import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = process.cwd();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔐 GROQ API KEY
let GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY && fs.existsSync("/secrets/GROQ_API_KEY")) {
  GROQ_API_KEY = fs.readFileSync("/secrets/GROQ_API_KEY", "utf8").trim();
}

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY não encontrada");
  process.exit(1);
}

// 🌐 frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 💬 chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente de programação. Responda normalmente, em português."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await groqResponse.json();

    // 🔎 LOG COMPLETO (ESSENCIAL)
    console.log("🔍 Groq RAW response:");
    console.log(JSON.stringify(data, null, 2));

    // ❌ erro explícito da Groq
    if (data.error) {
      return res.json({
        reply: `Erro Groq: ${data.error.message}`
      });
    }

    // ❌ sem choices
    if (!data.choices || !data.choices[0]) {
      return res.json({
        reply:
          "Groq respondeu sem conteúdo. Sua API pode estar sem acesso ao modelo."
      });
    }

    // ✅ sucesso
    res.json({
      reply: data.choices[0].message.content
    });
  } catch (err) {
    console.error("🔥 Erro no /chat:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 🚀 start
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
