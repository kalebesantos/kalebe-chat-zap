
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, BarChart3, MessageSquare, TestTube, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import LearningInsights from './learning/LearningInsights';
import StyleAnalytics from './StyleAnalytics';
import TrainingMessages from './TrainingMessages';
import ResponseSimulator from './ResponseSimulator';
import StyleEvolution from './StyleEvolution';
import type { Json } from '@/integrations/supabase/types';

interface PerfilEstilo {
  id: string;
  admin_id: string;
  nome_admin: string | null;
  estilo_resumo: string | null;
  tom_comunicacao: string | null;
  ativo: boolean;
  total_mensagens: number;
  ultima_atualizacao: string;
  palavras_frequentes: Json | null;
  emojis_frequentes: string[] | null;
  vocabulario_caracteristico: string[] | null;
  exemplos_mensagens: string[] | null;
}

const LearningProfileDashboard = () => {
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilEstilo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();

  const buscarPerfilAtivo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_style_profiles')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;
      setPerfilAtivo(data);
    } catch (error) {
      console.error('Erro ao buscar perfil ativo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil de aprendizado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarPerfilAtivo();
  }, []);

  // Helper function to safely get palavras frequentes
  const getPalavrasFrequentes = (palavras: Json | null): string[] => {
    if (!palavras) return [];
    if (typeof palavras === 'object' && palavras !== null && 'lista' in palavras) {
      const lista = (palavras as { lista: unknown }).lista;
      if (Array.isArray(lista)) {
        return lista.filter((item): item is string => typeof item === 'string');
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando perfil de aprendizado...</p>
        </div>
      </div>
    );
  }

  if (!perfilAtivo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Perfil de Aprendizado
          </CardTitle>
          <CardDescription>
            Nenhum perfil de estilo está ativo no momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            Ative um perfil de estilo na aba "Estilo IA" para visualizar o aprendizado do bot.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const palavrasFrequentesLista = getPalavrasFrequentes(perfilAtivo.palavras_frequentes);

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Perfil de Aprendizado - {perfilAtivo.nome_admin || perfilAtivo.admin_id}
            </div>
            <Badge variant="default" className="bg-green-600">
              Ativo
            </Badge>
          </CardTitle>
          <CardDescription>
            Análise detalhada do estilo de comunicação aprendido pelo bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{perfilAtivo.total_mensagens}</div>
              <div className="text-sm text-gray-600">Mensagens Analisadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {palavrasFrequentesLista.length}
              </div>
              <div className="text-sm text-gray-600">Palavras Frequentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {perfilAtivo.emojis_frequentes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Emojis Identificados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {perfilAtivo.vocabulario_caracteristico?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Expressões Únicas</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Resumo do Estilo</h4>
            <p className="text-sm text-gray-700">
              {perfilAtivo.estilo_resumo || 'Ainda não há resumo disponível para este perfil.'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">{perfilAtivo.tom_comunicacao || 'Tom não definido'}</Badge>
              <span className="text-xs text-gray-500">
                Última atualização: {formatarData(perfilAtivo.ultima_atualizacao)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Análise */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Treinamento
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolução
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <LearningInsights perfil={perfilAtivo} />
        </TabsContent>

        <TabsContent value="analytics">
          <StyleAnalytics perfilId={perfilAtivo.id} adminId={perfilAtivo.admin_id} />
        </TabsContent>

        <TabsContent value="training">
          <TrainingMessages adminId={perfilAtivo.admin_id} onUpdate={buscarPerfilAtivo} />
        </TabsContent>

        <TabsContent value="simulator">
          <ResponseSimulator perfilAtivo={perfilAtivo} />
        </TabsContent>

        <TabsContent value="evolution">
          <StyleEvolution adminId={perfilAtivo.admin_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningProfileDashboard;
