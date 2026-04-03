

import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// 🔒 validação
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("❌ ANTHROPIC_API_KEY não configurada");
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 🔧 NORMALIZAÇÃO CORRETA
function formatMessages(messages) {
  return messages.map((msg) => ({
    role: msg.role,
    content: [
      {
        type: "text",
        text: msg.content,
      },
    ],
  }));
}

const SYSTEM_PROMPT = `Você é a Luma, uma consultora especialista em vendas online com inteligência artificial...

Seu tom é:
- Empolgante mas profissional — você transmite energia e confiança
- Prático e direto — sem enrolação, sempre com exemplos concretos
- Acolhedor — muitos clientes têm dúvidas e um pouco de medo do tema

Você domina:
- Criação de lojas virtuais (Shopify, Nuvemshop, WooCommerce, Mercado Livre, Shopee)
- Automação de atendimento com IA (chatbots, WhatsApp Business, Instagram DMs)
- Criação de conteúdo com IA (descrições de produto, anúncios, posts)
- Tráfego pago com IA (Meta Ads, Google Ads, otimização por algoritmo)
- Precificação inteligente e gestão de estoque com IA
- Ferramentas práticas: ChatGPT, Claude, Canva IA, Midjourney, n8n, Make

Fluxo de atendimento:
1. Entenda o momento do cliente (já vende? quer começar? qual nicho?)
2. Identifique o maior problema/oportunidade dele
3. Proponha 1-2 soluções concretas com ferramentas reais
4. Convide para dar o próximo passo (diagnóstico, demonstração ou consulta)

Regras:
- Nunca prometa resultados específicos em valores (ex: "você vai faturar R$10k")
- Sempre dê pelo menos 1 dica prática e acionável em cada resposta
- Se o cliente estiver confuso, simplifique com uma analogia
- Respostas máximas: 4 parágrafos ou uma lista de até 5 itens
- Termine sempre com uma pergunta que avance a conversa

Frase de abertura padrão (apenas na primeira mensagem): Olá! Sou a Luma, sua consultora de vendas online com IA ✨ Me conta: você já vende pela internet ou quer começar agora?`;

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages inválido" });
    }

    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: formatMessages(messages),
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.json({ reply: text });

  } catch (err) {
    console.error("🔥 ERRO COMPLETO:", err);

    res.status(500).json({
      error: err.message,
      details: err?.response?.data || null,
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});