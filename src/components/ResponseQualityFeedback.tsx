
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, Star, TrendingUp, MessageSquare } from 'lucide-react';

interface ResponseFeedback {
  id: string;
  usuario_id: string;
  mensagem_enviada: string;
  feedback_tipo: string;
  contexto_conversa: string;
  timestamp_resposta: string;
  observacoes: string;
  created_at: string;
}

const ResponseQualityFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<ResponseFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    boas: 0,
    ruins: 0,
    excelentes: 0,
    qualidadeMedia: 0
  });
  const { toast } = useToast();

  const carregarFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('response_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
      calcularEstatisticas(data || []);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os feedbacks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (feedbacks: ResponseFeedback[]) => {
    const total = feedbacks.length;
    const boas = feedbacks.filter(f => f.feedback_tipo === 'boa').length;
    const ruins = feedbacks.filter(f => f.feedback_tipo === 'ruim').length;
    const excelentes = feedbacks.filter(f => f.feedback_tipo === 'excelente').length;

    // Calcular qualidade média (excelente=3, boa=2, ruim=1)
    const pontuacao = excelentes * 3 + boas * 2 + ruins * 1;
    const qualidadeMedia = total > 0 ? pontuacao / (total * 3) : 0;

    setEstatisticas({
      total,
      boas,
      ruins,
      excelentes,
      qualidadeMedia
    });
  };

  const adicionarFeedbackTeste = async (tipo: 'boa' | 'ruim' | 'excelente') => {
    try {
      const mensagemTeste = "Esta é uma mensagem de teste para demonstrar o feedback.";
      
      const { error } = await supabase
        .from('response_feedback')
        .insert({
          usuario_id: null, // Para teste, sem usuário específico
          mensagem_enviada: mensagemTeste,
          feedback_tipo: tipo,
          contexto_conversa: 'teste',
          timestamp_resposta: new Date().toISOString(),
          observacoes: `Feedback de teste - ${tipo}`
        });

      if (error) throw error;

      toast({
        title: "Feedback Adicionado",
        description: `Feedback de teste "${tipo}" foi registrado.`,
      });

      carregarFeedbacks();
    } catch (error) {
      console.error('Erro ao adicionar feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o feedback.",
        variant: "destructive",
      });
    }
  };

  const getFeedbackIcon = (tipo: string) => {
    switch (tipo) {
      case 'excelente': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'boa': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'ruim': return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getFeedbackColor = (tipo: string) => {
    switch (tipo) {
      case 'excelente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'boa': return 'bg-green-100 text-green-800 border-green-300';
      case 'ruim': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  useEffect(() => {
    carregarFeedbacks();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feedback de Qualidade das Respostas
          </CardTitle>
          <CardDescription>
            Monitore e analise a qualidade das respostas do bot baseado no feedback dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.excelentes}</div>
              <div className="text-sm text-gray-600">Excelentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estatisticas.boas}</div>
              <div className="text-sm text-gray-600">Boas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{estatisticas.ruins}</div>
              <div className="text-sm text-gray-600">Ruins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(estatisticas.qualidadeMedia * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Qualidade</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Adicionar Feedback de Teste</h4>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => adicionarFeedbackTeste('excelente')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Star className="h-4 w-4 mr-1" />
                Excelente
              </Button>
              <Button 
                size="sm" 
                onClick={() => adicionarFeedbackTeste('boa')}
                className="bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Boa
              </Button>
              <Button 
                size="sm" 
                onClick={() => adicionarFeedbackTeste('ruim')}
                variant="destructive"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Ruim
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Feedbacks</CardTitle>
          <CardDescription>
            Últimos feedbacks recebidos sobre as respostas do bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Carregando feedbacks...</div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum feedback registrado ainda. Use os botões acima para adicionar feedbacks de teste.
              </div>
            ) : (
              feedbacks.map((feedback) => (
                <Card key={feedback.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getFeedbackColor(feedback.feedback_tipo)}
                          >
                            {getFeedbackIcon(feedback.feedback_tipo)}
                            {feedback.feedback_tipo}
                          </Badge>
                          <Badge variant="outline">{feedback.contexto_conversa}</Badge>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-sm font-medium">Mensagem:</span>
                          <p className="text-sm mt-1">{feedback.mensagem_enviada}</p>
                        </div>

                        {feedback.observacoes && (
                          <div className="bg-blue-50 p-3 rounded">
                            <span className="text-sm font-medium">Observações:</span>
                            <p className="text-sm mt-1">{feedback.observacoes}</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Resposta enviada em: {formatarData(feedback.timestamp_resposta)} • 
                          Feedback registrado em: {formatarData(feedback.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {estatisticas.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights de Melhoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estatisticas.qualidadeMedia >= 0.8 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    🎉 Excelente! Sua qualidade está acima de 80%. Continue assim!
                  </p>
                </div>
              )}
              
              {estatisticas.qualidadeMedia < 0.6 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    ⚠️ A qualidade está abaixo de 60%. Considere revisar as respostas e treinar mais o bot.
                  </p>
                </div>
              )}

              {estatisticas.ruins > estatisticas.boas && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    📊 Há mais feedbacks negativos que positivos. Analise os padrões e melhore o treinamento.
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  💡 Use os feedbacks negativos para identificar contextos que precisam de mais treinamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResponseQualityFeedback;
