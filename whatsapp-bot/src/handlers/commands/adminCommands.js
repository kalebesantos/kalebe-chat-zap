
import { atualizarConfiguracao, buscarConfiguracao } from '../../services/configService.js';
import { 
  ativarConversaPorNumero, 
  desativarConversaPorNumero, 
  listarConversasAtivas 
} from '../../services/activeConversationService.js';
import { 
  adicionarMensagemAdmin, 
  ativarPerfilEstilo, 
  desativarTodosPerfiles, 
  importarMensagensWhatsApp,
  listarPerfisEstilo 
} from '../../services/styleLearningService.js';
import { analisarEstiloAdmin } from '../../services/styleAnalyzer.js';
import { toggleAudioTranscription } from '../audioHandler.js';

export async function processarComandoAdmin(comando, numeroUsuario, client) {
  const chatId = numeroUsuario + '@c.us';
  const partes = comando.split(' ');
  const cmd = partes[0].toLowerCase();

  try {
    switch (cmd) {
      case '/modo':
        return await processarComandoModo(partes, client, chatId);
      
      case '/ativar':
        return await processarComandoAtivar(partes, client, chatId);
      
      case '/desativar':
        return await processarComandoDesativar(partes, client, chatId);
      
      case '/listar_ativos':
        return await processarComandoListarAtivos(client, chatId);
      
      case '/audio':
        return await processarComandoAudio(partes, client, chatId);
      
      case '/adicionar_msg':
        return await processarComandoAdicionarMsg(comando, numeroUsuario, client, chatId);
      
      case '/analisar_estilo':
        return await processarComandoAnalisarEstilo(partes, numeroUsuario, client, chatId);
      
      case '/ativar_estilo':
        return await processarComandoAtivarEstilo(numeroUsuario, client, chatId);
      
      case '/desativar_estilo':
        return await processarComandoDesativarEstilo(client, chatId);
      
      case '/listar_perfis':
        return await processarComandoListarPerfis(client, chatId);
      
      case '/importar_whatsapp':
        return await processarComandoImportarWhatsapp(client, chatId);
      
      case '/processar_export':
        return await processarComandoProcessarExport(comando, numeroUsuario, client, chatId);
      
      case '/status':
        return await processarComandoStatus(client, chatId);
      
      case '/ajuda':
        return await processarComandoAjuda(client, chatId);
      
      default:
        await client.sendMessage(chatId, '❌ Comando não reconhecido. Use /ajuda para ver os comandos disponíveis.');
        break;
    }
  } catch (error) {
    console.error('❌ Erro ao processar comando admin:', error);
    await client.sendMessage(chatId, '❌ Erro ao processar comando.');
  }
}

async function processarComandoModo(partes, client, chatId) {
  if (partes[1] && ['aberto', 'restrito'].includes(partes[1])) {
    const sucesso = await atualizarConfiguracao('modo_resposta', partes[1]);
    const resposta = sucesso 
      ? `✅ Modo alterado para: ${partes[1]}` 
      : '❌ Erro ao alterar modo';
    await client.sendMessage(chatId, resposta);
  } else {
    await client.sendMessage(chatId, '❌ Use: /modo aberto ou /modo restrito');
  }
}

async function processarComandoAtivar(partes, client, chatId) {
  if (partes[1]) {
    const numeroLimpo = partes[1].replace(/\D/g, '');
    if (numeroLimpo) {
      const sucesso = await ativarConversaPorNumero(numeroLimpo);
      const resposta = sucesso 
        ? `✅ Conversa ativada para ${numeroLimpo}` 
        : '❌ Erro ao ativar conversa';
      await client.sendMessage(chatId, resposta);
    } else {
      await client.sendMessage(chatId, '❌ Número inválido');
    }
  } else {
    await client.sendMessage(chatId, '❌ Use: /ativar [numero]');
  }
}

async function processarComandoDesativar(partes, client, chatId) {
  if (partes[1]) {
    const numeroLimpo = partes[1].replace(/\D/g, '');
    if (numeroLimpo) {
      const sucesso = await desativarConversaPorNumero(numeroLimpo);
      const resposta = sucesso 
        ? `✅ Conversa desativada para ${numeroLimpo}` 
        : '❌ Erro ao desativar conversa';
      await client.sendMessage(chatId, resposta);
    } else {
      await client.sendMessage(chatId, '❌ Número inválido');
    }
  } else {
    await client.sendMessage(chatId, '❌ Use: /desativar [numero]');
  }
}

async function processarComandoListarAtivos(client, chatId) {
  const conversasAtivas = await listarConversasAtivas();
  if (conversasAtivas.length > 0) {
    const lista = conversasAtivas.map(c => 
      `📱 ${c.usuarios.numero_whatsapp} ${c.usuarios.nome ? `(${c.usuarios.nome})` : ''}`
    ).join('\n');
    await client.sendMessage(chatId, `📋 Conversas ativas:\n${lista}`);
  } else {
    await client.sendMessage(chatId, '📋 Nenhuma conversa ativa no momento');
  }
}

async function processarComandoAudio(partes, client, chatId) {
  if (partes[1] && ['on', 'off'].includes(partes[1])) {
    const ativar = partes[1] === 'on';
    const sucesso = await toggleAudioTranscription(ativar);
    const resposta = sucesso 
      ? `🎤 Transcrição de áudio ${ativar ? 'ativada' : 'desativada'}` 
      : '❌ Erro ao alterar configuração de áudio';
    await client.sendMessage(chatId, resposta);
  } else {
    const audioAtivo = await buscarConfiguracao('transcricao_audio_ativa') === 'true';
    await client.sendMessage(chatId, 
      `🎤 Status: Transcrição de áudio ${audioAtivo ? 'ativada' : 'desativada'}\n\nUse:\n• \`/audio on\` - Ativar\n• \`/audio off\` - Desativar`);
  }
}

async function processarComandoAdicionarMsg(comando, numeroUsuario, client, chatId) {
  const mensagemAdmin = comando.replace('/adicionar_msg', '').trim();
  if (mensagemAdmin) {
    const sucesso = await adicionarMensagemAdmin(numeroUsuario, mensagemAdmin);
    const resposta = sucesso 
      ? '✅ Mensagem adicionada para aprendizado' 
      : '❌ Erro ao adicionar mensagem';
    await client.sendMessage(chatId, resposta);
  } else {
    await client.sendMessage(chatId, '❌ Use: /adicionar_msg [sua mensagem]');
  }
}

async function processarComandoAnalisarEstilo(partes, numeroUsuario, client, chatId) {
  const nomeAdmin = partes.slice(1).join(' ') || 'Administrador';
  await client.sendMessage(chatId, '🧠 Analisando seu estilo de comunicação...');
  
  const analise = await analisarEstiloAdmin(numeroUsuario, nomeAdmin);
  if (analise) {
    const resumo = `✅ Análise concluída!

📊 **Perfil de ${nomeAdmin}:**
• Tom: ${analise.tom_comunicacao}
• Estilo: ${analise.estilo_resumo}
• Emojis: ${analise.emojis_frequentes?.join(' ') || 'Variados'}

Use /ativar_estilo para começar a usar este perfil.`;
    await client.sendMessage(chatId, resumo);
  } else {
    await client.sendMessage(chatId, '❌ Erro na análise. Adicione mais mensagens primeiro.');
  }
}

async function processarComandoAtivarEstilo(numeroUsuario, client, chatId) {
  const sucessoAtivacao = await ativarPerfilEstilo(numeroUsuario);
  if (sucessoAtivacao) {
    await atualizarConfiguracao('aprendizado_estilo_ativo', 'true');
    await client.sendMessage(chatId, '✅ Seu estilo de comunicação foi ativado! O bot agora responderá imitando seu jeito de falar.');
  } else {
    await client.sendMessage(chatId, '❌ Erro ao ativar estilo. Analise seu estilo primeiro com /analisar_estilo');
  }
}

async function processarComandoDesativarEstilo(client, chatId) {
  await desativarTodosPerfiles();
  await atualizarConfiguracao('aprendizado_estilo_ativo', 'false');
  await client.sendMessage(chatId, '✅ Aprendizado de estilo desativado. Bot voltou ao modo normal.');
}

async function processarComandoListarPerfis(client, chatId) {
  const perfis = await listarPerfisEstilo();
  if (perfis.length > 0) {
    const listaPerfis = perfis.map(p => 
      `${p.ativo ? '✅' : '⭕'} ${p.nome_admin || p.admin_id} (${p.total_mensagens} msgs)`
    ).join('\n');
    await client.sendMessage(chatId, `📋 Perfis disponíveis:\n${listaPerfis}`);
  } else {
    await client.sendMessage(chatId, '📋 Nenhum perfil de estilo criado ainda');
  }
}

async function processarComandoImportarWhatsapp(client, chatId) {
  await client.sendMessage(chatId, 
    `📥 Para importar mensagens do WhatsApp:
1. Exporte sua conversa (sem mídia)
2. Copie o texto do arquivo
3. Use: /processar_export [texto copiado]`);
}

async function processarComandoProcessarExport(comando, numeroUsuario, client, chatId) {
  const textoExport = comando.replace('/processar_export', '').trim();
  if (textoExport) {
    await client.sendMessage(chatId, '📥 Processando export do WhatsApp...');
    const qtdImportadas = await importarMensagensWhatsApp(numeroUsuario, textoExport);
    await client.sendMessage(chatId, 
      `✅ ${qtdImportadas} mensagens importadas! Use /analisar_estilo para gerar seu perfil.`);
  } else {
    await client.sendMessage(chatId, '❌ Cole o texto do export após o comando');
  }
}

async function processarComandoStatus(client, chatId) {
  const modo = await buscarModoResposta();
  const aprendizadoAtivo = await buscarConfiguracao('aprendizado_estilo_ativo') === 'true';
  const audioAtivo = await buscarConfiguracao('transcricao_audio_ativa') === 'true';
  const conversasCount = (await listarConversasAtivas()).length;
  const perfisCount = (await listarPerfisEstilo()).length;
  
  const status = `📊 **Status do Bot:**
• Modo: ${modo}
• Conversas ativas: ${conversasCount}
• Aprendizado de estilo: ${aprendizadoAtivo ? 'Ativo' : 'Inativo'}
• Transcrição de áudio: ${audioAtivo ? 'Ativa' : 'Inativa'}
• Perfis de estilo: ${perfisCount}`;
  
  await client.sendMessage(chatId, status);
}

async function processarComandoAjuda(client, chatId) {
  const ajuda = `🤖 **Comandos Disponíveis:**

**Modo de Operação:**
• \`/modo aberto\` - Responde a todos
• \`/modo restrito\` - Só responde a conversas ativas
• \`/status\` - Ver status do bot

**Conversas Ativas:**
• \`/ativar [numero]\` - Ativar conversa
• \`/desativar [numero]\` - Desativar conversa  
• \`/listar_ativos\` - Ver conversas ativas

**Transcrição de Áudio:**
• \`/audio on\` - Ativar transcrição de áudios
• \`/audio off\` - Desativar transcrição de áudios
• \`/audio\` - Ver status atual

**Aprendizado de Estilo:**
• \`/adicionar_msg [mensagem]\` - Adicionar mensagem sua
• \`/analisar_estilo [nome]\` - Analisar seu estilo
• \`/ativar_estilo\` - Ativar imitação do seu estilo
• \`/desativar_estilo\` - Voltar ao modo normal
• \`/listar_perfis\` - Ver perfis disponíveis
• \`/importar_whatsapp\` - Instruções para importar
• \`/processar_export [texto]\` - Processar export

• \`/ajuda\` - Ver esta mensagem`;
  
  await client.sendMessage(chatId, ajuda);
}
