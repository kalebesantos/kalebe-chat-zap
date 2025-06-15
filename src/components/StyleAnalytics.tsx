
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart as PieChartIcon, Hash, Smile } from 'lucide-react';

interface StyleAnalyticsProps {
  perfilId: string;
  adminId: string;
}

const StyleAnalytics = ({ perfilId, adminId }: StyleAnalyticsProps) => {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const buscarMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('conteudo, timestamp, fonte')
        .eq('admin_id', adminId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarMensagens();
  }, [adminId]);

  // Análise de frequência de palavras
  const analisarPalavras = () => {
    const palavras: { [key: string]: number } = {};
    
    mensagens.forEach(msg => {
      const palavrasLimpas = msg.conteudo
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(palavra => palavra.length > 2);
      
      palavrasLimpas.forEach(palavra => {
        palavras[palavra] = (palavras[palavra] || 0) + 1;
      });
    });

    return Object.entries(palavras)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([palavra, frequencia]) => ({ palavra, frequencia }));
  };

  // Análise de fonte das mensagens
  const analisarFontes = () => {
    const fontes: { [key: string]: number } = {};
    
    mensagens.forEach(msg => {
      const fonte = msg.fonte || 'manual';
      fontes[fonte] = (fontes[fonte] || 0) + 1;
    });

    return Object.entries(fontes).map(([fonte, quantidade]) => ({
      fonte: fonte === 'manual' ? 'Manual' : 
             fonte === 'whatsapp_export' ? 'WhatsApp' : 
             fonte === 'sistema' ? 'Sistema' : fonte,
      quantidade
    }));
  };

  // Análise de tamanho das mensagens
  const analisarTamanhoMensagens = () => {
    const faixas = {
      'Curta (1-20)': 0,
      'Média (21-50)': 0,
      'Longa (51-100)': 0,
      'Muito Longa (100+)': 0
    };

    mensagens.forEach(msg => {
      const tamanho = msg.conteudo.length;
      if (tamanho <= 20) faixas['Curta (1-20)']++;
      else if (tamanho <= 50) faixas['Média (21-50)']++;
      else if (tamanho <= 100) faixas['Longa (51-100)']++;
      else faixas['Muito Longa (100+)']++;
    });

    return Object.entries(faixas).map(([faixa, quantidade]) => ({ faixa, quantidade }));
  };

  // Análise de emojis
  const analisarEmojis = () => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis: { [key: string]: number } = {};

    mensagens.forEach(msg => {
      const emojiMatches = msg.conteudo.match(emojiRegex);
      if (emojiMatches) {
        emojiMatches.forEach(emoji => {
          emojis[emoji] = (emojis[emoji] || 0) + 1;
        });
      }
    });

    return Object.entries(emojis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([emoji, frequencia]) => ({ emoji, frequencia }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        Carregando análises...
      </div>
    );
  }

  const palavrasFrequentes = analisarPalavras();
  const fontesMensagens = analisarFontes();
  const tamanhoMensagens = analisarTamanhoMensagens();
  const emojisFrequentes = analisarEmojis();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{mensagens.length}</div>
            <div className="text-sm text-gray-600">Total de Mensagens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(mensagens.reduce((acc, msg) => acc + msg.conteudo.length, 0) / mensagens.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Tamanho Médio</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{palavrasFrequentes.length}</div>
            <div className="text-sm text-gray-600">Palavras Únicas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{emojisFrequentes.length}</div>
            <div className="text-sm text-gray-600">Emojis Diferentes</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Palavras Frequentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Palavras Mais Frequentes
            </CardTitle>
            <CardDescription>
              Top 10 palavras mais utilizadas nas mensagens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={palavrasFrequentes}>
                  <XAxis dataKey="palavra" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="frequencia" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Fontes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Origem das Mensagens
            </CardTitle>
            <CardDescription>
              Distribuição por fonte de treinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fontesMensagens}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                    label={({ fonte, quantidade }) => `${fonte}: ${quantidade}`}
                  >
                    {fontesMensagens.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Análise de Tamanho das Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tamanho das Mensagens
            </CardTitle>
            <CardDescription>
              Distribuição por comprimento do texto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tamanhoMensagens}>
                  <XAxis dataKey="faixa" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantidade" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Emojis Mais Usados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Emojis Favoritos
            </CardTitle>
            <CardDescription>
              Emojis mais utilizados com frequência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {emojisFrequentes.map((item, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <Badge variant="secondary">{item.frequencia}x</Badge>
                </div>
              ))}
            </div>
            {emojisFrequentes.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nenhum emoji foi encontrado nas mensagens analisadas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StyleAnalytics;
