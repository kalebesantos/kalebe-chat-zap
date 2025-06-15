
import { supabase } from '../config/database.js';

export async function atualizarEstiloUsuario(adminId, estiloResumo) {
  const { data: usuario, error: errorBusca } = await supabase
    .from('usuarios')
    .select('id')
    .eq('numero_whatsapp', adminId)
    .maybeSingle();
  if (errorBusca || !usuario) {
    // Não encontrado, ignora
    return false;
  }
  const { error } = await supabase
    .from('usuarios')
    .update({ estilo_fala: estiloResumo })
    .eq('id', usuario.id);
  if (error) {
    return false;
  }
  return true;
}
