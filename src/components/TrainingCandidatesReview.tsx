
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, MessageSquare, Brain, Clock } from 'lucide-react';

interface TrainingCandidate {
  id: string;
  analysis_id: string;
  mensagem_original: string;
  contexto: string;
  tipo_resposta: string;
  confianca_admin: number;
  aprovado: boolean | null;
  motivo_aprovacao: string;
  qualidade_estimada: number;
  timestamp_original: string;
  created_at: string;
}

interface TrainingCandidatesReviewProps {
  onUpdate: () => void;
}

const TrainingCandidatesReview = ({ onUpdate }: TrainingCandidatesReviewProps) => {
  const [candidatos, setCandidatos] = useState<TrainingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [motivoAprovacao, setMotivoAprovacao] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const carregarCandidatos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_candidates')
        .select('*')
        .order('qualidade_estimada', { ascending: false });

      if (error) throw error;
      setCandidatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os candidatos de treinamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processarCandidato = async (candidatoId: string, aprovado: boolean) => {
    try {
      setProcessando(candidatoId);
      
      const motivo = motivoAprovacao[candidatoId] || '';
      
      const { error } = await supabase
        .from('training_candidates')
        .update({
          aprovado,
          motivo_aprovacao: motivo
        })
        .eq('id', candidatoId);

      if (error) throw error;

      // Se aprovado, adicionar à base de conhecimento do admin
      if (aprovado) {
        const candidato = candidatos.find(c => c.id === candidatoId);
        if (candidato) {
          await adicionarAoTreinamento(candidato);
        }
      }

      toast({
        title: aprovado ? "Candidato Aprovado" : "Candidato Rejeitado",
        description: aprovado 
          ? "Mensagem adicionada ao treinamento do bot."
          : "Mensagem marcada como rejeitada.",
      });

      carregarCandidatos();
      onUpdate();
    } catch (error) {
      console.error('Erro ao processar candidato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o candidato.",
        variant: "destructive",
      });
    } finally {
      setProcessando(null);
    }
  };

  const adicionarAoTreinamento = async (candidato: TrainingCandidate) => {
    try {
      // Adicionar à tabela de mensagens do admin
      const { error } = await supabase
        .from('admin_messages')
        .insert({
          admin_id: 'current_admin', // Substituir pelo ID real
          conteudo: candidato.mensagem_original,
          fonte: 'historico_aprovado',
          timestamp: candidato.timestamp_original
        });

      if (error) throw error;

      // Atualizar estatísticas da análise
      await atualizarEstatisticasAnalise(candidato.analysis_id, true);
    } catch (error) {
      console.error('Erro ao adicionar ao treinamento:', error);
    }
  };

  const atualizarEstatisticasAnalise = async (analysisId: string, aprovado: boolean) => {
    try {
      const campo = aprovado ? 'mensagens_aprovadas' : 'mensagens_rejeitadas';
      
      const { data: analise, error: errorGet } = await supabase
        .from('conversation_history_analysis')
        .select(campo)
        .eq('id', analysisId)
        .single();

      if (errorGet) throw errorGet;

      const novoValor = (analise[campo] || 0) + 1;

      const { error: errorUpdate } = await supabase
        .from('conversation_history_analysis')
        .update({ [campo]: novoValor })
        .eq('id', analysisId);

      if (errorUpdate) throw errorUpdate;
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  const aprovarTodosComAltaConfianca = async () => {
    try {
      const candidatosAltaConfianca = candidatos.filter(
        c => c.aprovado === null && c.confianca_admin >= 0.8
      );

      for (const candidato of candidatosAltaConfianca) {
        await processarCandidato(candidato.id, true);
      }

      toast({
        title: "Aprovação em Lote",
        description: `${candidatosAltaConfianca.length} candidatos com alta confiança foram aprovados.`,
      });
    } catch (error) {
      console.error('Erro na aprovação em lote:', error);
      toast({
        title: "Erro",
        description: "Erro na aprovação em lote.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (aprovado: boolean | null) => {
    if (aprovado === null) {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
    if (aprovado) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
  };

  const getConfiancaColor = (confianca: number) => {
    if (confianca >= 0.8) return 'text-green-600';
    if (confianca >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  useEffect(() => {
    carregarCandidatos();
  }, []);

  const candidatosPendentes = candidatos.filter(c => c.aprovado === null);
  const candidatosProcessados = candidatos.filter(c => c.aprovado !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Revisão de Candidatos de Treinamento
            </div>
            {candidatosPendentes.length > 0 && (
              <Button onClick={aprovarTodosComAltaConfianca} variant="outline" size="sm">
                Aprovar Alta Confiança ({candidatos.filter(c => c.aprovado === null && c.confianca_admin >= 0.8).length})
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Revise e aprove mensagens identificadas como possíveis exemplos do administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{candidatos.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{candidatosPendentes.length}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{candidatosProcessados.length}</div>
              <div className="text-sm text-gray-600">Processados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Candidatos Pendentes</h3>
        {loading ? (
          <div className="text-center py-8">Carregando candidatos...</div>
        ) : candidatosPendentes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum candidato pendente de revisão.
          </div>
        ) : (
          candidatosPendentes.map((candidato) => (
            <Card key={candidato.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(candidato.aprovado)}
                        <Badge variant="outline">{candidato.contexto}</Badge>
                        <Badge variant="outline">{candidato.tipo_resposta}</Badge>
                        <span className={`text-sm font-medium ${getConfiancaColor(candidato.confianca_admin)}`}>
                          {(candidato.confianca_admin * 100).toFixed(0)}% confiança
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-medium text-sm">Mensagem Original</span>
                        </div>
                        <p className="text-sm">{candidato.mensagem_original}</p>
                      </div>

                      <div className="text-xs text-gray-500">
                        Qualidade estimada: {(candidato.qualidade_estimada * 100).toFixed(0)}% • 
                        Data original: {formatarData(candidato.timestamp_original)}
                      </div>
                    </div>
                  </div>

                  {candidato.aprovado === null && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Motivo da aprovação/rejeição (opcional)"
                        value={motivoAprovacao[candidato.id] || ''}
                        onChange={(e) => setMotivoAprovacao(prev => ({
                          ...prev,
                          [candidato.id]: e.target.value
                        }))}
                        className="min-h-20"
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => processarCandidato(candidato.id, true)}
                          disabled={processando === candidato.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => processarCandidato(candidato.id, false)}
                          disabled={processando === candidato.id}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}

                  {candidato.motivo_aprovacao && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="text-sm font-medium">Motivo: </span>
                      <span className="text-sm">{candidato.motivo_aprovacao}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {candidatosProcessados.length > 0 && (
          <>
            <h3 className="text-lg font-medium mt-8">Candidatos Processados</h3>
            <div className="space-y-4">
              {candidatosProcessados.slice(0, 5).map((candidato) => (
                <Card key={candidato.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(candidato.aprovado)}
                        <span className="text-sm text-gray-600 truncate max-w-md">
                          {candidato.mensagem_original}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatarData(candidato.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingCandidatesReview;
