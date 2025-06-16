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
 * @param {Array} exemplosMensagens - Exemplos de mensagens do admin para referência
 * @returns {Promise<string>} - Resposta gerada
 */
export async function gerarResposta({ historico, estiloPersonalizado = '', modelo = 'gpt-3.5-turbo', exemplosMensagens = [] }) {
  try {
    const mensagens = [];

    // Sistema de prompt mais sofisticado para imitar comportamento humano
    if (estiloPersonalizado && exemplosMensagens.length > 0) {
      const exemplosTexto = exemplosMensagens.slice(0, 8).join('\n- ');
      
      mensagens.push({
        role: 'system',
        content: `Você deve responder EXATAMENTE como esta pessoa responderia, imitando completamente seu estilo de comunicação. 

IMPORTANTE: Você NÃO é um assistente. Você é essa pessoa real respondendo suas mensagens do WhatsApp.

Estilo da pessoa: ${estiloPersonalizado}

Exemplos de como essa pessoa escreve:
- ${exemplosTexto}

REGRAS CRÍTICAS:
1. NUNCA se identifique como IA, assistente ou bot
2. Responda como se fosse a própria pessoa
3. Use o mesmo tom, gírias e expressões dos exemplos
4. Mantenha respostas naturais e humanas
5. Se não souber algo, responda como uma pessoa normal responderia
6. Use emojis e linguagem informal se a pessoa usar
7. Seja direto e natural, sem formalidades desnecessárias
8. Responda como se estivesse conversando pelo WhatsApp mesmo`
      });
    } else {
      // Fallback para quando não há estilo personalizado
      mensagens.push({
        role: 'system',
        content: `Você é uma pessoa real respondendo mensagens no WhatsApp. Seja natural, direto e humano. 
        
NUNCA se identifique como IA ou assistente. Responda como uma pessoa normal responderia.
Use linguagem casual e natural do WhatsApp.`
      });
    }

    mensagens.push(...historico);

    const resposta = await openai.chat.completions.create({
      model: modelo,
      messages: mensagens,
      temperature: 0.8, // Aumentado para respostas mais variadas e humanas
      max_tokens: 500, // Reduzido para respostas mais concisas como WhatsApp
      presence_penalty: 0.3, // Evita repetições
      frequency_penalty: 0.3, // Varia o vocabulário
    });

    let respostaFinal = resposta.choices[0].message.content;
    
    // Remove frases típicas de assistente que possam escapar
    respostaFinal = respostaFinal
      .replace(/como (?:um )?assistente/gi, '')
      .replace(/posso ajud[aá]-?lo/gi, 'posso te ajudar')
      .replace(/estou aqui para/gi, 'tô aqui pra')
      .replace(/como posso assist[iî]-?lo/gi, 'em que posso te ajudar')
      .replace(/sou uma? (?:IA|intelig[eê]ncia artificial)/gi, '')
      .trim();

    return respostaFinal;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta:', error);
    return 'Opa, deu algum problema aqui. Tenta de novo?';
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
          role: 'system',
          content: 'Você é uma pessoa real respondendo no WhatsApp. Seja natural e direto. NUNCA se identifique como IA.'
        },
        {
          role: 'user',
          content: mensagem,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return resposta.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta simples:', error);
    return 'Deu erro aqui, tenta de novo.';
  }
}

export default openai;