
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Preferência para OpenRouter se configurado
const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL || undefined;

if (!apiKey) {
  console.error(
    '❌ Nenhuma chave de API encontrada! Defina OPENAI_API_KEY (OpenAI) ou OPENROUTER_API_KEY (OpenRouter) no .env'
  );
}

if (process.env.OPENROUTER_API_KEY) {
  console.log('🛡️ Usando OpenRouter API');
} else if (process.env.OPENAI_API_KEY) {
  console.log('🤖 Usando OpenAI API');
}

const openai = new OpenAI({
  apiKey,
  baseURL, // undefined para OpenAI padrão, OpenRouter para customização
});

/**
 * Gera uma resposta baseada no histórico e estilo personalizado
 * @param {Object[]} historico - Histórico de mensagens (role: 'user' | 'assistant', content: string)
 * @param {string} estiloPersonalizado - Estilo de resposta opcional
 * @param {string} modelo - Modelo a ser usado (ex: 'gpt-3.5-turbo' ou 'mistralai/mixtral-8x7b')
 * @returns {Promise<string>} - Resposta gerada
 */
export async function gerarResposta({ historico, estiloPersonalizado = '', modelo = 'gpt-3.5-turbo' }) {
  try {
    const mensagens = [];

    if (estiloPersonalizado) {
      mensagens.push({
        role: 'system',
        content: `Adote o seguinte estilo de resposta para conversar com o usuário: ${estiloPersonalizado}`,
      });
    }

    mensagens.push(...historico);

    const resposta = await openai.chat.completions.create({
      model: modelo, // O modelo pode ser 'gpt-3.5-turbo' (OpenAI) ou 'mistralai/mixtral-8x7b' (OpenRouter)
      messages: mensagens,
      temperature: 0.7,
      max_tokens: 800,
    });

    return resposta.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta:', error);
    return 'Desculpe, ocorreu um erro ao gerar a resposta.';
  }
}

/**
 * Gera uma resposta simples (sem histórico/contexto)
 * @param {string} mensagem - Mensagem simples
 * @param {string} modelo - Modelo a ser usado (opcional)
 * @returns {Promise<string>} - Resposta gerada
 */
export async function gerarRespostaSimples(mensagem, modelo = 'gpt-3.5-turbo') {
  try {
    const resposta = await openai.chat.completions.create({
      model: modelo,
      messages: [
        {
          role: 'user',
          content: mensagem,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return resposta.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta simples:', error);
    return 'Erro ao gerar resposta.';
  }
}

export default openai;
