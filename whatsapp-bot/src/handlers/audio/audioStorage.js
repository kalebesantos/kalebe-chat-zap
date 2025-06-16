
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório temporário para arquivos de áudio
const TEMP_DIR = path.join(__dirname, '..', '..', '..', 'temp_audio');

// Garantir que o diretório existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export function salvarArquivoAudio(media, numeroUsuario) {
  const nomeArquivo = `audio_${Date.now()}_${numeroUsuario}.ogg`;
  const caminhoArquivo = path.join(TEMP_DIR, nomeArquivo);
  
  const buffer = Buffer.from(media.data, 'base64');
  fs.writeFileSync(caminhoArquivo, buffer);

  console.log(`📁 Arquivo salvo: ${caminhoArquivo} (${buffer.length} bytes)`);

  return {
    caminhoArquivo,
    nomeArquivo,
    tamanhoBytes: buffer.length
  };
}

export function removerArquivoTemporario(caminhoArquivo) {
  try {
    fs.unlinkSync(caminhoArquivo);
    console.log('🗑️ Arquivo temporário removido');
  } catch (error) {
    console.warn('⚠️ Erro ao remover arquivo temporário:', error.message);
  }
}
