
import fs from 'fs';

export async function transcriverAudio(caminhoArquivo) {
  const startTime = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const formData = new FormData();
    const audioBuffer = fs.readFileSync(caminhoArquivo);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });
    
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    console.log(`🎤 Enviando áudio para transcrição (${audioBuffer.length} bytes)...`);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro da API OpenAI: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const resultado = await response.json();
    const tempoProcessamento = Date.now() - startTime;

    console.log(`✅ Transcrição concluída em ${tempoProcessamento}ms`);

    return {
      texto: resultado.text || '',
      tempo_processamento_ms: tempoProcessamento,
      sucesso: true
    };

  } catch (error) {
    const tempoProcessamento = Date.now() - startTime;
    console.error('❌ Erro na transcrição:', error);
    
    return {
      texto: '',
      tempo_processamento_ms: tempoProcessamento,
      sucesso: false,
      erro: error.message
    };
  }
}
