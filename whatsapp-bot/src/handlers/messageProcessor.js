import { criarOuAtualizarUsuario, buscarUsuario } from '../services/userService.js';
import { salvarMensagem, buscarHistoricoMensagens } from '../services/messageService.js';
import { gerarResposta } from '../services/openaiService.js';
import { buscarModoResposta } from '../services/configService.js';
import { usuarioEstaAtivo } from '../services/activeConversationService.js';
import { buscarPerfilEstiloAtivo } from '../services/styleLearningService.js';

export async function processarMensagemTexto(message, client) {
  try {
    const numeroUsuario = message.from.replace('@c.us', '');
    const textoMensagem = message.body?.trim() || '';
    
    console.log(`📨 Mensagem de ${numeroUsuario}: ${textoMensagem}`);

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
        return;
      }
    }

    // Buscar histórico e gerar resposta
    const respostaIA = await gerarRespostaComContexto(usuario.id, textoMensagem);

    // Envia a resposta
    if (respostaIA) {
      await client.sendMessage(message.from, respostaIA);
      await salvarMensagem(usuario.id, textoMensagem, respostaIA);
      console.log(`✅ Resposta enviada para ${numeroUsuario}`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    
    try {
      await client.sendMessage(message.from, 
        'Opa, deu algum problema aqui. Tenta mandar de novo?');
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

async function gerarRespostaComContexto(usuarioId, textoMensagem) {
  // Buscar histórico de mensagens
  const historicoBanco = await buscarHistoricoMensagens(usuarioId, 6); // Reduzido para contexto mais focado
  const historico = [];

  // Construir histórico no formato correto (apenas as últimas interações)
  for (let i = historicoBanco.length - 1; i >= 0; i--) {
    const msg = historicoBanco[i];
    if (msg.mensagem_recebida) {
      historico.push({ role: 'user', content: msg.mensagem_recebida });
    }
    if (msg.mensagem_enviada) {
      historico.push({ role: 'assistant', content: msg.mensagem_enviada });
    }
  }
  
  // Adiciona a mensagem atual
  historico.push({ role: 'user', content: textoMensagem });

  // Buscar estilo do administrador ativo
  let estiloPersonalizado = '';
  let exemplosMensagens = [];
  const perfilAdminAtivo = await buscarPerfilEstiloAtivo();

  if (perfilAdminAtivo) {
    estiloPersonalizado = perfilAdminAtivo.estilo_resumo || '';
    exemplosMensagens = perfilAdminAtivo.exemplos_mensagens || [];
    
    console.log('🧑‍💼 Usando perfil do admin ativo para resposta mais humana');
    console.log(`📝 Estilo: ${estiloPersonalizado}`);
    console.log(`📚 Exemplos disponíveis: ${exemplosMensagens.length}`);
  } else {
    console.log('⚠️ Nenhum perfil de admin ativo - usando modo padrão');
  }

  return await gerarResposta({
    historico,
    estiloPersonalizado,
    exemplosMensagens,
    modelo: undefined
  });
}