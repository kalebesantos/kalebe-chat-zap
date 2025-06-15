
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Usuario {
  id: string;
  nome: string | null;
  numero_whatsapp: string;
  estilo_fala: string | null;
  created_at: string | null;
}

const UsersTable = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', estilo_fala: '' });
  const { toast } = useToast();

  const estilosDisponiveis = [
    { value: 'neutro', label: '🤖 Neutro' },
    { value: 'engracado', label: '😂 Engraçado' },
    { value: 'educado', label: '🎩 Educado' },
    { value: 'direto', label: '⚡ Direto' },
    { value: 'amigavel', label: '😊 Amigável' },
    { value: 'brasileiro', label: '🇧🇷 Brasileiro' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setEditForm({
      nome: user.nome || '',
      estilo_fala: user.estilo_fala || 'neutro'
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: editForm.nome || null,
          estilo_fala: editForm.estilo_fala
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Usuário atualizado!",
        description: "As informações foram salvas com sucesso.",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstiloLabel = (estilo: string | null) => {
    const found = estilosDisponiveis.find(e => e.value === estilo);
    return found ? found.label : '🤖 Neutro';
  };

  if (loading) {
    return <div className="text-center py-4">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Estilo de Fala</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.nome || 'Não informado'}
                </TableCell>
                <TableCell>{user.numero_whatsapp}</TableCell>
                <TableCell>{getEstiloLabel(user.estilo_fala)}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                          Altere o nome e estilo de fala do usuário {user.numero_whatsapp}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            value={editForm.nome}
                            onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Nome do usuário"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estilo">Estilo de Fala</Label>
                          <Select
                            value={editForm.estilo_fala}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, estilo_fala: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {estilosDisponiveis.map((estilo) => (
                                <SelectItem key={estilo.value} value={estilo.value}>
                                  {estilo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setEditingUser(null)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveUser}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum usuário encontrado. Os usuários aparecerão aqui quando começarem a interagir com o bot.
        </div>
      )}
    </div>
  );
};

export default UsersTable;
