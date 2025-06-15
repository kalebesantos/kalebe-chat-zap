import { buscarOuCriarUsuario, atualizarEstiloFala, atualizarNomeUsuario } from '../services/userService.js';
import { salvarConversa } from '../services/messageService.js';
import { gerarResposta, listarEstilosDisponiveis } from '../services/openaiService.js';
import { buscarModoResposta, atualizarModoResposta } from '../services/configService.js';
import { usuarioPorNumeroTemHistorico } from '../services/conversationService.js';
import { 
  usuarioPorNumeroEstaAtivo, 
  ativarConversaPorNumero, 
  desativarConversaPorNumero, 
  listarConversasAtivas,
  atualizarUltimaAtividade
} from '../services/activeConversationService.js';

/**
 * Processa mensagens recebidas no WhatsApp
 * @param {Object} message - Objeto da mensagem do whatsapp-web.js
 * @param {Object} client - Cliente do WhatsApp
 */
export async function processarMensagem(message, client) {
  try {
    // Ignora mensagens de grupos, status e mensagens do próprio bot
    if (message.from.includes('@g.us') || 
        message.from.includes('status@broadcast') || 
        message.fromMe) {
      return;
    }

    const numeroRemetente = message.from.replace('@c.us', '');
    const textoMensagem = message.body.trim();
    
    console.log(`📱 Mensagem recebida de ${numeroRemetente}: ${textoMensagem}`);

    // Verifica comandos de administração (prioritário)
    if (textoMensagem.toLowerCase().startsWith('/ativar ')) {
      await processarComandoAtivar(textoMensagem, message, client);
      return;
    }

    if (textoMensagem.toLowerCase().startsWith('/desativar ')) {
      await processarComandoDesativar(textoMensagem, message, client);
      return;
    }

    if (textoMensagem.toLowerCase() === '/listar_ativos') {
      await processarComandoListarAtivos(message, client);
      return;
    }

    // Verifica comandos de modo (prioritário)
    if (textoMensagem.toLowerCase().startsWith('/modo ')) {
      await processarComandoModo(textoMensagem, message, client);
      return;
    }

    // Busca o modo atual de resposta
    const modoAtual = await buscarModoResposta();
    console.log(`🤖 Modo atual: ${modoAtual}`);

    // Se estiver em modo restrito, verifica se o usuário pode conversar
    if (modoAtual === 'restrito') {
      const estaAtivo = await usuarioPorNumeroEstaAtivo(numeroRemetente);
      
      if (!estaAtivo) {
        console.log(`🚫 Usuário ${numeroRemetente} não está em conversa ativa - ignorando mensagem (modo restrito)`);
        
        // Enviar mensagem informando sobre o modo restrito
        const mensagemRestrito = `🤖 *Bot em Modo Restrito*\n\n` +
          `Este bot está configurado para responder apenas a usuários em conversas ativas.\n\n` +
          `Se você precisa falar comigo, entre em contato com o administrador para ativar nossa conversa.`;
        
        await client.sendMessage(message.from, mensagemRestrito);
        return;
      }

      // Se chegou aqui, usuário está ativo - atualiza última atividade
      const usuario = await buscarOuCriarUsuario(numeroRemetente, message._data.notifyName);
      await atualizarUltimaAtividade(usuario.id);
    }

    // Busca ou cria o usuário no banco de dados
    const usuario = await buscarOuCriarUsuario(numeroRemetente, message._data.notifyName);

    // Verifica se é um comando para alterar estilo de fala
    if (textoMensagem.toLowerCase().startsWith('/estilo ')) {
      await processarComandoEstilo(textoMensagem, usuario, message, client);
      return;
    }

    // Verifica se é um comando para alterar nome
    if (textoMensagem.toLowerCase().startsWith('/nome ')) {
      await processarComandoNome(textoMensagem, usuario, message, client);
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
      const estaAtivo = modoAtual === 'restrito' ? await usuarioPorNumeroEstaAtivo(numeroRemetente) : true;
      
      const mensagemAjuda = `🤖 *Bot WhatsApp IA*\n\n` +
        `📝 Comandos disponíveis:\n` +
        `• /estilos - Ver estilos de fala\n` +
        `• /estilo [nome] - Alterar estilo\n` +
        `• /nome [nome] - Alterar seu nome\n` +
        `• /modo [aberto|restrito] - Alterar modo\n` +
        `• /ativar [numero] - Ativar conversa (admin)\n` +
        `• /desativar [numero] - Desativar conversa (admin)\n` +
        `• /listar_ativos - Listar conversas ativas (admin)\n` +
        `• /ajuda - Esta mensagem\n\n` +
        `👤 Seu nome: *${usuario.nome || 'Não definido'}*\n` +
        `💬 Seu estilo atual: *${usuario.estilo_fala}*\n` +
        `🔧 Modo atual: *${modoAtual}*\n` +
        `${modoAtual === 'restrito' ? `🟢 Status conversa: *${estaAtivo ? 'Ativa' : 'Inativa'}*\n` : ''}` +
        `\nEnvie qualquer mensagem e eu responderei com contexto das conversas anteriores!`;
      
      await client.sendMessage(message.from, mensagemAjuda);
      return;
    }

    // Gera resposta usando OpenAI com contexto e personalização
    const respostaIA = await gerarResposta(
      textoMensagem, 
      usuario.estilo_fala, 
      usuario.id, 
      usuario.nome
    );

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
 * Processa comando para ativar conversa
 */
async function processarComandoAtivar(textoMensagem, message, client) {
  const numeroParaAtivar = textoMensagem.substring(8).trim();
  
  if (!numeroParaAtivar || numeroParaAtivar.length < 10) {
    const mensagemErro = `❌ Número inválido!\n\n` +
      `💡 Use: /ativar [numero]\n` +
      `Exemplo: /ativar 5511999999999`;
    
    await client.sendMessage(message.from, mensagemErro);
    return;
  }

  const sucesso = await ativarConversaPorNumero(numeroParaAtivar, true);
  
  if (sucesso) {
    const mensagemSucesso = `✅ Conversa ativada com sucesso!\n\n` +
      `📱 Número: *${numeroParaAtivar}*\n` +
      `🟢 Status: *Ativo*\n\n` +
      `O usuário agora pode conversar com o bot no modo restrito.`;
    
    await client.sendMessage(message.from, mensagemSucesso);
  } else {
    await client.sendMessage(message.from, '❌ Erro ao ativar conversa. Verifique se o número já conversou com o bot.');
  }
}

/**
 * Processa comando para desativar conversa
 */
async function processarComandoDesativar(textoMensagem, message, client) {
  const numeroParaDesativar = textoMensagem.substring(11).trim();
  
  if (!numeroParaDesativar || numeroParaDesativar.length < 10) {
    const mensagemErro = `❌ Número inválido!\n\n` +
      `💡 Use: /desativar [numero]\n` +
      `Exemplo: /desativar 5511999999999`;
    
    await client.sendMessage(message.from, mensagemErro);
    return;
  }

  const sucesso = await desativarConversaPorNumero(numeroParaDesativar);
  
  if (sucesso) {
    const mensagemSucesso = `✅ Conversa desativada com sucesso!\n\n` +
      `📱 Número: *${numeroParaDesativar}*\n` +
      `🔴 Status: *Inativo*\n\n` +
      `O usuário não pode mais conversar com o bot no modo restrito.`;
    
    await client.sendMessage(message.from, mensagemSucesso);
  } else {
    await client.sendMessage(message.from, '❌ Erro ao desativar conversa. Verifique se o número existe.');
  }
}

/**
 * Processa comando para listar conversas ativas
 */
async function processarComandoListarAtivos(message, client) {
  const conversasAtivas = await listarConversasAtivas();
  
  if (conversasAtivas.length === 0) {
    const mensagemVazia = `📋 *Conversas Ativas*\n\n` +
      `Nenhuma conversa ativa no momento.\n\n` +
      `💡 Use /ativar [numero] para ativar uma conversa.`;
    
    await client.sendMessage(message.from, mensagemVazia);
    return;
  }

  let mensagemLista = `📋 *Conversas Ativas* (${conversasAtivas.length})\n\n`;
  
  conversasAtivas.forEach((conversa, index) => {
    const nome = conversa.usuarios.nome || 'Sem nome';
    const numero = conversa.usuarios.numero_whatsapp;
    const adminIniciou = conversa.admin_iniciou ? '👤' : '🤖';
    const ultimaAtividade = new Date(conversa.ultima_atividade).toLocaleString('pt-BR');
    
    mensagemLista += `${index + 1}. ${adminIniciou} *${nome}*\n`;
    mensagemLista += `   📱 ${numero}\n`;
    mensagemLista += `   🕒 ${ultimaAtividade}\n\n`;
  });
  
  mensagemLista += `💡 Legenda:\n👤 = Admin iniciou\n🤖 = Auto-ativada`;
  
  await client.sendMessage(message.from, mensagemLista);
}

/**
 * Processa comando para alterar modo de resposta
 */
async function processarComandoModo(textoMensagem, message, client) {
  const novoModo = textoMensagem.substring(6).trim().toLowerCase();
  
  if (!['aberto', 'restrito'].includes(novoModo)) {
    const mensagemErro = `❌ Modo inválido!\n\n` +
      `✅ Modos válidos:\n` +
      `• *aberto* - Responde a qualquer pessoa\n` +
      `• *restrito* - Responde apenas usuários em conversa ativa\n\n` +
      `💡 Use: /modo [aberto|restrito]\n` +
      `Exemplo: /modo restrito`;
    
    await client.sendMessage(message.from, mensagemErro);
    return;
  }

  const sucesso = await atualizarModoResposta(novoModo);
  
  if (sucesso) {
    const mensagemSucesso = `✅ Modo alterado com sucesso!\n\n` +
      `🤖 Modo atual: *${novoModo}*\n\n` +
      `${novoModo === 'aberto' 
        ? '📢 O bot agora responde a qualquer pessoa que enviar mensagem.' 
        : '🔒 O bot agora responde apenas a usuários em conversas ativas.\n\n💡 Use /ativar [numero] para ativar conversas.'
      }`;
    
    await client.sendMessage(message.from, mensagemSucesso);
  } else {
    await client.sendMessage(message.from, '❌ Erro ao alterar modo. Tente novamente.');
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

async function processarComandoNome(textoMensagem, usuario, message, client) {
  const novoNome = textoMensagem.substring(6).trim();
  
  if (!novoNome || novoNome.length < 2) {
    const mensagemErro = `❌ Nome inválido!\n\n` +
      `💡 Use: /nome [seu nome]\n` +
      `Exemplo: /nome João Silva`;
    
    await client.sendMessage(message.from, mensagemErro);
    return;
  }

  if (novoNome.length > 50) {
    const mensagemErro = `❌ Nome muito longo! Use até 50 caracteres.\n\n` +
      `💡 Use: /nome [seu nome]\n` +
      `Exemplo: /nome João Silva`;
    
    await client.sendMessage(message.from, mensagemErro);
    return;
  }

  await atualizarNomeUsuario(usuario.id, novoNome);
  
  const mensagemSucesso = `✅ Nome atualizado com sucesso!\n\n` +
    `👤 Seu novo nome: *${novoNome}*\n\n` +
    `🤖 Agora vou te chamar por esse nome nas conversas. Teste enviando uma mensagem!`;
  
  await client.sendMessage(message.from, mensagemSucesso);
}
