import OpenAI from 'openai';
import dotenv from 'dotenv';
import { buscarHistoricoMensagens } from './messageService.js';
import { buscarPerfilEstiloAtivo } from './styleLearningService.js';
import { buscarConfiguracao } from './configService.js';

dotenv.config();
// LOG extra para ver se a key está disponível
console.log('[OpenAI Init] OPENAI_API_KEY', process.env.OPENAI_API_KEY ? 'OK' : 'NÃO ENCONTRADA');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY é obrigatória no arquivo .env');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera uma resposta usando a API da OpenAI baseada no estilo de fala do usuário e histórico
 * @param {string} mensagemUsuario - Mensagem recebida do usuário
 * @param {string} estiloFala - Estilo de fala do usuário
 * @param {string} usuarioId - ID do usuário para buscar histórico
 * @param {string} nomeUsuario - Nome do usuário para personalização
 * @returns {string} Resposta gerada pela IA
 */
export async function gerarResposta(mensagemUsuario, estiloFala = 'neutro', usuarioId, nomeUsuario = null) {
  try {
    // Verifica se o aprendizado de estilo está ativo
    const aprendizadoAtivo = await buscarConfiguracao('aprendizado_estilo_ativo') === 'true';
    let perfilEstilo = null;
    
    if (aprendizadoAtivo) {
      perfilEstilo = await buscarPerfilEstiloAtivo();
    }

    // Define o prompt baseado no estilo de fala ou perfil do admin
    let promptPrincipal;
    
    if (perfilEstilo) {
      // Usa o estilo do administrador
      promptPrincipal = `Você é ${perfilEstilo.nome_admin || 'o administrador'}, ${perfilEstilo.estilo_resumo || 'que tem um estilo único de comunicação'}. 

Tom de comunicação: ${perfilEstilo.tom_comunicacao || 'natural'}

Características do seu estilo:
- Vocabulário: ${perfilEstilo.vocabulario_caracteristico?.join(', ') || 'variado'}
- Emojis frequentes: ${perfilEstilo.emojis_frequentes?.join(' ') || '😊'}
- Expressões: ${perfilEstilo.palavras_frequentes?.lista?.join(', ') || 'naturais'}

Exemplos de como você se comunica:
${perfilEstilo.exemplos_mensagens?.slice(0, 3).map(msg => `"${msg}"`).join('\n') || 'Seja natural e autêntico'}

Responda mantendo EXATAMENTE esse estilo de comunicação.`;
    } else {
      // Usa o estilo padrão baseado na preferência do usuário
      const promptPorEstilo = {
        neutro: "Responda de forma educada e natural, como um assistente útil.",
        engracado: "Responda de forma engraçada e descontraída, use humor brasileiro, piadas e seja bem divertido. Use expressões como 'kkkk', 'cara', 'mano'.",
        educado: "Responda de forma muito educada e formal, usando 'senhor/senhora' e linguagem respeitosa. Seja cordial e profissional.",
        direto: "Seja direto e objetivo. Respostas curtas e práticas, sem enrolação. Vá direto ao ponto.",
        amigavel: "Responda de forma amigável e calorosa, como um amigo próximo. Use um tom carinhoso e acolhedor.",
        brasileiro: "Responda como um brasileiro típico, usando gírias, expressões regionais e jeito de falar bem brasileiro. Use 'né', 'tá ligado', 'beleza'."
      };
      
      promptPrincipal = promptPorEstilo[estiloFala] || promptPorEstilo.neutro;
    }
    
    // Personalização com nome do usuário
    const personalizacao = nomeUsuario 
      ? `Quando apropriado, use o nome do usuário (${nomeUsuario}) para personalizar as respostas.`
      : '';

    // Busca histórico das últimas 5 mensagens
    const historico = await buscarHistoricoMensagens(usuarioId, 5);
    
    // Constrói o contexto com as mensagens anteriores
    const mensagensContexto = [];
    
    // Adiciona mensagem do sistema
    mensagensContexto.push({
      role: "system",
      content: `${promptPrincipal} ${personalizacao} Mantenha as respostas concisas e adequadas para mensagens de celular.`
    });

    // Adiciona histórico de mensagens (do mais antigo para o mais recente)
    if (historico.length > 0) {
      historico.reverse().forEach(msg => {
        mensagensContexto.push({
          role: "user",
          content: msg.mensagem_recebida
        });
        mensagensContexto.push({
          role: "assistant",
          content: msg.mensagem_enviada
        });
      });
    }

    // Adiciona a mensagem atual
    mensagensContexto.push({
      role: "user",
      content: mensagemUsuario
    });

    const contextoInfo = perfilEstilo 
      ? `perfil de ${perfilEstilo.nome_admin}` 
      : `estilo: ${estiloFala}`;
    
    console.log(`🧠 Gerando resposta com ${contextoInfo} e contexto de ${historico.length} mensagens anteriores`);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: mensagensContexto,
      max_tokens: 500,
      temperature: 0.7,
    });

    const resposta = completion.choices[0].message.content.trim();
    console.log(`🤖 Resposta gerada (${contextoInfo}): ${resposta.substring(0, 50)}...`);
    
    return resposta;

  } catch (error) {
    console.error('[❌ OpenAI] Erro ao gerar resposta:', {
      mensagemUsuario,
      estiloFala,
      usuarioId,
      nomeUsuario,
      detalhes: error?.response?.data || error.message || error
    });
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
