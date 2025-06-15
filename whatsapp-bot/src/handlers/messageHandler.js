import { criarOuAtualizarUsuario, buscarUsuario } from '../services/userService.js';
import { salvarMensagem } from '../services/messageService.js';
import { gerarResposta } from '../services/openaiService.js';
import { buscarModoResposta, atualizarConfiguracao, buscarConfiguracao } from '../services/configService.js';
import { usuarioEstaAtivo, ativarConversaPorNumero, desativarConversaPorNumero, listarConversasAtivas } from '../services/activeConversationService.js';
import { 
  adicionarMensagemAdmin, 
  analisarEstiloAdmin, 
  ativarPerfilEstilo, 
  desativarTodosPerfiles, 
  importarMensagensWhatsApp,
  listarPerfisEstilo 
} from '../services/styleLearningService.js';

/**
 * Processa mensagens recebidas no WhatsApp
 * @param {Object} message - Objeto da mensagem do whatsapp-web.js
 * @param {Object} client - Cliente do WhatsApp
 */
export async function processarMensagem(message, client) {
  try {
    // Ignora mensagens de status e grupos por enquanto
    if (message.from.includes('@g.us') || message.from.includes('status')) {
      return;
    }

    const numeroUsuario = message.from.replace('@c.us', '');
    const textoMensagem = message.body?.trim() || '';
    
    console.log(`📨 Mensagem de ${numeroUsuario}: ${textoMensagem}`);

    // Verifica se é um comando administrativo
    if (textoMensagem.startsWith('/')) {
      await processarComandoAdmin(textoMensagem, numeroUsuario, client);
      return;
    }

    // Busca ou cria o usuário
    let usuario = await buscarUsuario(numeroUsuario);
    if (!usuario) {
      usuario = await criarOuAtualizarUsuario(numeroUsuario);
      if (!usuario) {
        console.error('❌ Falha ao criar usuário');
        return;
      }
    }

    // Verifica modo de resposta
    const modoResposta = await buscarModoResposta();
    
    if (modoResposta === 'restrito') {
      const conversaAtiva = await usuarioEstaAtivo(usuario.id);
      if (!conversaAtiva) {
        console.log(`⚠️ Conversa não ativa para ${numeroUsuario} no modo restrito`);
        return; // Não responde se não há conversa ativa
      }
    }

    // Gera resposta usando IA
    const respostaIA = await gerarResposta(
      textoMensagem,
      usuario.estilo_fala || 'neutro',
      usuario.id,
      usuario.nome
    );

    // Envia a resposta
    if (respostaIA) {
      await client.sendMessage(message.from, respostaIA);
      
      // Salva a conversa no banco
      await salvarMensagem(usuario.id, textoMensagem, respostaIA);
      
      console.log(`✅ Resposta enviada para ${numeroUsuario}`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    
    try {
      await client.sendMessage(message.from, 
        'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.');
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

/**
 * Processa comandos administrativos
 * @param {string} comando - Comando recebido
 * @param {string} numeroUsuario - Número do usuário que enviou
 * @param {Object} client - Cliente do WhatsApp
 */
async function processarComandoAdmin(comando, numeroUsuario, client) {
  const chatId = numeroUsuario + '@c.us';
  const partes = comando.split(' ');
  const cmd = partes[0].toLowerCase();

  try {
    switch (cmd) {
      case '/modo':
        if (partes[1] && ['aberto', 'restrito'].includes(partes[1])) {
          const sucesso = await atualizarConfiguracao('modo_resposta', partes[1]);
          const resposta = sucesso 
            ? `✅ Modo alterado para: ${partes[1]}` 
            : '❌ Erro ao alterar modo';
          await client.sendMessage(chatId, resposta);
        } else {
          await client.sendMessage(chatId, '❌ Use: /modo aberto ou /modo restrito');
        }
        break;

      case '/ativar':
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
        break;

      case '/desativar':
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
        break;

      case '/listar_ativos':
        const conversasAtivas = await listarConversasAtivas();
        if (conversasAtivas.length > 0) {
          const lista = conversasAtivas.map(c => 
            `📱 ${c.usuarios.numero_whatsapp} ${c.usuarios.nome ? `(${c.usuarios.nome})` : ''}`
          ).join('\n');
          await client.sendMessage(chatId, `📋 Conversas ativas:\n${lista}`);
        } else {
          await client.sendMessage(chatId, '📋 Nenhuma conversa ativa no momento');
        }
        break;

      // Novos comandos para aprendizado de estilo
      case '/adicionar_msg':
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
        break;

      case '/analisar_estilo':
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
        break;

      case '/ativar_estilo':
        const sucessoAtivacao = await ativarPerfilEstilo(numeroUsuario);
        if (sucessoAtivacao) {
          await atualizarConfiguracao('aprendizado_estilo_ativo', 'true');
          await client.sendMessage(chatId, '✅ Seu estilo de comunicação foi ativado! O bot agora responderá imitando seu jeito de falar.');
        } else {
          await client.sendMessage(chatId, '❌ Erro ao ativar estilo. Analise seu estilo primeiro com /analisar_estilo');
        }
        break;

      case '/desativar_estilo':
        await desativarTodosPerfiles();
        await atualizarConfiguracao('aprendizado_estilo_ativo', 'false');
        await client.sendMessage(chatId, '✅ Aprendizado de estilo desativado. Bot voltou ao modo normal.');
        break;

      case '/listar_perfis':
        const perfis = await listarPerfisEstilo();
        if (perfis.length > 0) {
          const listaPerfis = perfis.map(p => 
            `${p.ativo ? '✅' : '⭕'} ${p.nome_admin || p.admin_id} (${p.total_mensagens} msgs)`
          ).join('\n');
          await client.sendMessage(chatId, `📋 Perfis disponíveis:\n${listaPerfis}`);
        } else {
          await client.sendMessage(chatId, '📋 Nenhum perfil de estilo criado ainda');
        }
        break;

      case '/importar_whatsapp':
        await client.sendMessage(chatId, 
          `📥 Para importar mensagens do WhatsApp:
1. Exporte sua conversa (sem mídia)
2. Copie o texto do arquivo
3. Use: /processar_export [texto copiado]`);
        break;

      case '/processar_export':
        const textoExport = comando.replace('/processar_export', '').trim();
        if (textoExport) {
          await client.sendMessage(chatId, '📥 Processando export do WhatsApp...');
          const qtdImportadas = await importarMensagensWhatsApp(numeroUsuario, textoExport);
          await client.sendMessage(chatId, 
            `✅ ${qtdImportadas} mensagens importadas! Use /analisar_estilo para gerar seu perfil.`);
        } else {
          await client.sendMessage(chatId, '❌ Cole o texto do export após o comando');
        }
        break;

      case '/status':
        const modo = await buscarModoResposta();
        const aprendizadoAtivo = await buscarConfiguracao('aprendizado_estilo_ativo') === 'true';
        const conversasCount = (await listarConversasAtivas()).length;
        const perfisCount = (await listarPerfisEstilo()).length;
        
        const status = `📊 **Status do Bot:**
• Modo: ${modo}
• Conversas ativas: ${conversasCount}
• Aprendizado de estilo: ${aprendizadoAtivo ? 'Ativo' : 'Inativo'}
• Perfis de estilo: ${perfisCount}`;
        
        await client.sendMessage(chatId, status);
        break;

      case '/ajuda':
        const ajuda = `🤖 **Comandos Disponíveis:**

**Modo de Operação:**
• \`/modo aberto\` - Responde a todos
• \`/modo restrito\` - Só responde a conversas ativas
• \`/status\` - Ver status do bot

**Conversas Ativas:**
• \`/ativar [numero]\` - Ativar conversa
• \`/desativar [numero]\` - Desativar conversa  
• \`/listar_ativos\` - Ver conversas ativas

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
        break;

      default:
        await client.sendMessage(chatId, '❌ Comando não reconhecido. Use /ajuda para ver os comandos disponíveis.');
        break;
    }
  } catch (error) {
    console.error('❌ Erro ao processar comando admin:', error);
    await client.sendMessage(chatId, '❌ Erro ao processar comando.');
  }
}
