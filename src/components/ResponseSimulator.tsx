
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TestTube, Send, Bot, User, Zap } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface ResponseSimulatorProps {
  perfilAtivo: {
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
  };
}

const ResponseSimulator = ({ perfilAtivo }: ResponseSimulatorProps) => {
  const [mensagemTeste, setMensagemTeste] = useState('');
  const [respostaPadrao, setRespostaPadrao] = useState('');
  const [respostaComEstilo, setRespostaComEstilo] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);
  const [simulando, setSimulando] = useState(false);

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

  const simularResposta = async () => {
    if (!mensagemTeste.trim()) return;

    setSimulando(true);
    
    // Simula uma resposta padrão
    const respostaPadraoSimulada = "Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?";
    
    // Simula uma resposta com o estilo aprendido
    const respostaEstiloSimulada = aplicarEstilo(mensagemTeste, perfilAtivo);

    setRespostaPadrao(respostaPadraoSimulada);
    setRespostaComEstilo(respostaEstiloSimulada);

    // Adiciona ao histórico
    const novoTeste = {
      id: Date.now(),
      mensagem: mensagemTeste,
      respostaPadrao: respostaPadraoSimulada,
      respostaEstilo: respostaEstiloSimulada,
      timestamp: new Date().toLocaleString('pt-BR')
    };

    setHistorico(prev => [novoTeste, ...prev.slice(0, 4)]); // Mantém apenas os últimos 5
    setSimulando(false);
  };

  const aplicarEstilo = (mensagem: string, perfil: any) => {
    // Simulação simples de aplicação de estilo
    let resposta = "Olá! Obrigado por entrar em contato.";
    
    if (perfil.tom_comunicacao?.includes('informal') || perfil.tom_comunicacao?.includes('descontraído')) {
      resposta = "Oi! Valeu por falar comigo.";
    }
    
    if (perfil.emojis_frequentes?.length > 0) {
      resposta += ` ${perfil.emojis_frequentes[0]}`;
    }
    
    if (perfil.vocabulario_caracteristico?.length > 0) {
      const expressao = perfil.vocabulario_caracteristico[0];
      resposta += ` ${expressao}`;
    }
    
    resposta += " Como posso te ajudar?";
    return resposta;
  };

  const limparHistorico = () => {
    setHistorico([]);
    setMensagemTeste('');
    setRespostaPadrao('');
    setRespostaComEstilo('');
  };

  const palavrasFrequentesLista = getPalavrasFrequentes(perfilAtivo.palavras_frequentes);

  return (
    <div className="space-y-6">
      {/* Simulador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Simulador de Resposta
          </CardTitle>
          <CardDescription>
            Teste como o bot responderia com e sem o estilo aprendido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem de Teste</label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma mensagem para testar..."
                value={mensagemTeste}
                onChange={(e) => setMensagemTeste(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && simularResposta()}
              />
              <Button onClick={simularResposta} disabled={!mensagemTeste.trim() || simulando}>
                <Send className="h-4 w-4 mr-2" />
                {simulando ? 'Simulando...' : 'Simular'}
              </Button>
            </div>
          </div>

          {(respostaPadrao || respostaComEstilo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Resposta Padrão */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="font-medium">Resposta Padrão</span>
                  <Badge variant="secondary">Sem Estilo</Badge>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm">{respostaPadrao}</p>
                </div>
              </div>

              {/* Resposta com Estilo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Com Estilo Aprendido</span>
                  <Badge variant="default">Personalizado</Badge>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm">{respostaComEstilo}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Testes */}
      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Histórico de Testes</span>
              <Button variant="outline" size="sm" onClick={limparHistorico}>
                Limpar Histórico
              </Button>
            </CardTitle>
            <CardDescription>
              Últimos testes realizados no simulador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historico.map((teste) => (
                <div key={teste.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Mensagem:</span>
                    <span>{teste.mensagem}</span>
                    <Badge variant="outline" className="ml-auto">{teste.timestamp}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Bot className="h-4 w-4" />
                        <span className="font-medium">Padrão:</span>
                      </div>
                      <p className="text-sm bg-gray-50 p-2 rounded">{teste.respostaPadrao}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Com Estilo:</span>
                      </div>
                      <p className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-500">{teste.respostaEstilo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre o Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Características do Perfil Ativo</CardTitle>
          <CardDescription>
            Elementos que influenciam as respostas personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Tom de Comunicação</h4>
              <Badge variant="outline">{perfilAtivo.tom_comunicacao || 'Não definido'}</Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Emojis Frequentes</h4>
              <div className="flex gap-1">
                {perfilAtivo.emojis_frequentes?.slice(0, 5).map((emoji: string, index: number) => (
                  <span key={index} className="text-lg">{emoji}</span>
                )) || <span className="text-gray-500 text-sm">Nenhum</span>}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Palavras Características</h4>
              <div className="flex flex-wrap gap-1">
                {palavrasFrequentesLista.slice(0, 3).map((palavra: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">{palavra}</Badge>
                )) || <span className="text-gray-500 text-sm">Nenhuma</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseSimulator;
