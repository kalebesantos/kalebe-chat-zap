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

import { importarMensagensWhatsApp } from './services/styleLearningService.js'; // Importa função

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

// NOVO: função para aprendizado automático do administrador
async function aprenderComConversasDoAdmin(adminNumero) {
  try {
    console.log(`🤖 Aprendizado: Importando conversas do administrador (${adminNumero})...`);
    // Importa todas conversas do administrador
    // A função importarMensagensWhatsApp deve ler/exportar e analisar estilo automaticamente
    const textoExport = await coletarConversasDoWhatsApp(adminNumero);
    if (textoExport) {
      const total = await importarMensagensWhatsApp(adminNumero, textoExport);
      if (total > 0) {
        console.log(`✅ ${total} mensagens importadas e perfil do administrador treinado!`);
      } else {
        console.log('⚠️ Nenhuma mensagem foi importada para aprendizado.');
      }
    } else {
      console.log('⚠️ Não foi possível coletar as conversas do WhatsApp.');
    }
  } catch (error) {
    console.error('❌ Erro ao aprender com as conversas do admin:', error);
  }
}

// Dummy de coleta, deve ser implementado de acordo com as APIs permitidas / export do WhatsApp Web
async function coletarConversasDoWhatsApp(adminNumero) {
  // No WhatsApp Web, não existe API oficial para exportar todas as conversas automaticamente.
  // Aqui você pode conectar a uma lógica customizada, scraping, ou ler de um arquivo de export.
  // Agora retorna null, apenas exemplo.
  return null;
}

// Adiciona manipulação da tecla "q" para encerrar
function listenForQuit() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (key) => {
      if (key === 'q') {
        console.log('\n🛑 "q" pressionado — encerrando bot...');
        await encerrarBotComStatus();
      } 
      // Permite Ctrl+C funcionar normalmente
      if (key === '\u0003') { 
        await encerrarBotComStatus(); 
      }
    });
  }
}

// Atualiza status para encerrando e depois offline
async function encerrarBotComStatus() {
  try {
    await setBotStatus('encerrando', null, null);
    await setBotOffline();
  } catch (e) {
    console.error('Erro ao setar status encerrando/offline:', e);
  }
  await client.destroy();
  process.exit(0);
}

// Evento: Autenticação bem-sucedida
client.on('authenticated', async () => {
  setBotStatus('authenticated');
  // NOVO: iniciando aprendizado automático assim que autenticado
  const adminNumero = process.env.ADMIN_NUMERO || null;
  if (adminNumero) {
    await aprenderComConversasDoAdmin(adminNumero);
  } else {
    console.log('⚠️ Variável ADMIN_NUMERO não definida. Defina no .env para aprendizado automático.');
  }
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
  await encerrarBotComStatus();
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido sinal de término, encerrando bot...');
  await encerrarBotComStatus();
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erro não tratado:', reason);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Exceção não capturada:', error);
  await encerrarBotComStatus();
});

listenForQuit();
