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

      // Buscar TODAS as mensagens do período para análise completa
      const { data: mensagens, error: errorMensagens } = await supabase
        .from('mensagens')
        .select(`
          *,
          usuarios:usuario_id (
            numero_whatsapp,
            nome
          )
        `)
        .gte('timestamp', dataInicio.toISOString())
        .lte('timestamp', dataFim.toISOString())
        .order('timestamp', { ascending: true });

      if (errorMensagens) throw errorMensagens;

      // Buscar número do administrador ativo
      const { data: adminConfig, error: adminError } = await supabase
        .from('admin_config')
        .select('numero_whatsapp')
        .order('criado_em', { ascending: false })
        .limit(1);

      if (adminError) throw adminError;

      const adminNumero = adminConfig?.[0]?.numero_whatsapp;
      if (!adminNumero) {
        toast({
          title: "Erro",
          description: "Número do administrador não encontrado. Configure primeiro.",
          variant: "destructive",
        });
        return;
      }

      // Criar nova análise
      const { data: analise, error: errorAnalise } = await supabase
        .from('conversation_history_analysis')
        .insert({
          admin_id: adminNumero,
          periodo_inicio: dataInicio.toISOString(),
          periodo_fim: dataFim.toISOString(),
          total_mensagens_analisadas: mensagens?.length || 0,
          status: 'processando'
        })
        .select()
        .single();

      if (errorAnalise) throw errorAnalise;

      // Processar mensagens e identificar padrões do administrador
      await processarMensagensDoAdmin(mensagens || [], analise.id, adminNumero);

      toast({
        title: "Análise Iniciada",
        description: `Processando ${mensagens?.length || 0} mensagens para aprender padrões do administrador.`,
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

  const processarMensagensDoAdmin = async (mensagens: any[], analysisId: string, adminNumero: string) => {
    const candidatosAdmin = [];
    const padroesEncontrados = {
      saudacoes: [],
      despedidas: [],
      respostas_preco: [],
      respostas_produto: [],
      tom_geral: [],
      palavras_frequentes: {},
      emojis_usados: {},
      horarios_ativos: {}
    };

    // Filtrar mensagens onde o bot respondeu (mensagem_enviada)
    // e analisar se seguem padrão do administrador
    for (const mensagem of mensagens) {
      if (mensagem.mensagem_enviada && mensagem.usuarios?.numero_whatsapp) {
        const conteudo = mensagem.mensagem_enviada;
        const contexto = identificarContextoDetalhado(mensagem.mensagem_recebida, conteudo);
        
        // Analisar se a resposta parece ter sido feita por administrador
        const confiancaAdmin = analisarSePareceMensagemAdmin(conteudo);
        
        if (confiancaAdmin > 0.4) { // Threshold mais baixo para capturar mais padrões
          candidatosAdmin.push({
            analysis_id: analysisId,
            mensagem_original: conteudo,
            contexto: contexto.tipo,
            tipo_resposta: classificarTipoResposta(conteudo),
            confianca_admin: confiancaAdmin,
            qualidade_estimada: avaliarQualidadeMensagem(conteudo),
            timestamp_original: mensagem.timestamp
          });

          // Coletar padrões para análise
          coletarPadroesMensagem(conteudo, contexto, padroesEncontrados);
        }
      }
    }

    // Salvar candidatos identificados
    if (candidatosAdmin.length > 0) {
      const { error } = await supabase
        .from('training_candidates')
        .insert(candidatosAdmin);

      if (error) {
        console.error('Erro ao inserir candidatos:', error);
      }

      // Adicionar automaticamente as melhores mensagens para o perfil do admin
      const melhoresMensagens = candidatosAdmin
        .filter(c => c.confianca_admin > 0.7 && c.qualidade_estimada > 0.6)
        .slice(0, 20); // Pegar as 20 melhores

      for (const msg of melhoresMensagens) {
        await supabase.from('admin_messages').insert({
          admin_id: adminNumero,
          conteudo: msg.mensagem_original,
          fonte: 'analise_automatica',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Atualizar análise com padrões descobertos
    await supabase
      .from('conversation_history_analysis')
      .update({
        status: 'concluído',
        mensagens_aprovadas: candidatosAdmin.filter(c => c.confianca_admin > 0.7).length,
        contextos_identificados: extrairContextosEncontrados(padroesEncontrados),
        padroes_descobertos: padroesEncontrados,
        qualidade_geral: calcularQualidadeGeral(candidatosAdmin)
      })
      .eq('id', analysisId);
  };

  const analisarSePareceMensagemAdmin = (mensagem: string): number => {
    let pontuacao = 0.3; // Base
    
    // Características de administrador
    const indicadoresAdmin = [
      /\b(obrigado|obrigada|agradeço)\b/i,
      /\b(disponível|ajudar|atender)\b/i,
      /\b(empresa|negócio|serviço)\b/i,
      /\b(produto|item|mercadoria)\b/i,
      /\b(preço|valor|custo|investimento)\b/i,
      /\b(qualidade|garantia|confiança)\b/i,
      /\b(experiência|anos|tempo)\b/i,
      /\b(cliente|clientela|atendimento)\b/i
    ];

    indicadoresAdmin.forEach(regex => {
      if (regex.test(mensagem)) pontuacao += 0.1;
    });

    // Estrutura profissional
    if (/^[A-Z]/.test(mensagem)) pontuacao += 0.1;
    if (/[.!?]$/.test(mensagem.trim())) pontuacao += 0.1;
    if (mensagem.length > 20 && mensagem.length < 200) pontuacao += 0.1;
    
    // Presença de emojis apropriados
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{2600}-\u{26FF}]/u.test(mensagem)) {
      pontuacao += 0.1;
    }

    return Math.min(pontuacao, 1);
  };

  const identificarContextoDetalhado = (pergunta: string, resposta: string) => {
    const perguntaLower = pergunta?.toLowerCase() || '';
    const respostaLower = resposta?.toLowerCase() || '';
    
    if (perguntaLower.includes('olá') || perguntaLower.includes('oi') || perguntaLower.includes('bom dia')) {
      return { tipo: 'saudacao', detalhes: 'inicial' };
    }
    if (perguntaLower.includes('preço') || perguntaLower.includes('valor') || perguntaLower.includes('quanto')) {
      return { tipo: 'preco', detalhes: 'consulta_valor' };
    }
    if (perguntaLower.includes('produto') || perguntaLower.includes('tem') || perguntaLower.includes('vende')) {
      return { tipo: 'produto', detalhes: 'disponibilidade' };
    }
    if (perguntaLower.includes('tchau') || perguntaLower.includes('obrigad') || perguntaLower.includes('bye')) {
      return { tipo: 'despedida', detalhes: 'final' };
    }
    
    return { tipo: 'geral', detalhes: 'conversa_comum' };
  };

  const coletarPadroesMensagem = (mensagem: string, contexto: any, padroes: any) => {
    // Coletar palavras frequentes
    const palavras = mensagem.toLowerCase().split(/\s+/);
    palavras.forEach(palavra => {
      if (palavra.length > 3) {
        padroes.palavras_frequentes[palavra] = (padroes.palavras_frequentes[palavra] || 0) + 1;
      }
    });

    // Coletar emojis
    const emojis = mensagem.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{2600}-\u{26FF}]/gu);
    if (emojis) {
      emojis.forEach(emoji => {
        padroes.emojis_usados[emoji] = (padroes.emojis_usados[emoji] || 0) + 1;
      });
    }

    // Categorizar por contexto
    switch (contexto.tipo) {
      case 'saudacao':
        padroes.saudacoes.push(mensagem);
        break;
      case 'despedida':
        padroes.despedidas.push(mensagem);
        break;
      case 'preco':
        padroes.respostas_preco.push(mensagem);
        break;
      case 'produto':
        padroes.respostas_produto.push(mensagem);
        break;
      default:
        padroes.tom_geral.push(mensagem);
    }
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

  const avaliarQualidadeMensagem = (mensagem: string): number => {
    let qualidade = 0.5;
    
    if (mensagem.length > 15 && mensagem.length < 300) qualidade += 0.2;
    if (/^[A-Z].*[.!?]$/.test(mensagem.trim())) qualidade += 0.2;
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/u.test(mensagem)) qualidade += 0.1;
    
    return Math.min(qualidade, 1);
  };

  const extrairContextosEncontrados = (padroes: any) => {
    return {
      total_saudacoes: padroes.saudacoes.length,
      total_despedidas: padroes.despedidas.length,
      total_respostas_preco: padroes.respostas_preco.length,
      total_respostas_produto: padroes.respostas_produto.length,
      palavras_mais_usadas: Object.entries(padroes.palavras_frequentes)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([palavra]) => palavra),
      emojis_favoritos: Object.entries(padroes.emojis_usados)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([emoji]) => emoji)
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
            Analise conversas antigas para identificar padrões do administrador e treinar automaticamente o bot
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
              {analyzing ? 'Analisando Padrões...' : 'Iniciar Análise Inteligente'}
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            💡 A análise inteligente irá identificar automaticamente mensagens que seguem o padrão do administrador e adicioná-las ao treinamento
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
                            <h4 className="font-medium text-sm mb-2">Padrões Descobertos do Administrador</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📝 Saudações identificadas: {analise.padroes_descobertos.saudacoes?.length || 0}</p>
                              <p>💰 Respostas sobre preço: {analise.padroes_descobertos.respostas_preco?.length || 0}</p>
                              <p>📦 Respostas sobre produtos: {analise.padroes_descobertos.respostas_produto?.length || 0}</p>
                              <p>😊 Emojis usados: {Object.keys(analise.padroes_descobertos.emojis_usados || {}).slice(0, 5).join(' ')}</p>
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
