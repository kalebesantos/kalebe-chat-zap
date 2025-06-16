import openai from './openaiService.js';

export async function analisarEstiloAdmin(mensagens, nomeAdmin) {
  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    console.log(`⚠️ Nenhuma mensagem recebida para análise de estilo`);
    return null;
  }
  
  const textoMensagens = mensagens.map(m => m.conteudo).join('\n');

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "system",
      content: `Você é um especialista em análise de padrões de comunicação humana. Analise o estilo de comunicação desta pessoa baseado nas mensagens do WhatsApp abaixo.

FOQUE EM:
1. Como a pessoa realmente fala (informal, formal, gírias, etc.)
2. Expressões e palavras que ela usa frequentemente
3. Emojis que costuma usar
4. Jeito de cumprimentar e se despedir
5. Se usa abreviações (vc, tb, pq, etc.)
6. Tom emocional (alegre, sério, descontraído)
7. Tamanho típico das mensagens (curtas, longas)

IMPORTANTE: Crie um perfil que permita imitar essa pessoa de forma natural, como se fosse ela mesma respondendo.

Retorne um JSON com a estrutura:
{
  "tom_comunicacao": "descrição detalhada do tom (ex: informal e descontraído, usa gírias brasileiras)",
  "estilo_resumo": "instruções detalhadas de como essa pessoa escreve, incluindo exemplos de frases típicas que ela usaria",
  "palavras_frequentes": ["palavra1", "palavra2", "expressão1"],
  "emojis_frequentes": ["emoji1", "emoji2"],
  "vocabulario_caracteristico": ["expressão típica 1", "jeito de falar 2", "gíria favorita"]
}`
    }, {
      role: "user",
      content: `Mensagens do WhatsApp de ${nomeAdmin}:\n\n${textoMensagens}`
    }],
    max_tokens: 1500,
    temperature: 0.3,
  });

  try {
    const resultado = JSON.parse(completion.choices[0].message.content);
    
    // Enriquecer o estilo_resumo com instruções mais específicas
    if (resultado.estilo_resumo) {
      resultado.estilo_resumo = `${resultado.estilo_resumo}

INSTRUÇÕES ESPECÍFICAS:
- Responda como ${nomeAdmin} responderia
- Use o mesmo tom: ${resultado.tom_comunicacao}
- Incorpore estas expressões: ${resultado.vocabulario_caracteristico?.join(', ')}
- Use estes emojis quando apropriado: ${resultado.emojis_frequentes?.join(' ')}
- NUNCA se identifique como IA ou assistente
- Seja natural e espontâneo como em uma conversa real do WhatsApp`;
    }
    
    return resultado;
  } catch (err) {
    console.error('❌ Falha ao parsear análise de estilo:', err);
    return null;
  }
}