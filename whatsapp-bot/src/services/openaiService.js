
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY é obrigatória no arquivo .env');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera uma resposta usando a API da OpenAI baseada no estilo de fala do usuário
 * @param {string} mensagemUsuario - Mensagem recebida do usuário
 * @param {string} estiloFala - Estilo de fala do usuário
 * @returns {string} Resposta gerada pela IA
 */
export async function gerarResposta(mensagemUsuario, estiloFala = 'neutro') {
  try {
    // Define o prompt baseado no estilo de fala
    const promptPorEstilo = {
      neutro: "Responda de forma educada e natural, como um assistente útil.",
      
      engracado: "Responda de forma engraçada e descontraída, use humor brasileiro, piadas e seja bem divertido. Use expressões como 'kkkk', 'cara', 'mano'.",
      
      educado: "Responda de forma muito educada e formal, usando 'senhor/senhora' e linguagem respeitosa. Seja cordial e profissional.",
      
      direto: "Seja direto e objetivo. Respostas curtas e práticas, sem enrolação. Vá direto ao ponto.",
      
      amigavel: "Responda de forma amigável e calorosa, como um amigo próximo. Use um tom carinhoso e acolhedor.",
      
      brasileiro: "Responda como um brasileiro típico, usando gírias, expressões regionais e jeito de falar bem brasileiro. Use 'né', 'tá ligado', 'beleza'."
    };

    const promptEstilo = promptPorEstilo[estiloFala] || promptPorEstilo.neutro;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente inteligente no WhatsApp. ${promptEstilo} Mantenha as respostas concisas e adequadas para mensagens de celular.`
        },
        {
          role: "user",
          content: mensagemUsuario
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const resposta = completion.choices[0].message.content.trim();
    console.log(`🤖 Resposta gerada (estilo: ${estiloFala}): ${resposta.substring(0, 50)}...`);
    
    return resposta;

  } catch (error) {
    console.error('❌ Erro ao gerar resposta da OpenAI:', error);
    return 'Desculpe, tive um problema para processar sua mensagem. Tente novamente em alguns instantes.';
  }
}

/**
 * Lista os estilos de fala disponíveis
 */
export function listarEstilosDisponiveis() {
  return [
    '🤖 neutro - Resposta equilibrada e natural',
    '😂 engracado - Resposta divertida e descontraída', 
    '🎩 educado - Resposta formal e respeitosa',
    '⚡ direto - Resposta objetiva e prática',
    '😊 amigavel - Resposta calorosa e acolhedora',
    '🇧🇷 brasileiro - Resposta com gírias e jeito brasileiro'
  ];
}
