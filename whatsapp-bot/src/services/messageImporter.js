
import { supabase } from '../config/database.js';

export async function importarMensagensWhatsApp(adminId, textoExport) {
  const regexMensagem = /\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - ([^:]+): (.+)/g;
  const mensagens = [];
  let match;
  while ((match = regexMensagem.exec(textoExport)) !== null) {
    const [, autor, conteudo] = match;
    if (autor.trim() === adminId || autor.includes(adminId)) {
      mensagens.push({
        admin_id: adminId,
        conteudo: conteudo.trim(),
        fonte: 'whatsapp_export',
        timestamp: new Date().toISOString()
      });
    }
  }
  if (mensagens.length === 0) {
    return [];
  }
  const { error } = await supabase
    .from('admin_messages')
    .insert(mensagens);

  if (error) {
    throw error;
  }
  return mensagens;
}
