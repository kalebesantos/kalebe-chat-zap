import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { processarMensagem } from './handlers/messageHandler.js';
import { supabase } from './config/database.js';
import { salvarAdminConfig, buscarAdminNumero } from './services/adminConfigService.js';

// Polyfill para FormData (necessário para transcrição de áudio)
import { FormData } from 'formdata-polyfill/esm.min.js';
globalThis.FormData = FormData;

// Carrega variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando Bot WhatsApp com aprendizado de estilo humano...');
console.log('🧠 O bot aprenderá a responder como você!');

// NOVO: Mensagem clara sobre encerrar o bot com 'q'
console.log('ℹ️ Pressione "q" a qualquer momento no terminal para ENCERRAR o bot.\n');

// Verificar se a chave da OpenAI está configurada
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY não configurada. O bot não funcionará sem ela.');
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

import { importarMensagensWhatsApp } from './services/styleLearningService.js';

// Novo: função para status granular
async function setBotStatus(status, errorMessage = null, qrCode = null) {
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
  console.log('🧠 Sistema de aprendizado de estilo ativo!');
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

// NOVA: função para aprendizado automático do administrador
async function aprenderComConversasDoAdmin(adminNumero, client) {
  try {
    console.log(`🤖 Iniciando aprendizado automático para ${adminNumero}...`);

    // Coleta conversas do WhatsApp Web
    const textoExport = await coletarConversasDoWhatsApp(adminNumero, client);

    if (textoExport) {
      const total = await importarMensagensWhatsApp(adminNumero, textoExport);
      if (total > 0) {
        console.log(`✅ ${total} mensagens analisadas e perfil criado!`);
        console.log(`🎯 Bot agora responderá imitando o estilo de ${adminNumero}`);
      } else {
        console.log('⚠️ Nenhuma mensagem foi encontrada para aprendizado.');
        console.log('💡 Dica: Use os comandos /adicionar_msg ou /processar_export para treinar o bot');
      }
    } else {
      console.log('⚠️ Não foi possível coletar conversas automaticamente.');
      console.log('💡 Use /adicionar_msg [sua mensagem] para ensinar o bot seu estilo');
    }
  } catch (error) {
    console.error('❌ Erro ao aprender com as conversas do admin:', error);
  }
}

// Coleta mensagens do admin de conversas existentes
async function coletarConversasDoWhatsApp(adminNumero, client) {
  try {
    let textoExport = '';
    console.log(`🔍 Buscando mensagens de ${adminNumero} nas conversas...`);
    
    // Busca todos os chats
    const chats = await client.getChats();
    let mensagensEncontradas = 0;
    
    for (const chat of chats) {
      try {
        // Buscar mensagens recentes (últimas 50 por chat)
        const msgs = await chat.fetchMessages({ limit: 50 });
        
        for (const m of msgs) {
          // Somente mensagens enviadas pelo admin
          if (m.from === (adminNumero + '@c.us') && m.body && m.body.trim()) {
            const timestamp = m.timestamp ? new Date(m.timestamp * 1000).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
            textoExport += `${timestamp} - ${adminNumero}: ${m.body}\n`;
            mensagensEncontradas++;
          }
        }
      } catch (chatError) {
        // Ignora erros de chats específicos
        continue;
      }
    }
    
    console.log(`📊 ${mensagensEncontradas} mensagens encontradas para análise`);
    return textoExport.length > 0 ? textoExport : null;
  } catch (error) {
    console.error('❌ Erro ao coletar conversas do WhatsApp:', error);
    return null;
  }
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
    console.log('🔄 Encerrando bot graciosamente...');
    stopHeartbeat();
    await setBotStatus('offline', 'Bot encerrado pelo usuário');
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

  // Detecta automaticamente o número do admin conectado
  try {
    const me = await client.getMe();
    if (me && me.id && me.id.user) {
      const autoAdminNumero = me.id.user;
      await salvarAdminConfig(autoAdminNumero);
      console.log(`✅ Admin detectado automaticamente: ${autoAdminNumero}`);
      
      // Inicia aprendizado automático
      setTimeout(() => {
        aprenderComConversasDoAdmin(autoAdminNumero, client);
      }, 5000); // Aguarda 5s para garantir que está tudo conectado
      
    } else {
      console.warn("⚠️ Não foi possível detectar número do admin automaticamente.");
    }
  } catch (e) {
    console.error('❌ Erro ao detectar número do admin:', e);
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