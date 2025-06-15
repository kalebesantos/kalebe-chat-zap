
import { buscarOuCriarUsuario, atualizarEstiloFala } from '../services/userService.js';
import { salvarConversa } from '../services/messageService.js';
import { gerarResposta, listarEstilosDisponiveis } from '../services/openaiService.js';

/**
 * Processa mensagens recebidas no WhatsApp
 * @param {Object} message - Objeto da mensagem do whatsapp-web.js
 * @param {Object} client - Cliente do WhatsApp
 */
export async function processarMensagem(message, client) {
  try {
    // Ignora mensagens de grupos e mensagens do próprio bot
    if (message.from.includes('@g.us') || message.fromMe) {
      return;
    }

    const numeroRemetente = message.from.replace('@c.us', '');
    const textoMensagem = message.body.trim();
    
    console.log(`📱 Mensagem recebida de ${numeroRemetente}: ${textoMensagem}`);

    // Busca ou cria o usuário no banco de dados
    const usuario = await buscarOuCriarUsuario(numeroRemetente, message._data.notifyName);

    // Verifica se é um comando para alterar estilo de fala
    if (textoMensagem.toLowerCase().startsWith('/estilo ')) {
      await processarComandoEstilo(textoMensagem, usuario, message, client);
      return;
    }

    // Verifica se é comando para listar estilos
    if (textoMensagem.toLowerCase() === '/estilos') {
      const estilos = listarEstilosDisponiveis();
      const mensagemEstilos = `📋 *Estilos de fala disponíveis:*\n\n${estilos.join('\n')}\n\n💡 Use: /estilo [nome] para alterar\nExemplo: /estilo engracado`;
      
      await client.sendMessage(message.from, mensagemEstilos);
      return;
    }

    // Verifica se é comando de ajuda
    if (textoMensagem.toLowerCase() === '/ajuda' || textoMensagem.toLowerCase() === '/help') {
      const mensagemAjuda = `🤖 *Bot WhatsApp IA*\n\n` +
        `📝 Comandos disponíveis:\n` +
        `• /estilos - Ver estilos de fala\n` +
        `• /estilo [nome] - Alterar estilo\n` +
        `• /ajuda - Esta mensagem\n\n` +
        `💬 Seu estilo atual: *${usuario.estilo_fala}*\n\n` +
        `Envie qualquer mensagem e eu responderei!`;
      
      await client.sendMessage(message.from, mensagemAjuda);
      return;
    }

    // Gera resposta usando OpenAI
    const respostaIA = await gerarResposta(textoMensagem, usuario.estilo_fala);

    // Envia a resposta de volta
    await client.sendMessage(message.from, respostaIA);

    // Salva a conversa no banco de dados
    await salvarConversa(usuario.id, textoMensagem, respostaIA);

    console.log(`✅ Resposta enviada para ${numeroRemetente}`);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    
    // Envia mensagem de erro para o usuário
    try {
      await client.sendMessage(message.from, 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.');
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

/**
 * Processa comando para alterar estilo de fala
 */
async function processarComandoEstilo(textoMensagem, usuario, message, client) {
  const novoEstilo = textoMensagem.substring(8).trim().toLowerCase();
  const estilosValidos = ['neutro', 'engracado', 'educado', 'direto', 'amigavel', 'brasileiro'];
  
  if (!estilosValidos.includes(novoEstilo)) {
    const mensagemErro = `❌ Estilo inválido!\n\n` +
      `✅ Estilos válidos: ${estilosValidos.join(', ')}\n\n` +
      `💡 Use: /estilos para ver a lista completa`;
    
    await client.sendMessage(message.from, mensagemErro);
    return;
  }

  await atualizarEstiloFala(usuario.id, novoEstilo);
  
  const mensagemSucesso = `✅ Estilo de fala alterado para: *${novoEstilo}*\n\n` +
    `🤖 Agora responderei com esse estilo. Envie uma mensagem para testar!`;
  
  await client.sendMessage(message.from, mensagemSucesso);
}
