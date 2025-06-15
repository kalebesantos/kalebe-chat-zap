import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { processarMensagem } from './handlers/messageHandler.js';
import { supabase } from './config/database.js';

// Polyfill para FormData (necessário para transcrição de áudio)
import { FormData } from 'formdata-polyfill/esm.min.js';
globalThis.FormData = FormData;

// Carrega variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando Bot WhatsApp com suporte a transcrição de áudio...');

// Verificar se a chave da OpenAI está configurada
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY não configurada. Transcrição de áudio não funcionará.');
}

// Cria o cliente WhatsApp com autenticação local
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp-bot-supabase"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

// Novo: função para status granular
async function setBotStatus(status, errorMessage = null, qrCode = null) {
  // Call Postgres function for upsert
  try {
    await supabase.rpc('upsert_bot_status', {
      p_status: status,
      p_error_message: errorMessage,
      p_qr_code: qrCode
    });
  } catch (e) {
    console.error('[BotStatus] Falha ao atualizar status:', e);
  }
}

// Função auxiliar para garantir status offline mesmo em encerramentos abruptos
async function setBotOffline() {
  try {
    await setBotStatus('offline', 'Encerramento solicitado ou abrupto');
    await supabase
      .from('bot_config')
      .upsert([
        { chave: 'bot_online', valor: 'false', descricao: 'Status online do bot', updated_at: new Date().toISOString() }
      ], { onConflict: ['chave'] });
    console.log('ℹ️ Status do bot atualizado para OFFLINE');
  } catch (err) {
    console.error('❌ Erro ao atualizar status do bot para OFFLINE:', err);
  }
}

// Registrar heartbeat a cada 30s
let heartbeatInterval = null;
function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => setBotStatus('online'), 30000);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}

// Evento: Inicialização do bot
setBotStatus('starting');

// Evento: QR code para autenticação
client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR Code abaixo com o WhatsApp:');
  qrcode.generate(qr, { small: true });
  setBotStatus('qr_pending', null, qr);
  console.log('\n⚡ Aguardando autenticação...');
});

// Evento: Cliente pronto
client.on('ready', async () => {
  setBotStatus('online');
  startHeartbeat();
  console.log('✅ Bot WhatsApp conectado e pronto!');
  console.log('🎤 Suporte a transcrição de áudio ativo!');
  console.log('🤖 Aguardando mensagens...\n');
  
  // Atualiza o status do bot na tabela bot_config para online
  try {
    const { error } = await supabase
      .from('bot_config')
      .upsert([
        { chave: 'bot_online', valor: 'true', descricao: 'Status online do bot', updated_at: new Date().toISOString() }
      ], { onConflict: ['chave'] });
    if (error) {
      console.error('❌ Falha ao marcar o bot como online no banco:', error);
    } else {
      console.log('✅ Status do bot atualizado para ONLINE na tabela bot_config');
    }
  } catch (err) {
    console.error('❌ Erro ao atualizar status do bot (online):', err);
  }
});

// Evento: Autenticação bem-sucedida
client.on('authenticated', () => {
  setBotStatus('authenticated');
});

// Evento: Falha na autenticação
client.on('auth_failure', (msg) => {
  setBotStatus('error', `auth_failure: ${msg}`);
  stopHeartbeat();
});

// Evento: Cliente desconectado
client.on('disconnected', async (reason) => {
  setBotStatus('offline', `disconnected: ${reason}`);
  stopHeartbeat();
  console.log('⚠️ Cliente desconectado:', reason);
  console.log('🔄 Tentando reconectar...');
  // Atualiza status do bot para offline
  try {
    const { error } = await supabase
      .from('bot_config')
      .upsert([
        { chave: 'bot_online', valor: 'false', descricao: 'Status online do bot', updated_at: new Date().toISOString() }
      ], { onConflict: ['chave'] });
    if (error) {
      console.error('❌ Falha ao marcar o bot como offline no banco:', error);
    } else {
      console.log('ℹ️ Status do bot atualizado para OFFLINE na tabela bot_config');
    }
  } catch (err) {
    console.error('❌ Erro ao atualizar status do bot (offline):', err);
  }
});

// Evento: Nova mensagem recebida
client.on('message', async (message) => {
  await processarMensagem(message, client);
});

// Evento: Erro
client.on('error', (error) => {
  setBotStatus('error', error?.message || error?.toString());
});

// Inicializa o cliente
client.initialize();

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido sinal de interrupção, encerrando bot...');
  await setBotOffline();
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido sinal de término, encerrando bot...');
  await setBotOffline();
  await client.destroy();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erro não tratado:', reason);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Exceção não capturada:', error);
  await setBotOffline();
  process.exit(1);
});
