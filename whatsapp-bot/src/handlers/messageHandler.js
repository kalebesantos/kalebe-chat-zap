
import { processarComandoAdmin } from './commands/adminCommands.js';
import { processarMensagemTexto } from './messageProcessor.js';
import { processarMensagemAudio } from './audioHandler.js';

/**
 * Processa mensagens recebidas no WhatsApp
 */
export async function processarMensagem(message, client) {
  try {
    // Ignora mensagens de status e grupos
    if (message.from.includes('@g.us') || message.from.includes('status')) {
      return;
    }

    const numeroUsuario = message.from.replace('@c.us', '');
    const textoMensagem = message.body?.trim() || '';

    // Verifica se é comando administrativo
    if (textoMensagem.startsWith('/')) {
      await processarComandoAdmin(textoMensagem, numeroUsuario, client);
      return;
    }

    // Verifica se é mensagem de áudio
    if (message.hasMedia && (message.type === 'audio' || message.type === 'ptt')) {
      await processarMensagemAudio(message, client);
      return;
    }

    // Processa mensagem de texto normal
    await processarMensagemTexto(message, client);

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
