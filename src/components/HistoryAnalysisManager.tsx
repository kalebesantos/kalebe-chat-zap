
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Brain, History, TrendingUp, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import TrainingCandidatesReview from './TrainingCandidatesReview';
import ContextualLearning from './ContextualLearning';
import ResponseQualityFeedback from './ResponseQualityFeedback';

interface AnalysisResult {
  id: string;
  admin_id: string;
  periodo_inicio: string;
  periodo_fim: string;
  total_mensagens_analisadas: number;
  mensagens_aprovadas: number;
  mensagens_rejeitadas: number;
  contextos_identificados: any;
  padroes_descobertos: any;
  qualidade_geral: number;
  status: string;
  created_at: string;
}

const HistoryAnalysisManager = () => {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [daysToAnalyze, setDaysToAnalyze] = useState('30');
  const { toast } = useToast();

  const carregarAnalises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversation_history_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as análises do histórico.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analisarHistorico = async () => {
    try {
      setAnalyzing(true);
      
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(daysToAnalyze));

      // Buscar mensagens do período
      const { data: mensagens, error: errorMensagens } = await supabase
        .from('mensagens')
        .select('*')
        .gte('timestamp', dataInicio.toISOString())
        .lte('timestamp', dataFim.toISOString());

      if (errorMensagens) throw errorMensagens;

      // Criar nova análise
      const { data: analise, error: errorAnalise } = await supabase
        .from('conversation_history_analysis')
        .insert({
          admin_id: 'current_admin', // Substituir pelo ID real do admin
          periodo_inicio: dataInicio.toISOString(),
          periodo_fim: dataFim.toISOString(),
          total_mensagens_analisadas: mensagens?.length || 0,
          status: 'processando'
        })
        .select()
        .single();

      if (errorAnalise) throw errorAnalise;

      // Processar mensagens e identificar candidatos
      await processarMensagensParaTreinamento(mensagens || [], analise.id);

      toast({
        title: "Análise Iniciada",
        description: `Processando ${mensagens?.length || 0} mensagens dos últimos ${daysToAnalyze} dias.`,
      });

      carregarAnalises();
    } catch (error) {
      console.error('Erro ao iniciar análise:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a análise do histórico.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const processarMensagensParaTreinamento = async (mensagens: any[], analysisId: string) => {
    const candidatos = [];

    for (const mensagem of mensagens) {
      // Algoritmo simples para identificar se é mensagem do admin
      const confiancaAdmin = calcularConfiancaAdmin(mensagem.mensagem_recebida);
      
      if (confiancaAdmin > 0.6) { // Threshold para considerar como possível mensagem do admin
        candidatos.push({
          analysis_id: analysisId,
          mensagem_original: mensagem.mensagem_recebida,
          contexto: identificarContexto(mensagem),
          tipo_resposta: classificarTipoResposta(mensagem.mensagem_recebida),
          confianca_admin: confiancaAdmin,
          qualidade_estimada: avaliarQualidade(mensagem),
          timestamp_original: mensagem.timestamp
        });
      }
    }

    if (candidatos.length > 0) {
      const { error } = await supabase
        .from('training_candidates')
        .insert(candidatos);

      if (error) {
        console.error('Erro ao inserir candidatos:', error);
      }
    }

    // Atualizar status da análise
    await supabase
      .from('conversation_history_analysis')
      .update({
        status: 'concluído',
        contextos_identificados: extrairContextos(mensagens),
        padroes_descobertos: descobrirPadroes(mensagens),
        qualidade_geral: calcularQualidadeGeral(candidatos)
      })
      .eq('id', analysisId);
  };

  const calcularConfiancaAdmin = (mensagem: string): number => {
    // Algoritmo simples baseado em características típicas de admin
    let pontuacao = 0;
    
    // Mensagens mais longas tendem a ser do admin
    if (mensagem.length > 50) pontuacao += 0.2;
    
    // Presença de palavras técnicas ou formais
    const palavrasAdmin = ['obrigado', 'disponível', 'ajudar', 'empresa', 'serviço', 'produto'];
    const palavrasEncontradas = palavrasAdmin.filter(palavra => 
      mensagem.toLowerCase().includes(palavra)
    ).length;
    pontuacao += (palavrasEncontradas / palavrasAdmin.length) * 0.4;
    
    // Estrutura formal (pontuação, maiúsculas)
    if (/[.!?]/.test(mensagem)) pontuacao += 0.2;
    if (/^[A-Z]/.test(mensagem)) pontuacao += 0.2;
    
    return Math.min(pontuacao, 1);
  };

  const identificarContexto = (mensagem: any): string => {
    const texto = mensagem.mensagem_enviada.toLowerCase();
    
    if (texto.includes('olá') || texto.includes('oi')) return 'saudacao';
    if (texto.includes('tchau') || texto.includes('obrigado')) return 'despedida';
    if (texto.includes('preço') || texto.includes('valor')) return 'preco';
    if (texto.includes('produto') || texto.includes('serviço')) return 'produto';
    
    return 'geral';
  };

  const classificarTipoResposta = (mensagem: string): string => {
    if (mensagem.includes('?')) return 'pergunta';
    if (mensagem.includes('!')) return 'exclamacao';
    if (mensagem.length < 20) return 'curta';
    return 'informativa';
  };

  const avaliarQualidade = (mensagem: any): number => {
    // Pontuação baseada em características de qualidade
    let qualidade = 0.5; // Base
    
    // Mensagens mais elaboradas tendem a ser melhores
    if (mensagem.mensagem_recebida.length > 30) qualidade += 0.2;
    
    // Presença de emoji pode indicar naturalidade
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(mensagem.mensagem_recebida)) {
      qualidade += 0.2;
    }
    
    // Boa estrutura
    if (/^[A-Z].*[.!?]$/.test(mensagem.mensagem_recebida.trim())) {
      qualidade += 0.1;
    }
    
    return Math.min(qualidade, 1);
  };

  const extrairContextos = (mensagens: any[]) => {
    const contextos = {};
    mensagens.forEach(msg => {
      const contexto = identificarContexto(msg);
      contextos[contexto] = (contextos[contexto] || 0) + 1;
    });
    return contextos;
  };

  const descobrirPadroes = (mensagens: any[]) => {
    // Análise simples de padrões
    const horarios = mensagens.map(msg => new Date(msg.timestamp).getHours());
    const horariosFrequentes = horarios.reduce((acc, hora) => {
      acc[hora] = (acc[hora] || 0) + 1;
      return acc;
    }, {});

    return {
      horarios_ativos: horariosFrequentes,
      total_conversas: mensagens.length,
      periodo_mais_ativo: Object.keys(horariosFrequentes).reduce((a, b) => 
        horariosFrequentes[a] > horariosFrequentes[b] ? a : b
      )
    };
  };

  const calcularQualidadeGeral = (candidatos: any[]): number => {
    if (candidatos.length === 0) return 0;
    
    const somaQualidade = candidatos.reduce((soma, candidato) => 
      soma + (candidato.qualidade_estimada || 0), 0
    );
    
    return somaQualidade / candidatos.length;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processando': return 'bg-yellow-500';
      case 'concluído': return 'bg-green-500';
      case 'erro': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processando': return <Clock className="h-4 w-4" />;
      case 'concluído': return <CheckCircle className="h-4 w-4" />;
      case 'erro': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    carregarAnalises();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise Automática do Histórico
          </CardTitle>
          <CardDescription>
            Analise conversas antigas para identificar padrões e melhorar as respostas do bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dias para Analisar</label>
              <Input
                type="number"
                value={daysToAnalyze}
                onChange={(e) => setDaysToAnalyze(e.target.value)}
                placeholder="30"
                className="w-32"
                min="1"
                max="365"
              />
            </div>
            <Button 
              onClick={analisarHistorico} 
              disabled={analyzing}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              {analyzing ? 'Analisando...' : 'Iniciar Análise'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resultados" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
          <TabsTrigger value="contextos">Contextos</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="resultados" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">Carregando análises...</div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma análise encontrada. Inicie uma nova análise acima.
              </div>
            ) : (
              analyses.map((analise) => (
                <Card key={analise.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getStatusColor(analise.status)} text-white`}>
                            {getStatusIcon(analise.status)}
                            {analise.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatarData(analise.created_at)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {analise.total_mensagens_analisadas}
                            </div>
                            <div className="text-sm text-gray-600">Mensagens</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {analise.mensagens_aprovadas}
                            </div>
                            <div className="text-sm text-gray-600">Aprovadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {analise.mensagens_rejeitadas}
                            </div>
                            <div className="text-sm text-gray-600">Rejeitadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {analise.qualidade_geral ? `${(analise.qualidade_geral * 100).toFixed(0)}%` : '-'}
                            </div>
                            <div className="text-sm text-gray-600">Qualidade</div>
                          </div>
                        </div>

                        {analise.padroes_descobertos && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Padrões Descobertos</h4>
                            <div className="text-sm text-gray-600">
                              <p>Total de conversas: {analise.padroes_descobertos.total_conversas}</p>
                              <p>Período mais ativo: {analise.padroes_descobertos.periodo_mais_ativo}h</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="candidatos">
          <TrainingCandidatesReview onUpdate={carregarAnalises} />
        </TabsContent>

        <TabsContent value="contextos">
          <ContextualLearning />
        </TabsContent>

        <TabsContent value="feedback">
          <ResponseQualityFeedback />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryAnalysisManager;
