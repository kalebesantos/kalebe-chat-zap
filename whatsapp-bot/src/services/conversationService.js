
import { supabase } from '../config/database.js';

/**
 * Verifica se um usuário tem histórico de conversa
 * @param {string} usuarioId - ID do usuário
 * @returns {boolean} True se tem histórico
 */
export async function usuarioTemHistorico(usuarioId) {
  try {
    const { data, error } = await supabase
      .from('mensagens')
      .select('id')
      .eq('usuario_id', usuarioId)
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar histórico do usuário:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Erro ao verificar histórico do usuário:', error);
    return false;
  }
}

/**
 * Verifica se um usuário pelo número de WhatsApp tem histórico
 * @param {string} numeroWhatsapp - Número do WhatsApp (sem @c.us)
 * @returns {boolean} True se tem histórico
 */
export async function usuarioPorNumeroTemHistorico(numeroWhatsapp) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        mensagens(id)
      `)
      .eq('numero_whatsapp', numeroWhatsapp)
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar histórico por número:', error);
      return false;
    }

    if (!data || data.length === 0) {
      return false; // Usuário não existe
    }

    const usuario = data[0];
    return usuario.mensagens && usuario.mensagens.length > 0;
  } catch (error) {
    console.error('❌ Erro ao verificar histórico por número:', error);
    return false;
  }
}
