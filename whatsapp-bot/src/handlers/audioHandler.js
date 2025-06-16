
import { supabase } from '../config/database.js';
import { buscarUsuario, criarOuAtualizarUsuario } from '../services/userService.js';
import { gerarResposta } from '../services/openaiService.js';
import { salvarMensagem } from '../services/messageService.js';
import { buscarConfiguracao } from '../services/configService.js';
import { buscarPerfilEstiloAtivo } from '../services/styleLearningService.js';
import { buscarHistoricoMensagens } from '../services/messageService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório temporário para arquivos de áudio
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp_audio');

// Garantir que o diretório existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

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
 * Faz a transcrição usando OpenAI Whisper
 */
async function transcriverAudio(caminhoArquivo) {
  const startTime = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const formData = new FormData();
    const audioBuffer = fs.readFileSync(caminhoArquivo);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });
    
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Português

    console.log(`🎤 Enviando áudio para transcrição (${audioBuffer.length} bytes)...`);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro da API OpenAI: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const resultado = await response.json();
    const tempoProcessamento = Date.now() - startTime;

    console.log(`✅ Transcrição concluída em ${tempoProcessamento}ms`);

    return {
      texto: resultado.text || '',
      tempo_processamento_ms: tempoProcessamento,
      sucesso: true
    };

  } catch (error) {
    const tempoProcessamento = Date.now() - startTime;
    console.error('❌ Erro na transcrição:', error);
    
    return {
      texto: '',
      tempo_processamento_ms: tempoProcessamento,
      sucesso: false,
      erro: error.message
    };
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
      return; // Não é áudio
    }

    // Verifica duração mínima (evita áudios muito curtos)
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
    const nomeArquivo = `audio_${Date.now()}_${numeroUsuario}.ogg`;
    const caminhoArquivo = path.join(TEMP_DIR, nomeArquivo);
    
    const buffer = Buffer.from(media.data, 'base64');
    fs.writeFileSync(caminhoArquivo, buffer);

    console.log(`📁 Arquivo salvo: ${caminhoArquivo} (${buffer.length} bytes)`);

    // Faz a transcrição
    const resultadoTranscricao = await transcriverAudio(caminhoArquivo);
    
    // Dados para salvar no banco
    const dadosTranscricao = {
      arquivo_original: nomeArquivo,
      duracao_segundos: duracao,
      tamanho_bytes: buffer.length,
      texto_transcrito: resultadoTranscricao.texto,
      tempo_processamento_ms: resultadoTranscricao.tempo_processamento_ms,
      status: resultadoTranscricao.sucesso ? 'sucesso' : 'erro',
      erro_detalhes: resultadoTranscricao.erro || null
    };

    // Salva no banco
    await salvarTranscricao(usuario.id, dadosTranscricao);

    // Remove arquivo temporário
    try {
      fs.unlinkSync(caminhoArquivo);
      console.log('🗑️ Arquivo temporário removido');
    } catch (error) {
      console.warn('⚠️ Erro ao remover arquivo temporário:', error.message);
    }

    if (resultadoTranscricao.sucesso && resultadoTranscricao.texto.trim()) {
      console.log(`✅ Transcrição: "${resultadoTranscricao.texto}"`);
      
      // Buscar histórico de mensagens para contexto
      const historicoBanco = await buscarHistoricoMensagens(usuario.id, 8);
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
      
      // Adiciona a mensagem transcrita atual
      historico.push({ role: 'user', content: resultadoTranscricao.texto });

      // Buscar perfil de estilo do admin ativo
      let estiloPersonalizado = '';
      const perfilAdminAtivo = await buscarPerfilEstiloAtivo();

      if (perfilAdminAtivo && perfilAdminAtivo.estilo_resumo) {
        estiloPersonalizado = perfilAdminAtivo.estilo_resumo;
        console.log('🧑‍💼 Usando estilo do admin ativo para áudio:', estiloPersonalizado);
      } else if (!perfilAdminAtivo && usuario.estilo_fala) {
        estiloPersonalizado = usuario.estilo_fala || '';
        console.log('👤 Usando estilo do usuário (legacy) para áudio:', estiloPersonalizado);
      }

      // Gera resposta usando IA com contexto completo
      const respostaIA = await gerarResposta({
        historico,
        estiloPersonalizado,
        modelo: undefined
      });

      if (respostaIA) {
        // Envia resposta precedida de emoji de áudio
        await client.sendMessage(message.from, `🎤 ${respostaIA}`);
        
        // Salva a conversa no banco
        await salvarMensagem(usuario.id, resultadoTranscricao.texto, respostaIA);
        
        console.log(`✅ Resposta enviada para áudio de ${numeroUsuario}`);
      }
    } else {
      console.error('❌ Falha na transcrição ou texto vazio');
      // Envia mensagem de erro amigável
      await client.sendMessage(message.from, 
        '🎤 Desculpe, não consegui entender o áudio. Tente falar mais claramente ou enviar como texto.');
    }

  } catch (error) {
    console.error('❌ Erro ao processar áudio:', error);
    
    // Envia mensagem de erro para o usuário
    try {
      await client.sendMessage(message.from, 
        '🎤 Ocorreu um erro ao processar seu áudio. Tente novamente em alguns instantes.');
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
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
