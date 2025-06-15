import { supabase } from '../config/database.js';
import openai from './openaiService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Adiciona uma mensagem do administrador para aprendizado
 */
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

/**
 * Analisa as mensagens do administrador e gera um perfil de estilo
 */
export async function analisarEstiloAdmin(adminId, nomeAdmin) {
  try {
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

    console.log(`🧠 Analisando ${mensagens.length} mensagens de ${nomeAdmin}...`);

    const textoMensagens = mensagens.map(m => m.conteudo).join('\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Analise o estilo de comunicação desta pessoa baseado nas mensagens abaixo. Extraia:
1. Tom geral (formal, informal, descontraído, etc.)
2. Palavras e expressões mais usadas
3. Emojis frequentes
4. Vocabulário característico
5. Padrões de linguagem

Retorne um JSON com a estrutura:
{
  "tom_comunicacao": "descrição do tom",
  "estilo_resumo": "resumo detalhado do estilo em 2-3 frases",
  "palavras_frequentes": ["palavra1", "palavra2"],
  "emojis_frequentes": ["emoji1", "emoji2"],
  "vocabulario_caracteristico": ["expressão1", "expressão2"]
}`
      }, {
        role: "user",
        content: textoMensagens
      }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const analise = JSON.parse(completion.choices[0].message.content);

    const exemplosMensagens = mensagens.slice(0, 10).map(m => m.conteudo);

    const { error: perfilError } = await supabase
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
        total_mensagens: mensagens.length,
        ultima_atualizacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (perfilError) {
      console.error('❌ Erro ao salvar perfil de estilo:', perfilError);
      return null;
    }

    console.log(`✅ Perfil de estilo criado para ${nomeAdmin}`);
    return analise;

  } catch (error) {
    console.error('❌ Erro ao analisar estilo do admin:', error);
    return null;
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
 * Importa mensagens de um export do WhatsApp
 */
export async function importarMensagensWhatsApp(adminId, textoExport) {
  try {
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
      console.log('⚠️ Nenhuma mensagem do admin encontrada no export');
      return 0;
    }

    const { error } = await supabase
      .from('admin_messages')
      .insert(mensagens);

    if (error) {
      console.error('❌ Erro ao importar mensagens:', error);
      return 0;
    }

    console.log(`✅ ${mensagens.length} mensagens importadas do WhatsApp`);
    return mensagens.length;
  } catch (error) {
    console.error('❌ Erro ao importar mensagens do WhatsApp:', error);
    return 0;
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
