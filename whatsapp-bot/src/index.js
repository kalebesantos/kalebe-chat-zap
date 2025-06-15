
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { processarMensagem } from './handlers/messageHandler.js';

// Carrega variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando Bot WhatsApp...');

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
client.on('ready', () => {
  console.log('✅ Bot WhatsApp conectado e pronto!');
  console.log('🤖 Aguardando mensagens...\n');
  
  // Envia mensagem de teste para si mesmo (opcional)
  // client.sendMessage('seu_numero@c.us', '🤖 Bot iniciado com sucesso!');
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
client.on('disconnected', (reason) => {
  console.log('⚠️ Cliente desconectado:', reason);
  console.log('🔄 Tentando reconectar...');
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
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido sinal de término, encerrando bot...');
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
