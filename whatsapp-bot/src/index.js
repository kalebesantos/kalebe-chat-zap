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

// Evento: QR Code para autenticação
client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR Code abaixo com o WhatsApp:');
  qrcode.generate(qr, { small: true });
  console.log('\n⚡ Aguardando autenticação...');
});

// Evento: Cliente pronto
client.on('ready', async () => {
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
  console.log('🔐 Autenticação realizada com sucesso!');
});

// Evento: Falha na autenticação
client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
});

// Evento: Cliente desconectado
client.on('disconnected', async (reason) => {
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
  console.error('❌ Erro no cliente WhatsApp:', error);
});

// Inicializa o cliente
client.initialize();

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido sinal de interrupção, encerrando bot...');
  // Marca offline no banco
  try {
    await supabase
      .from('bot_config')
      .upsert([
        { chave: 'bot_online', valor: 'false', descricao: 'Status online do bot', updated_at: new Date().toISOString() }
      ], { onConflict: ['chave'] });
  } catch (err) {
    console.error('❌ Erro ao atualizar status do bot (offline on SIGINT):', err);
  }
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido sinal de término, encerrando bot...');
  // Marca offline no banco
  try {
    await supabase
      .from('bot_config')
      .upsert([
        { chave: 'bot_online', valor: 'false', descricao: 'Status online do bot', updated_at: new Date().toISOString() }
      ], { onConflict: ['chave'] });
  } catch (err) {
    console.error('❌ Erro ao atualizar status do bot (offline on SIGTERM):', err);
  }
  await client.destroy();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erro não tratado:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});
