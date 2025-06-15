
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('[Supabase Init] SUPABASE_URL:', supabaseUrl ? 'OK' : 'VAZIO', 'SUPABASE_KEY:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórios no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase conectado com sucesso');

