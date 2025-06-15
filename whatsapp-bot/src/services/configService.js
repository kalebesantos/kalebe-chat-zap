
import { supabase } from '../config/database.js';

/**
 * Busca uma configuração específica do bot
 * @param {string} chave - Chave da configuração
 * @returns {string|null} Valor da configuração ou null se não encontrada
 */
export async function buscarConfiguracao(chave) {
  try {
    const { data, error } = await supabase
      .from('bot_config')
      .select('valor')
      .eq('chave', chave)
      .maybeSingle();

    if (error) {
      console.error(`❌ Erro ao buscar configuração ${chave}:`, error);
      return null;
    }

    return data?.valor || null;
  } catch (error) {
    console.error(`❌ Erro ao buscar configuração ${chave}:`, error);
    return null;
  }
}

/**
 * Atualiza uma configuração do bot usando update/insert apropriado
 * @param {string} chave - Chave da configuração
 * @param {string} valor - Novo valor da configuração
 * @returns {boolean} True se atualizada com sucesso
 */
export async function atualizarConfiguracao(chave, valor) {
  try {
    // Primeiro verifica se já existe
    const { data: existing } = await supabase
      .from('bot_config')
      .select('id')
      .eq('chave', chave)
      .maybeSingle();

    let error;
    if (existing) {
      // Se existe, atualiza
      const result = await supabase
        .from('bot_config')
        .update({
          valor,
          updated_at: new Date().toISOString()
        })
        .eq('chave', chave);
      error = result.error;
    } else {
      // Se não existe, insere
      const result = await supabase
        .from('bot_config')
        .insert({
          chave,
          valor,
          updated_at: new Date().toISOString()
        });
      error = result.error;
    }

    if (error) {
      console.error(`❌ Erro ao atualizar configuração ${chave}:`, error);
      return false;
    }

    console.log(`✅ Configuração ${chave} atualizada para: ${valor}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar configuração ${chave}:`, error);
    return false;
  }
}

/**
 * Busca o modo de resposta atual do bot
 * @returns {string} 'aberto' ou 'restrito'
 */
export async function buscarModoResposta() {
  const modo = await buscarConfiguracao('modo_resposta');
  return modo || 'aberto'; // padrão é aberto
}

/**
 * Atualiza o modo de resposta do bot
 * @param {string} novoModo - 'aberto' ou 'restrito'
 * @returns {boolean} True se atualizado com sucesso
 */
export async function atualizarModoResposta(novoModo) {
  if (!['aberto', 'restrito'].includes(novoModo)) {
    console.error('❌ Modo inválido. Use "aberto" ou "restrito"');
    return false;
  }

  return await atualizarConfiguracao('modo_resposta', novoModo);
}
