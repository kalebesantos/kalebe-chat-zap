
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

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ Falha ao parsear análise de estilo:', err);
    return null;
  }
}
