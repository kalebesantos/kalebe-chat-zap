
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, MessageSquare, BarChart3 } from 'lucide-react';

interface StyleEvolutionProps {
  adminId: string;
}

const StyleEvolution = ({ adminId }: StyleEvolutionProps) => {
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const buscarDadosEvolucao = async () => {
    try {
      // Busca mensagens agrupadas por mês
      const { data: mensagens, error } = await supabase
        .from('admin_messages')
        .select('conteudo, timestamp, fonte')
        .eq('admin_id', adminId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Agrupa mensagens por mês e calcula métricas
      const dadosPorMes = agruparPorMes(mensagens || []);
      setEvolutionData(dadosPorMes);
    } catch (error) {
      console.error('Erro ao buscar dados de evolução:', error);
    } finally {
      setLoading(false);
    }
  };

  const agruparPorMes = (mensagens: any[]) => {
    const grupos: { [key: string]: any } = {};

    mensagens.forEach(msg => {
      const data = new Date(msg.timestamp);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grupos[chave]) {
        grupos[chave] = {
          mes: chave,
          totalMensagens: 0,
          tamanhoMedio: 0,
          palavrasUnicas: new Set(),
          fontes: { manual: 0, whatsapp_export: 0, sistema: 0 }
        };
      }

      grupos[chave].totalMensagens++;
      grupos[chave].tamanhoMedio += msg.conteudo.length;
      grupos[chave].fontes[msg.fonte] = (grupos[chave].fontes[msg.fonte] || 0) + 1;

      // Adiciona palavras únicas
      const palavras = msg.conteudo.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((p: string) => p.length > 2);
      
      palavras.forEach((palavra: string) => grupos[chave].palavrasUnicas.add(palavra));
    });

    // Converte para array e calcula médias
    return Object.values(grupos).map((grupo: any) => ({
      ...grupo,
      tamanhoMedio: Math.round(grupo.tamanhoMedio / grupo.totalMensagens),
      palavrasUnicas: grupo.palavrasUnicas.size,
      mesFormatado: formatarMes(grupo.mes)
    }));
  };

  const formatarMes = (mes: string) => {
    const [ano, mesNum] = mes.split('-');
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${meses[parseInt(mesNum) - 1]} ${ano}`;
  };

  useEffect(() => {
    buscarDadosEvolucao();
  }, [adminId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        Carregando dados de evolução...
      </div>
    );
  }

  if (evolutionData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Dados insuficientes para mostrar evolução</p>
          <p className="text-sm text-gray-400">Adicione mais mensagens ao longo do tempo</p>
        </CardContent>
      </Card>
    );
  }

  const totalMensagens = evolutionData.reduce((sum, item) => sum + item.totalMensagens, 0);
  const mediaComprimento = Math.round(
    evolutionData.reduce((sum, item) => sum + item.tamanhoMedio, 0) / evolutionData.length
  );
  const totalPalavrasUnicas = Math.max(...evolutionData.map(item => item.palavrasUnicas));

  return (
    <div className="space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{evolutionData.length}</div>
            <div className="text-sm text-gray-600">Meses de Dados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalMensagens}</div>
            <div className="text-sm text-gray-600">Total de Mensagens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalPalavrasUnicas}</div>
            <div className="text-sm text-gray-600">Vocabulário Máximo</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evolução do Volume de Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Volume de Mensagens
            </CardTitle>
            <CardDescription>
              Quantidade de mensagens adicionadas por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolutionData}>
                  <XAxis dataKey="mesFormatado" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="totalMensagens" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Evolução do Tamanho Médio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tamanho Médio das Mensagens
            </CardTitle>
            <CardDescription>
              Comprimento médio do texto por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <XAxis dataKey="mesFormatado" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="tamanhoMedio" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Evolução do Vocabulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Expansão do Vocabulário
            </CardTitle>
            <CardDescription>
              Palavras únicas identificadas por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolutionData}>
                  <XAxis dataKey="mesFormatado" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="palavrasUnicas" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Progresso Geral */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Progresso</CardTitle>
            <CardDescription>
              Insights sobre a evolução do aprendizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tendências Identificadas</h4>
              <div className="space-y-2">
                {evolutionData.length >= 2 && (
                  <>
                    {evolutionData[evolutionData.length - 1].totalMensagens > evolutionData[0].totalMensagens ? (
                      <Badge variant="default" className="bg-green-600">
                        📈 Volume crescente de treinamento
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        📉 Volume de treinamento estável
                      </Badge>
                    )}
                    
                    {evolutionData[evolutionData.length - 1].palavrasUnicas > evolutionData[0].palavrasUnicas ? (
                      <Badge variant="default" className="bg-blue-600">
                        🔤 Vocabulário em expansão
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        🔤 Vocabulário estabilizado
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Próximos Passos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Continue adicionando mensagens regularmente</li>
                <li>• Varie os tipos de situações e contextos</li>
                <li>• Monitore a qualidade das respostas geradas</li>
                <li>• Ajuste o perfil conforme necessário</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StyleEvolution;
