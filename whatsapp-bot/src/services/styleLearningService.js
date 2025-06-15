import { supabase } from '../config/database.js';
import { analisarEstiloAdmin } from './styleAnalyzer.js';
import { importarMensagensWhatsApp as importarMensagens } from './messageImporter.js';
import { salvarPerfilEstilo } from './profileManager.js';
import { atualizarEstiloUsuario } from './userStyleUpdater.js';
import dotenv from 'dotenv';
dotenv.config();

export async function adicionarMensagemAdmin(adminId, conteudo, fonte = 'manual') {
  try {
    const { error } = await supabase
      .from('admin_messages')
      .insert({
        admin_id: adminId,
        conteudo: conteudo.trim(),
        fonte,
        timestamp: new Date().toISOString()
      });
    if (error) {
      console.error('❌ Erro ao adicionar mensagem do admin:', error);
      return false;
    }
    console.log(`✅ Mensagem do admin ${adminId} adicionada para aprendizado`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao adicionar mensagem do admin:', error);
    return false;
  }
}

export async function analisarEstilo(adminId, nomeAdmin) {
  const { data: mensagens, error } = await supabase
    .from('admin_messages')
    .select('conteudo, timestamp')
    .eq('admin_id', adminId)
    .order('timestamp', { ascending: false })
    .limit(100);
  if (error || !mensagens || mensagens.length === 0) {
    console.log(`⚠️ Nenhuma mensagem encontrada para ${adminId}`);
    return null;
  }

  const analise = await analisarEstiloAdmin(mensagens, nomeAdmin);
  if (!analise) return null;

  const exemplosMensagens = mensagens.slice(0, 10).map(m => m.conteudo);
  try {
    await salvarPerfilEstilo(adminId, nomeAdmin, analise, exemplosMensagens, mensagens.length);
    await atualizarEstiloUsuario(adminId, analise.estilo_resumo);
    return analise;
  } catch (err) {
    console.error('❌ Erro ao salvar perfil de estilo:', err);
    return null;
  }
}

export async function importarMensagensWhatsApp(adminId, textoExport) {
  try {
    const mensagens = await importarMensagens(adminId, textoExport);
    if (mensagens.length === 0) return 0;
    const nomeAdmin = adminId; // Se quiser, aprimorar para buscar pelo nome real
    const analise = await analisarEstilo(adminId, nomeAdmin);
    if (analise && analise.estilo_resumo) {
      await atualizarEstiloUsuario(adminId, analise.estilo_resumo);
    }
    return mensagens.length;
  } catch (error) {
    console.error('❌ Erro ao importar mensagens do WhatsApp:', error);
    return 0;
  }
}

/**
 * Busca o perfil de estilo ativo
 */
export async function buscarPerfilEstiloAtivo() {
  try {
    const { data, error } = await supabase
      .from('admin_style_profiles')
      .select('*')
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar perfil de estilo ativo:', error);
    return null;
  }
}

/**
 * Ativa um perfil de estilo específico
 */
export async function ativarPerfilEstilo(adminId) {
  try {
    await supabase
      .from('admin_style_profiles')
      .update({ ativo: false })
      .neq('admin_id', '');

    const { error } = await supabase
      .from('admin_style_profiles')
      .update({ ativo: true })
      .eq('admin_id', adminId);

    if (error) {
      console.error('❌ Erro ao ativar perfil de estilo:', error);
      return false;
    }

    console.log(`✅ Perfil de estilo ${adminId} ativado`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao ativar perfil de estilo:', error);
    return false;
  }
}

/**
 * Desativa todos os perfis de estilo
 */
export async function desativarTodosPerfiles() {
  try {
    const { error } = await supabase
      .from('admin_style_profiles')
      .update({ ativo: false })
      .neq('admin_id', '');

    if (error) {
      console.error('❌ Erro ao desativar perfis:', error);
      return false;
    }

    console.log('✅ Todos os perfis de estilo desativados');
    return true;
  } catch (error) {
    console.error('❌ Erro ao desativar perfis:', error);
    return false;
  }
}

/**
 * Lista todos os perfis de estilo disponíveis
 */
export async function listarPerfisEstilo() {
  try {
    const { data, error } = await supabase
      .from('admin_style_profiles')
      .select('admin_id, nome_admin, ativo, total_mensagens, ultima_atualizacao')
      .order('ultima_atualizacao', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar perfis:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao listar perfis:', error);
    return [];
  }
}
