
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Settings, Trash2, MessageSquare, Tag } from 'lucide-react';

interface ConversationContext {
  id: string;
  admin_id: string;
  tipo_contexto: string;
  descricao: string;
  palavras_chave: string[];
  respostas_padrao: string[];
  ativo: boolean;
  created_at: string;
}

const ContextualLearning = () => {
  const [contextos, setContextos] = useState<ConversationContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<ConversationContext | null>(null);
  const [novoContexto, setNovoContexto] = useState({
    tipo_contexto: '',
    descricao: '',
    palavras_chave: '',
    respostas_padrao: ''
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const { toast } = useToast();

  const carregarContextos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversation_contexts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContextos(data || []);
    } catch (error) {
      console.error('Erro ao carregar contextos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contextos de conversa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarContexto = async () => {
    try {
      const dados = {
        admin_id: 'current_admin', // Substituir pelo ID real
        tipo_contexto: novoContexto.tipo_contexto,
        descricao: novoContexto.descricao,
        palavras_chave: novoContexto.palavras_chave.split(',').map(p => p.trim()).filter(p => p),
        respostas_padrao: novoContexto.respostas_padrao.split('\n').filter(r => r.trim()),
        ativo: true
      };

      if (editando) {
        const { error } = await supabase
          .from('conversation_contexts')
          .update(dados)
          .eq('id', editando.id);

        if (error) throw error;

        toast({
          title: "Contexto Atualizado",
          description: "As configurações do contexto foram atualizadas.",
        });
      } else {
        const { error } = await supabase
          .from('conversation_contexts')
          .insert(dados);

        if (error) throw error;

        toast({
          title: "Contexto Criado",
          description: "Novo contexto de conversa foi criado com sucesso.",
        });
      }

      setNovoContexto({
        tipo_contexto: '',
        descricao: '',
        palavras_chave: '',
        respostas_padrao: ''
      });
      setEditando(null);
      setDialogAberto(false);
      carregarContextos();
    } catch (error) {
      console.error('Erro ao salvar contexto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o contexto.",
        variant: "destructive",
      });
    }
  };

  const editarContexto = (contexto: ConversationContext) => {
    setEditando(contexto);
    setNovoContexto({
      tipo_contexto: contexto.tipo_contexto,
      descricao: contexto.descricao,
      palavras_chave: contexto.palavras_chave?.join(', ') || '',
      respostas_padrao: contexto.respostas_padrao?.join('\n') || ''
    });
    setDialogAberto(true);
  };

  const excluirContexto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversation_contexts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Contexto Excluído",
        description: "O contexto foi removido com sucesso.",
      });

      carregarContextos();
    } catch (error) {
      console.error('Erro ao excluir contexto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contexto.",
        variant: "destructive",
      });
    }
  };

  const alternarStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('conversation_contexts')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: ativo ? "Contexto Desativado" : "Contexto Ativado",
        description: `O contexto foi ${ativo ? 'desativado' : 'ativado'} com sucesso.`,
      });

      carregarContextos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do contexto.",
        variant: "destructive",
      });
    }
  };

  const criarContextosDefault = async () => {
    const contextosDefault = [
      {
        admin_id: 'current_admin',
        tipo_contexto: 'saudacao',
        descricao: 'Mensagens de saudação e boas-vindas',
        palavras_chave: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'],
        respostas_padrao: [
          'Olá! Como posso ajudá-lo hoje?',
          'Oi! Em que posso ser útil?',
          'Bem-vindo! Estou aqui para ajudar.'
        ],
        ativo: true
      },
      {
        admin_id: 'current_admin',
        tipo_contexto: 'despedida',
        descricao: 'Mensagens de despedida e agradecimento',
        palavras_chave: ['tchau', 'obrigado', 'até logo', 'valeu'],
        respostas_padrao: [
          'Muito obrigado pelo contato!',
          'Foi um prazer ajudá-lo. Até logo!',
          'Obrigado e tenha um ótimo dia!'
        ],
        ativo: true
      },
      {
        admin_id: 'current_admin',
        tipo_contexto: 'preco',
        descricao: 'Perguntas sobre preços e valores',
        palavras_chave: ['preço', 'valor', 'custo', 'quanto custa'],
        respostas_padrao: [
          'Vou verificar os preços para você.',
          'Deixe-me consultar nossa tabela de valores.',
          'Os preços variam conforme o produto. Qual especificamente interessa?'
        ],
        ativo: true
      }
    ];

    try {
      const { error } = await supabase
        .from('conversation_contexts')
        .insert(contextosDefault);

      if (error) throw error;

      toast({
        title: "Contextos Criados",
        description: "Contextos padrão foram criados com sucesso.",
      });

      carregarContextos();
    } catch (error) {
      console.error('Erro ao criar contextos default:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contextos padrão.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    carregarContextos();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Aprendizado Contextual
            </div>
            <div className="flex gap-2">
              {contextos.length === 0 && (
                <Button onClick={criarContextosDefault} variant="outline" size="sm">
                  Criar Contextos Padrão
                </Button>
              )}
              <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditando(null);
                    setNovoContexto({
                      tipo_contexto: '',
                      descricao: '',
                      palavras_chave: '',
                      respostas_padrao: ''
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contexto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editando ? 'Editar Contexto' : 'Novo Contexto'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure um contexto de conversa para melhorar as respostas do bot
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo do Contexto</label>
                      <Input
                        placeholder="Ex: saudacao, preco, produto"
                        value={novoContexto.tipo_contexto}
                        onChange={(e) => setNovoContexto(prev => ({
                          ...prev,
                          tipo_contexto: e.target.value
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição</label>
                      <Input
                        placeholder="Descreva quando este contexto deve ser usado"
                        value={novoContexto.descricao}
                        onChange={(e) => setNovoContexto(prev => ({
                          ...prev,
                          descricao: e.target.value
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Palavras-chave (separadas por vírgula)</label>
                      <Input
                        placeholder="olá, oi, bom dia, boa tarde"
                        value={novoContexto.palavras_chave}
                        onChange={(e) => setNovoContexto(prev => ({
                          ...prev,
                          palavras_chave: e.target.value
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Respostas Padrão (uma por linha)</label>
                      <Textarea
                        placeholder="Olá! Como posso ajudá-lo?&#10;Oi! Em que posso ser útil?"
                        value={novoContexto.respostas_padrao}
                        onChange={(e) => setNovoContexto(prev => ({
                          ...prev,
                          respostas_padrao: e.target.value
                        }))}
                        className="min-h-32"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={salvarContexto} className="flex-1">
                        {editando ? 'Atualizar' : 'Criar'} Contexto
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setDialogAberto(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
          <CardDescription>
            Configure contextos específicos para melhorar as respostas do bot em diferentes situações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contextos.length}</div>
              <div className="text-sm text-gray-600">Total de Contextos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {contextos.filter(c => c.ativo).length}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {contextos.filter(c => !c.ativo).length}
              </div>
              <div className="text-sm text-gray-600">Inativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Carregando contextos...</div>
        ) : contextos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum contexto configurado. Crie o primeiro contexto acima.
          </div>
        ) : (
          contextos.map((contexto) => (
            <Card key={contexto.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={contexto.ativo ? "default" : "secondary"}>
                        <Tag className="h-3 w-3 mr-1" />
                        {contexto.tipo_contexto}
                      </Badge>
                      <Badge variant="outline">
                        {contexto.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-medium">{contexto.descricao}</h4>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Palavras-chave:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contexto.palavras_chave?.map((palavra, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {palavra}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Respostas padrão ({contexto.respostas_padrao?.length || 0}):
                        </span>
                        <div className="mt-1 space-y-1">
                          {contexto.respostas_padrao?.slice(0, 2).map((resposta, index) => (
                            <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                              "{resposta}"
                            </div>
                          ))}
                          {(contexto.respostas_padrao?.length || 0) > 2 && (
                            <div className="text-xs text-gray-500">
                              +{(contexto.respostas_padrao?.length || 0) - 2} respostas adicionais
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editarContexto(contexto)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={contexto.ativo ? "outline" : "default"}
                      onClick={() => alternarStatus(contexto.id, contexto.ativo)}
                    >
                      {contexto.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => excluirContexto(contexto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default ContextualLearning;
