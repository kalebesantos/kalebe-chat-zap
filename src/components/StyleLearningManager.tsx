
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Brain, Upload, Play, Square, Eye, Trash2, RefreshCw } from 'lucide-react';

interface PerfilEstilo {
  id: string;
  admin_id: string;
  nome_admin: string | null;
  estilo_resumo: string | null;
  tom_comunicacao: string | null;
  ativo: boolean;
  total_mensagens: number;
  ultima_atualizacao: string;
}

const StyleLearningManager = () => {
  const [perfis, setPerfis] = useState<PerfilEstilo[]>([]);
  const [loading, setLoading] = useState(true);
  const [aprendizadoAtivo, setAprendizadoAtivo] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [adminId, setAdminId] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [processando, setProcessando] = useState(false);
  const { toast } = useToast();

  const buscarPerfis = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_style_profiles')
        .select('*')
        .order('ultima_atualizacao', { ascending: false });

      if (error) throw error;
      setPerfis(data || []);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os perfis de estilo.",
        variant: "destructive",
      });
    }
  };

  const buscarConfiguracaoAprendizado = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_config')
        .select('valor')
        .eq('chave', 'aprendizado_estilo_ativo')
        .single();

      if (error) throw error;
      setAprendizadoAtivo(data?.valor === 'true');
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  const alternarAprendizado = async (ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('bot_config')
        .update({ valor: ativo ? 'true' : 'false' })
        .eq('chave', 'aprendizado_estilo_ativo');

      if (error) throw error;

      setAprendizadoAtivo(ativo);
      toast({
        title: "Sucesso",
        description: `Aprendizado de estilo ${ativo ? 'ativado' : 'desativado'}.`,
      });
    } catch (error) {
      console.error('Erro ao alterar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    }
  };

  const adicionarMensagem = async () => {
    if (!adminId.trim() || !novaMensagem.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o ID do admin e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_messages')
        .insert({
          admin_id: adminId.trim(),
          conteudo: novaMensagem.trim(),
          fonte: 'manual'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Mensagem adicionada para aprendizado!",
      });

      setNovaMensagem('');
      buscarPerfis();
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const ativarPerfil = async (adminId: string) => {
    try {
      // Desativa todos os perfis
      await supabase
        .from('admin_style_profiles')
        .update({ ativo: false })
        .neq('admin_id', '');

      // Ativa o perfil específico
      const { error } = await supabase
        .from('admin_style_profiles')
        .update({ ativo: true })
        .eq('admin_id', adminId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil de estilo ativado!",
      });

      buscarPerfis();
    } catch (error) {
      console.error('Erro ao ativar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar o perfil.",
        variant: "destructive",
      });
    }
  };

  const desativarTodosPerfis = async () => {
    try {
      const { error } = await supabase
        .from('admin_style_profiles')
        .update({ ativo: false })
        .neq('admin_id', '');

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Todos os perfis foram desativados!",
      });

      buscarPerfis();
    } catch (error) {
      console.error('Erro ao desativar perfis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar os perfis.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    buscarPerfis();
    buscarConfiguracaoAprendizado();
  }, []);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Aprendizado de Estilo
          </CardTitle>
          <CardDescription>
            Configure o bot para aprender e imitar o estilo de comunicação do administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="aprendizado-ativo"
              checked={aprendizadoAtivo}
              onCheckedChange={alternarAprendizado}
            />
            <Label htmlFor="aprendizado-ativo">
              Ativar aprendizado de estilo
            </Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-id">ID do Administrador</Label>
              <Input
                id="admin-id"
                placeholder="ex: 5511999999999"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome-admin">Nome do Administrador</Label>
              <Input
                id="nome-admin"
                placeholder="ex: João Silva"
                value={nomeAdmin}
                onChange={(e) => setNomeAdmin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-mensagem">Adicionar Mensagem para Aprendizado</Label>
            <Textarea
              id="nova-mensagem"
              placeholder="Cole aqui uma mensagem típica do administrador..."
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={adicionarMensagem} disabled={!adminId || !novaMensagem}>
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Mensagem
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Perfis de Estilo
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={desativarTodosPerfis}>
                <Square className="h-4 w-4 mr-2" />
                Desativar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={buscarPerfis}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Gerencie os perfis de estilo de comunicação criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : perfis.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum perfil de estilo criado ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>ID Admin</TableHead>
                  <TableHead>Tom</TableHead>
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfis.map((perfil) => (
                  <TableRow key={perfil.id}>
                    <TableCell>
                      <Badge variant={perfil.ativo ? "default" : "secondary"}>
                        {perfil.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {perfil.nome_admin || 'Sem nome'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {perfil.admin_id}
                    </TableCell>
                    <TableCell>
                      {perfil.tom_comunicacao || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {perfil.total_mensagens}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatarData(perfil.ultima_atualizacao)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!perfil.ativo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ativarPerfil(perfil.admin_id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Resumo do Estilo",
                              description: perfil.estilo_resumo || "Sem resumo disponível",
                            });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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

export default StyleLearningManager;
