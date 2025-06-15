
import { supabase } from '../config/database.js';

/**
 * Salva uma conversa (mensagem recebida + resposta enviada) no banco
 * @param {string} usuarioId - ID do usuário
 * @param {string} mensagemRecebida - Mensagem recebida do usuário
 * @param {string} mensagemEnviada - Resposta enviada pelo bot
 */
export async function salvarConversa(usuarioId, mensagemRecebida, mensagemEnviada) {
  try {
    const { error } = await supabase
      .from('mensagens')
      .insert({
        usuario_id: usuarioId,
        mensagem_recebida: mensagemRecebida,
        mensagem_enviada: mensagemEnviada
      });

    if (error) {
      throw error;
    }

    console.log('💾 Conversa salva no banco de dados');
  } catch (error) {
    console.error('❌ Erro ao salvar conversa:', error);
    throw error;
  }
}

/**
 * Busca o histórico de mensagens de um usuário
 * @param {string} usuarioId - ID do usuário
 * @param {number} limite - Número máximo de mensagens a buscar
 * @returns {Array} Histórico de mensagens
 */
export async function buscarHistoricoMensagens(usuarioId, limite = 10) {
  try {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('timestamp', { ascending: false })
      .limit(limite);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return [];
  }
}
