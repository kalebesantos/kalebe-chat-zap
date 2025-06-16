import { supabase } from '../config/database.js';
import { buscarUsuario, criarOuAtualizarUsuario } from '../services/userService.js';
import { gerarResposta } from '../services/openaiService.js';
import { salvarMensagem, buscarHistoricoMensagens } from '../services/messageService.js';
import { buscarConfiguracao } from '../services/configService.js';
import { buscarPerfilEstiloAtivo } from '../services/styleLearningService.js';
import { transcriverAudio } from './audio/transcriptionService.js';
import { salvarArquivoAudio, removerArquivoTemporario } from './audio/audioStorage.js';

/**
 * Verifica se a transcrição de áudio está ativa
 */
async function isAudioTranscriptionActive() {
  const config = await buscarConfiguracao('transcricao_audio_ativa');
  return config === 'true';
}

/**
 * Salva transcrição no banco de dados
 */
async function salvarTranscricao(usuarioId, dadosTranscricao) {
  try {
    const { error } = await supabase
      .from('audio_transcriptions')
      .insert({
        usuario_id: usuarioId,
        arquivo_original: dadosTranscricao.arquivo_original,
        duracao_segundos: dadosTranscricao.duracao_segundos,
        tamanho_bytes: dadosTranscricao.tamanho_bytes,
        texto_transcrito: dadosTranscricao.texto_transcrito,
        confianca_transcricao: dadosTranscricao.confianca_transcricao,
        tempo_processamento_ms: dadosTranscricao.tempo_processamento_ms,
        status: dadosTranscricao.status,
        erro_detalhes: dadosTranscricao.erro_detalhes
      });

    if (error) {
      console.error('❌ Erro ao salvar transcrição:', error);
      return false;
    }

    console.log('✅ Transcrição salva no banco');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar transcrição:', error);
    return false;
  }
}

/**
 * Processa mensagem de áudio
 */
export async function processarMensagemAudio(message, client) {
  try {
    // Verifica se a transcrição está ativa
    const transcricaoAtiva = await isAudioTranscriptionActive();
    if (!transcricaoAtiva) {
      console.log('📵 Transcrição de áudio desativada');
      return;
    }

    console.log('🎤 Processando mensagem de áudio...');

    const numeroUsuario = message.from.replace('@c.us', '');
    
    // Busca ou cria o usuário
    let usuario = await buscarUsuario(numeroUsuario);
    if (!usuario) {
      usuario = await criarOuAtualizarUsuario(numeroUsuario);
      if (!usuario) {
        console.error('❌ Falha ao criar usuário');
        return;
      }
    }

    // Verifica se é uma mensagem de áudio/voz
    if (!message.hasMedia || (message.type !== 'audio' && message.type !== 'ptt')) {
      return;
    }

    // Verifica duração mínima
    const duracao = message.duration || 0;
    if (duracao < 1) {
      console.log('⚠️ Áudio muito curto, ignorando transcrição');
      return;
    }

    console.log(`📱 Baixando áudio (duração: ${duracao}s)...`);

    // Baixa o arquivo de áudio
    const media = await message.downloadMedia();
    if (!media) {
      console.error('❌ Falha ao baixar mídia de áudio');
      return;
    }

    // Salva arquivo temporário
    const { caminhoArquivo, nomeArquivo, tamanhoBytes } = salvarArquivoAudio(media, numeroUsuario);

    // Faz a transcrição
    const resultadoTranscricao = await transcriverAudio(caminhoArquivo);
    
    // Dados para salvar no banco
    const dadosTranscricao = {
      arquivo_original: nomeArquivo,
      duracao_segundos: duracao,
      tamanho_bytes: tamanhoBytes,
      texto_transcrito: resultadoTranscricao.texto,
      tempo_processamento_ms: resultadoTranscricao.tempo_processamento_ms,
      status: resultadoTranscricao.sucesso ? 'sucesso' : 'erro',
      erro_detalhes: resultadoTranscricao.erro || null
    };

    // Salva no banco
    await salvarTranscricao(usuario.id, dadosTranscricao);

    // Remove arquivo temporário
    removerArquivoTemporario(caminhoArquivo);

    if (resultadoTranscricao.sucesso && resultadoTranscricao.texto.trim()) {
      console.log(`✅ Transcrição: "${resultadoTranscricao.texto}"`);
      
      // Gera resposta usando o estilo do admin
      const respostaIA = await gerarRespostaParaAudio(usuario.id, resultadoTranscricao.texto);

      if (respostaIA) {
        await client.sendMessage(message.from, respostaIA); // Removido emoji de microfone para parecer mais natural
        await salvarMensagem(usuario.id, resultadoTranscricao.texto, respostaIA);
        console.log(`✅ Resposta enviada para áudio de ${numeroUsuario}`);
      }
    } else {
      console.error('❌ Falha na transcrição ou texto vazio');
      await client.sendMessage(message.from, 
        'Não consegui entender o áudio. Pode mandar por texto?');
    }

  } catch (error) {
    console.error('❌ Erro ao processar áudio:', error);
    
    try {
      await client.sendMessage(message.from, 
        'Deu problema com o áudio. Manda por texto que é mais fácil.');
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

async function gerarRespostaParaAudio(usuarioId, textoTranscrito) {
  // Buscar histórico de mensagens para contexto
  const historicoBanco = await buscarHistoricoMensagens(usuarioId, 6);
  const historico = [];

  for (let i = historicoBanco.length - 1; i >= 0; i--) {
    const msg = historicoBanco[i];
    if (msg.mensagem_recebida) {
      historico.push({ role: 'user', content: msg.mensagem_recebida });
    }
    if (msg.mensagem_enviada) {
      historico.push({ role: 'assistant', content: msg.mensagem_enviada });
    }
  }
  
  // Adiciona a mensagem transcrita atual
  historico.push({ role: 'user', content: textoTranscrito });

  // Buscar perfil de estilo do admin ativo
  let estiloPersonalizado = '';
  let exemplosMensagens = [];
  const perfilAdminAtivo = await buscarPerfilEstiloAtivo();

  if (perfilAdminAtivo) {
    estiloPersonalizado = perfilAdminAtivo.estilo_resumo || '';
    exemplosMensagens = perfilAdminAtivo.exemplos_mensagens || [];
    console.log('🧑‍💼 Usando estilo do admin ativo para resposta de áudio');
  }

  return await gerarResposta({
    historico,
    estiloPersonalizado,
    exemplosMensagens,
    modelo: undefined
  });
}

/**
 * Ativa ou desativa transcrição de áudio
 */
export async function toggleAudioTranscription(ativar) {
  try {
    const { error } = await supabase
      .from('bot_config')
      .upsert(
        { 
          chave: 'transcricao_audio_ativa',
          valor: ativar ? 'true' : 'false',
          descricao: 'Habilita ou desabilita a transcrição automática de áudios (true/false)',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'chave' }
      );

    if (error) {
      console.error('❌ Erro ao atualizar configuração de áudio:', error);
      return false;
    }

    console.log(`✅ Transcrição de áudio ${ativar ? 'ativada' : 'desativada'}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao togglear transcrição:', error);
    return false;
  }
}