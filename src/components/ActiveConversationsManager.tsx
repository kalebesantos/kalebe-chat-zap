
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, RefreshCw, Users, AlertCircle } from 'lucide-react';

interface ConversaAtiva {
  id: string;
  usuario_id: string;
  ativo: boolean;
  admin_iniciou: boolean;
  ultima_atividade: string;
  created_at: string;
  usuarios: {
    numero_whatsapp: string;
    nome: string | null;
  };
}

const ActiveConversationsManager = () => {
  const [conversas, setConversas] = useState<ConversaAtiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNumero, setNovoNumero] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [modoRestrito, setModoRestrito] = useState(false);
  const { toast } = useToast();

  const buscarModoAtual = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_config')
        .select('valor')
        .eq('chave', 'modo_resposta')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar modo:', error);
        return;
      }

      setModoRestrito(data?.valor === 'restrito');
    } catch (error) {
      console.error('Erro ao buscar modo atual:', error);
    }
  };

  const buscarConversas = async () => {
    try {
      const { data, error } = await supabase
        .from('conversas_ativas')
        .select(`
          id,
          usuario_id,
          ativo,
          admin_iniciou,
          ultima_atividade,
          created_at,
          usuarios!inner(
            numero_whatsapp,
            nome
          )
        `)
        .eq('ativo', true)
        .order('ultima_atividade', { ascending: false });

      if (error) throw error;
      setConversas(data || []);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas ativas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const alternarModo = async (restrito: boolean) => {
    try {
      const novoModo = restrito ? 'restrito' : 'aberto';
      
      const { error } = await supabase
        .from('bot_config')
        .upsert({
          chave: 'modo_resposta',
          valor: novoModo,
          descricao: 'Modo de resposta do bot (aberto ou restrito)',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setModoRestrito(restrito);
      toast({
        title: "Sucesso",
        description: `Modo ${novoModo} ativado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao alterar modo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o modo do bot.",
        variant: "destructive",
      });
    }
  };

  const ativarConversa = async () => {
    if (!novoNumero.trim()) {
      toast({
        title: "Erro",
        description: "Digite um número válido.",
        variant: "destructive",
      });
      return;
    }

    setAdicionando(true);
    try {
      // Primeiro busca o usuário
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('numero_whatsapp', novoNumero.trim())
        .single();

      if (usuarioError || !usuario) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Verifique se o número já conversou com o bot.",
          variant: "destructive",
        });
        return;
      }

      // Ativa a conversa
      const { error } = await supabase
        .from('conversas_ativas')
        .upsert({
          usuario_id: usuario.id,
          ativo: true,
          admin_iniciou: true,
          ultima_atividade: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conversa ativada com sucesso!",
      });

      setNovoNumero('');
      buscarConversas();
    } catch (error) {
      console.error('Erro ao ativar conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar a conversa.",
        variant: "destructive",
      });
    } finally {
      setAdicionando(false);
    }
  };

  const desativarConversa = async (usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('conversas_ativas')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', usuarioId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conversa desativada com sucesso!",
      });

      buscarConversas();
    } catch (error) {
      console.error('Erro ao desativar conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar a conversa.",
        variant: "destructive",
      });
    }
  };

  const desativarTodasConversas = async () => {
    try {
      const { error } = await supabase
        .from('conversas_ativas')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('ativo', true);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Todas as conversas foram desativadas!",
      });

      buscarConversas();
    } catch (error) {
      console.error('Erro ao desativar conversas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar as conversas.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    buscarModoAtual();
    buscarConversas();
  }, []);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Controle do Modo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Modo de Resposta
          </CardTitle>
          <CardDescription>
            Configure como o bot responde às mensagens recebidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">
                {modoRestrito ? "Modo Restrito" : "Modo Aberto"}
              </Label>
              <p className="text-sm text-gray-600">
                {modoRestrito 
                  ? "Bot responde apenas usuários listados abaixo" 
                  : "Bot responde todos os usuários automaticamente"
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="modo-toggle" className="text-sm">
                {modoRestrito ? "Restrito" : "Aberto"}
              </Label>
              <Switch
                id="modo-toggle"
                checked={modoRestrito}
                onCheckedChange={alternarModo}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert quando modo restrito está ativo */}
      {modoRestrito && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Modo Restrito Ativo</h4>
                <p className="text-sm text-amber-700">
                  Apenas usuários com conversas ativas podem interagir com o bot. 
                  Gerencie a lista abaixo para controlar quem pode conversar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gestão de Conversas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Conversas Ativas
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={desativarTodasConversas}
                disabled={conversas.length === 0}
              >
                Desativar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={buscarConversas}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {modoRestrito 
              ? "Gerencie quais usuários podem conversar com o bot"
              : "Visualize conversas que foram iniciadas manualmente pelo admin"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Número do WhatsApp (ex: 5511999999999)"
              value={novoNumero}
              onChange={(e) => setNovoNumero(e.target.value)}
              disabled={adicionando}
              onKeyPress={(e) => e.key === 'Enter' && ativarConversa()}
            />
            <Button onClick={ativarConversa} disabled={adicionando}>
              <Plus className="h-4 w-4 mr-2" />
              Ativar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : conversas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma conversa ativa</p>
              <p className="text-sm">
                {modoRestrito 
                  ? "Adicione usuários para permitir que conversem com o bot"
                  : "Conversas aparecerão aqui quando iniciadas pelo admin"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Iniciado por</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversas.map((conversa) => (
                  <TableRow key={conversa.id}>
                    <TableCell>
                      {conversa.usuarios.nome || 'Sem nome'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {conversa.usuarios.numero_whatsapp}
                    </TableCell>
                    <TableCell>
                      <Badge variant={conversa.admin_iniciou ? "default" : "secondary"}>
                        {conversa.admin_iniciou ? "Admin" : "Auto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatarData(conversa.ultima_atividade)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => desativarConversa(conversa.usuario_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveConversationsManager;
