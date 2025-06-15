
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, RefreshCw } from 'lucide-react';

interface ConversaAtiva {
  id: string;
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
  const { toast } = useToast();

  const buscarConversas = async () => {
    try {
      const { data, error } = await supabase
        .from('conversas_ativas')
        .select(`
          id,
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

  useEffect(() => {
    buscarConversas();
  }, []);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Conversas Ativas
          <Button variant="outline" size="sm" onClick={buscarConversas}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardTitle>
        <CardDescription>
          Gerencie quais usuários podem conversar com o bot no modo restrito
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Número do WhatsApp (ex: 5511999999999)"
            value={novoNumero}
            onChange={(e) => setNovoNumero(e.target.value)}
            disabled={adicionando}
          />
          <Button onClick={ativarConversa} disabled={adicionando}>
            <Plus className="h-4 w-4 mr-2" />
            Ativar
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : conversas.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhuma conversa ativa no momento
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
                      onClick={() => {
                        // Extrair usuario_id da conversa
                        const usuarioId = conversa.id; // Você pode precisar ajustar isso
                        desativarConversa(usuarioId);
                      }}
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
  );
};

export default ActiveConversationsManager;
