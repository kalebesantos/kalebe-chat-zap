
import { supabase } from '../config/database.js';

/**
 * Salva ou atualiza o número de WhatsApp do admin na tabela admin_config
 * @param {string} numeroWhatsapp
 * @param {string|null} nomeAdmin
 */
export async function salvarAdminConfig(numeroWhatsapp, nomeAdmin = null) {
  if (!numeroWhatsapp) return false;

  try {
    const { error } = await supabase
      .from('admin_config')
      .upsert([
        {
          numero_whatsapp: numeroWhatsapp,
          nome_admin: nomeAdmin || null,
          atualizado_em: new Date().toISOString()
        }
      ], { onConflict: ['numero_whatsapp'] });

    if (error) {
      console.error('❌ Erro ao salvar admin_config:', error);
      return false;
    }
    console.log(`✅ Número do admin (${numeroWhatsapp}) persistido em admin_config`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar admin_config:', error);
    return false;
  }
}

/**
 * Busca o número do WhatsApp admin atual (o mais recentemente atualizado)
 * @returns {string|null}
 */
export async function buscarAdminNumero() {
  try {
    const { data, error } = await supabase
      .from('admin_config')
      .select('numero_whatsapp')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data.numero_whatsapp;
  } catch (error) {
    console.error('❌ Erro ao buscar admin_config:', error);
    return null;
  }
}
