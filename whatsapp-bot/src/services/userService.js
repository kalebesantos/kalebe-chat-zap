
import { supabase } from '../config/database.js';

/**
 * Busca um usuário pelo número do WhatsApp
 * @param {string} numeroWhatsapp - Número do WhatsApp do usuário
 * @returns {Object|null} Dados do usuário ou null se não encontrado
 */
export async function buscarUsuario(numeroWhatsapp) {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('numero_whatsapp', numeroWhatsapp)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return usuario;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * Cria ou atualiza um usuário no banco de dados
 * @param {string} numeroWhatsapp - Número do WhatsApp do usuário
 * @param {string} nome - Nome do usuário (opcional)
 * @returns {Object|null} Dados do usuário criado/atualizado
 */
export async function criarOuAtualizarUsuario(numeroWhatsapp, nome = null) {
  try {
    // Primeiro, tenta buscar o usuário existente
    let usuario = await buscarUsuario(numeroWhatsapp);

    // Se usuário já existe, retorna os dados
    if (usuario) {
      console.log(`👤 Usuário encontrado: ${usuario.nome || numeroWhatsapp}`);
      return usuario;
    }

    // Se não existe, cria um novo usuário
    const { data: novoUsuario, error: errorCriacao } = await supabase
      .from('usuarios')
      .insert({
        numero_whatsapp: numeroWhatsapp,
        nome: nome,
        estilo_fala: 'neutro'
      })
      .select()
      .single();

    if (errorCriacao) {
      throw errorCriacao;
    }

    console.log(`✅ Novo usuário criado: ${nome || numeroWhatsapp}`);
    return novoUsuario;

  } catch (error) {
    console.error('❌ Erro ao criar/atualizar usuário:', error);
    return null;
  }
}

/**
 * Busca ou cria um usuário no banco de dados (alias para criarOuAtualizarUsuario)
 * @param {string} numeroWhatsapp - Número do WhatsApp do usuário
 * @param {string} nome - Nome do usuário (opcional)
 * @returns {Object} Dados do usuário
 */
export async function buscarOuCriarUsuario(numeroWhatsapp, nome = null) {
  return await criarOuAtualizarUsuario(numeroWhatsapp, nome);
}

/**
 * Atualiza o estilo de fala de um usuário
 * @param {string} userId - ID do usuário
 * @param {string} novoEstilo - Novo estilo de fala
 */
export async function atualizarEstiloFala(userId, novoEstilo) {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ estilo_fala: novoEstilo })
      .eq('id', userId);

    if (error) throw error;
    
    console.log(`✅ Estilo de fala atualizado para: ${novoEstilo}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar estilo de fala:', error);
    throw error;
  }
}

/**
 * Atualiza o nome de um usuário
 * @param {string} userId - ID do usuário
 * @param {string} novoNome - Novo nome do usuário
 */
export async function atualizarNomeUsuario(userId, novoNome) {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ nome: novoNome })
      .eq('id', userId);

    if (error) throw error;
    
    console.log(`✅ Nome do usuário atualizado para: ${novoNome}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar nome do usuário:', error);
    throw error;
  }
}
