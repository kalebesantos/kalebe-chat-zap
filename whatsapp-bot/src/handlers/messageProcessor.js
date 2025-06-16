
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
        'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.');
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

async function gerarRespostaComContexto(usuarioId, textoMensagem) {
  // Buscar histórico de mensagens
  const historicoBanco = await buscarHistoricoMensagens(usuarioId, 8);
  const historico = [];

  // Construir histórico no formato correto
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
  const perfilAdminAtivo = await buscarPerfilEstiloAtivo();

  if (perfilAdminAtivo && perfilAdminAtivo.estilo_resumo) {
    estiloPersonalizado = perfilAdminAtivo.estilo_resumo;
    console.log('🧑‍💼 Usando estilo do admin ativo:', estiloPersonalizado);
  }

  return await gerarResposta({
    historico,
    estiloPersonalizado,
    modelo: undefined
  });
}
