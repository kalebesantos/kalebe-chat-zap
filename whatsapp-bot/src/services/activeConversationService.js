
import { supabase } from '../config/database.js';

/**
 * Verifica se um usuário está em conversa ativa
 * @param {string} usuarioId - ID do usuário
 * @returns {boolean} True se está em conversa ativa
 */
export async function usuarioEstaAtivo(usuarioId) {
  try {
    const { data, error } = await supabase
      .from('conversas_ativas')
      .select('ativo')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erro ao verificar conversa ativa:', error);
      return false;
    }

    return data?.ativo || false;
  } catch (error) {
    console.error('❌ Erro ao verificar conversa ativa:', error);
    return false;
  }
}

/**
 * Verifica se um usuário por número de WhatsApp está em conversa ativa
 * @param {string} numeroWhatsapp - Número do WhatsApp (sem @c.us)
 * @returns {boolean} True se está em conversa ativa
 */
export async function usuarioPorNumeroEstaAtivo(numeroWhatsapp) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        conversas_ativas!inner(ativo)
      `)
      .eq('numero_whatsapp', numeroWhatsapp)
      .eq('conversas_ativas.ativo', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar conversa ativa por número:', error);
      return false;
    }

    return data?.conversas_ativas?.ativo || false;
  } catch (error) {
    console.error('❌ Erro ao verificar conversa ativa por número:', error);
    return false;
  }
}

/**
 * Ativa conversa para um usuário
 * @param {string} usuarioId - ID do usuário
 * @param {boolean} adminIniciou - Se foi o admin que iniciou
 * @returns {boolean} True se ativada com sucesso
 */
export async function ativarConversa(usuarioId, adminIniciou = false) {
  try {
    const { error } = await supabase
      .from('conversas_ativas')
      .upsert({ 
        usuario_id: usuarioId,
        ativo: true,
        admin_iniciou: adminIniciou,
        ultima_atividade: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Erro ao ativar conversa:', error);
      return false;
    }

    console.log(`✅ Conversa ativada para usuário ${usuarioId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao ativar conversa:', error);
    return false;
  }
}

/**
 * Desativa conversa para um usuário
 * @param {string} usuarioId - ID do usuário
 * @returns {boolean} True se desativada com sucesso
 */
export async function desativarConversa(usuarioId) {
  try {
    const { error } = await supabase
      .from('conversas_ativas')
      .update({ 
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('❌ Erro ao desativar conversa:', error);
      return false;
    }

    console.log(`✅ Conversa desativada para usuário ${usuarioId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao desativar conversa:', error);
    return false;
  }
}

/**
 * Ativa conversa por número de WhatsApp
 * @param {string} numeroWhatsapp - Número do WhatsApp (sem @c.us)
 * @param {boolean} adminIniciou - Se foi o admin que iniciou
 * @returns {boolean} True se ativada com sucesso
 */
export async function ativarConversaPorNumero(numeroWhatsapp, adminIniciou = false) {
  try {
    // Primeiro busca o usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('numero_whatsapp', numeroWhatsapp)
      .single();

    if (usuarioError || !usuario) {
      console.error('❌ Usuário não encontrado:', numeroWhatsapp);
      return false;
    }

    return await ativarConversa(usuario.id, adminIniciou);
  } catch (error) {
    console.error('❌ Erro ao ativar conversa por número:', error);
    return false;
  }
}

/**
 * Desativa conversa por número de WhatsApp
 * @param {string} numeroWhatsapp - Número do WhatsApp (sem @c.us)
 * @returns {boolean} True se desativada com sucesso
 */
export async function desativarConversaPorNumero(numeroWhatsapp) {
  try {
    // Primeiro busca o usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('numero_whatsapp', numeroWhatsapp)
      .single();

    if (usuarioError || !usuario) {
      console.error('❌ Usuário não encontrado:', numeroWhatsapp);
      return false;
    }

    return await desativarConversa(usuario.id);
  } catch (error) {
    console.error('❌ Erro ao desativar conversa por número:', error);
    return false;
  }
}

/**
 * Lista todos os usuários em conversas ativas
 * @returns {Array} Lista de usuários ativos
 */
export async function listarConversasAtivas() {
  try {
    const { data, error } = await supabase
      .from('conversas_ativas')
      .select(`
        ativo,
        admin_iniciou,
        ultima_atividade,
        created_at,
        usuarios!inner(
          numero_whatsapp,
          nome
        )
      `)
      .eq('ativo', true)
      .order('ultima_atividade', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar conversas ativas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao listar conversas ativas:', error);
    return [];
  }
}

/**
 * Atualiza a última atividade de uma conversa
 * @param {string} usuarioId - ID do usuário
 * @returns {boolean} True se atualizada com sucesso
 */
export async function atualizarUltimaAtividade(usuarioId) {
  try {
    const { error } = await supabase
      .from('conversas_ativas')
      .update({ 
        ultima_atividade: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('usuario_id', usuarioId)
      .eq('ativo', true);

    if (error) {
      console.error('❌ Erro ao atualizar última atividade:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar última atividade:', error);
    return false;
  }
}
