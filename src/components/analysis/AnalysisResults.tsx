
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Brain, History, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';

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

interface AnalysisResultsProps {
  analyses: AnalysisResult[];
  loading: boolean;
  onStartAnalysis: (days: string) => Promise<void>;
  analyzing: boolean;
}

const AnalysisResults = ({ analyses, loading, onStartAnalysis, analyzing }: AnalysisResultsProps) => {
  const [daysToAnalyze, setDaysToAnalyze] = useState('30');
  const { toast } = useToast();

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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

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
              onClick={() => onStartAnalysis(daysToAnalyze)} 
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
                  <div className="space-y-2 flex-1">
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
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Padrões Descobertos do Administrador
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📝 Saudações identificadas: {analise.padroes_descobertos.saudacoes?.length || 0}</p>
                          <p>💰 Respostas sobre preço: {analise.padroes_descobertos.respostas_preco?.length || 0}</p>
                          <p>📦 Respostas sobre produtos: {analise.padroes_descobertos.respostas_produto?.length || 0}</p>
                          <p>😊 Emojis usados: {Object.keys(analise.padroes_descobertos.emojis_usados || {}).slice(0, 5).join(' ')}</p>
                          
                          {analise.contextos_identificados && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium">Contextos Mais Comuns:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {analise.contextos_identificados.palavras_mais_usadas?.slice(0, 8).map((palavra: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {palavra}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
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
    </div>
  );
};

export default AnalysisResults;
