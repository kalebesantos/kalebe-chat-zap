
import { supabase } from '../config/database.js';

export async function salvarPerfilEstilo(adminId, nomeAdmin, analise, exemplosMensagens, totalMensagens) {
  const { error } = await supabase
    .from('admin_style_profiles')
    .upsert({
      admin_id: adminId,
      nome_admin: nomeAdmin,
      estilo_resumo: analise.estilo_resumo,
      exemplos_mensagens: exemplosMensagens,
      palavras_frequentes: { lista: analise.palavras_frequentes },
      emojis_frequentes: analise.emojis_frequentes,
      tom_comunicacao: analise.tom_comunicacao,
      vocabulario_caracteristico: analise.vocabulario_caracteristico,
      total_mensagens: totalMensagens,
      ultima_atualizacao: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  if (error) {
    throw error;
  }
  return true;
}
