import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera uma resposta baseada no histórico e estilo personalizado
 * @param {Object[]} historico - Histórico de mensagens (role: 'user' | 'assistant', content: string)
 * @param {string} estiloPersonalizado - Estilo de resposta opcional
 * @param {string} modelo - Modelo da OpenAI a ser usado (ex: 'gpt-3.5-turbo')
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
      model,
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
 * @returns {Promise<string>} - Resposta gerada
 */
export async function gerarRespostaSimples(mensagem) {
  try {
    const resposta = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
