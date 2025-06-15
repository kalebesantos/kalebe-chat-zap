import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

if (!openRouterApiKey || !openRouterBaseUrl) {
  throw new Error('⚠️ Variáveis de ambiente OPENROUTER_API_KEY ou OPENROUTER_BASE_URL não estão configuradas');
}

// Inicializa o cliente OpenAI para OpenRouter
const openai = new OpenAI({
  apiKey: openRouterApiKey,
  baseURL: openRouterBaseUrl,
  defaultHeaders: {
    'HTTP-Referer': 'https://seusite.com', // Substitua pelo seu domínio real
    'X-Title': 'KalebeChatZap'
  }
});

/**
 * Gera uma resposta com base nas mensagens e estilo fornecidos
 * @param {Array} historico - Histórico de mensagens em formato OpenAI
 * @param {string} estiloPersonalizado - Texto com instruções de estilo (ex: “responda de forma engraçada”)
 * @param {string} modelo - Nome do modelo (default: 'openchat')
 */
export async function gerarRespostaPersonalizada({
  historico,
  estiloPersonalizado = '',
  modelo = 'openchat'
}) {
  try {
    const promptEstilo = estiloPersonalizado.trim()
      ? `Adote o seguinte estilo ao responder: ${estiloPersonalizado}`
      : 'Adote um estilo de comunicação natural, informal e simpático.';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: promptEstilo },
        ...historico
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const resposta = completion.choices[0].message.content.trim();
    return resposta;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta personalizada:', error);
    return 'Desculpe, houve um erro ao gerar a resposta. 😔';
  }
}

/**
 * Gera uma resposta simples sem histórico, apenas com base em uma pergunta
 */
export async function gerarRespostaSimples(pergunta, estilo = '', modelo = 'openchat') {
  return gerarRespostaPersonalizada({
    historico: [{ role: 'user', content: pergunta }],
    estiloPersonalizado: estilo,
    modelo
  });
}

export default openai;
