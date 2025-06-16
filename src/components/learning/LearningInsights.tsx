
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageSquare, TrendingUp, Target } from 'lucide-react';
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

interface LearningInsightsProps {
  perfil: PerfilEstilo;
}

const LearningInsights = ({ perfil }: LearningInsightsProps) => {
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

  const palavrasFrequentesLista = getPalavrasFrequentes(perfil.palavras_frequentes);

  const insights = [
    {
      titulo: "Padrões de Comunicação Aprendidos",
      icone: <Brain className="h-5 w-5" />,
      items: [
        `Tom identificado: ${perfil.tom_comunicacao || 'Analisando...'}`,
        `Vocabulário característico: ${perfil.vocabulario_caracteristico?.length || 0} expressões`,
        `Emojis favoritos: ${perfil.emojis_frequentes?.length || 0} identificados`,
        `Palavras frequentes: ${palavrasFrequentesLista.length} catalogadas`
      ]
    },
    {
      titulo: "Qualidade do Aprendizado",
      icone: <TrendingUp className="h-5 w-5" />,
      items: [
        `${perfil.total_mensagens} mensagens analisadas`,
        `Perfil ${perfil.ativo ? 'ativo' : 'inativo'} no momento`,
        `Última atualização: ${new Date(perfil.ultima_atualizacao).toLocaleDateString('pt-BR')}`,
        `Exemplos coletados: ${perfil.exemplos_mensagens?.length || 0}`
      ]
    },
    {
      titulo: "Como a IA Responde Agora",
      icone: <Target className="h-5 w-5" />,
      items: [
        "Imita o tom de voz do administrador",
        "Usa as expressões características identificadas",
        "Aplica emojis no mesmo padrão",
        "Mantém o estilo de comunicação pessoal"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            O que a IA Aprendeu sobre {perfil.nome_admin || perfil.admin_id}
          </CardTitle>
          <CardDescription>
            Análise detalhada dos padrões de comunicação identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Resumo do Estilo Aprendido</h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              {perfil.estilo_resumo || 'A IA ainda está coletando dados suficientes para gerar um resumo completo do estilo de comunicação.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {insight.icone}
                    {insight.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insight.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Exemplos Práticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vocabulário Característico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {perfil.vocabulario_caracteristico?.slice(0, 8).map((expressao, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  "{expressao}"
                </Badge>
              )) || <p className="text-gray-500 text-sm">Coletando expressões características...</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Palavras Mais Usadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {palavrasFrequentesLista.slice(0, 12).map((palavra, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {palavra}
                </Badge>
              )) || <p className="text-gray-500 text-sm">Analisando frequência de palavras...</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emojis Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {perfil.emojis_frequentes?.slice(0, 8).map((emoji, index) => (
                <span key={index} className="text-2xl p-2 bg-gray-100 rounded-lg">
                  {emoji}
                </span>
              )) || <p className="text-gray-500 text-sm">Identificando padrões de emojis...</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas de Aprendizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mensagens Analisadas</span>
                <Badge variant="default">{perfil.total_mensagens}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expressões Únicas</span>
                <Badge variant="default">{perfil.vocabulario_caracteristico?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Emojis Catalogados</span>
                <Badge variant="default">{perfil.emojis_frequentes?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status do Perfil</span>
                <Badge variant={perfil.ativo ? "default" : "secondary"}>
                  {perfil.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningInsights;
