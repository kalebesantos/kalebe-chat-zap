
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, MessageCircle, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Mensagem {
  id: string;
  mensagem_recebida: string;
  mensagem_enviada: string;
  timestamp: string | null;
  usuario_id: string | null;
  usuarios?: {
    nome: string | null;
    numero_whatsapp: string;
  };
}

interface Usuario {
  id: string;
  nome: string | null;
  numero_whatsapp: string;
}

const MessagesView = () => {
  const [messages, setMessages] = useState<Mensagem[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, [selectedUser, searchTerm, currentPage]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, numero_whatsapp')
        .order('nome');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('mensagens')
        .select(`
          *,
          usuarios (
            nome,
            numero_whatsapp
          )
        `)
        .order('timestamp', { ascending: false })
        .range((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage - 1);

      if (selectedUser !== 'all') {
        query = query.eq('usuario_id', selectedUser);
      }

      if (searchTerm) {
        query = query.or(`mensagem_recebida.ilike.%${searchTerm}%,mensagem_enviada.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setMessages(data || []);
      setTotalPages(Math.ceil((count || 0) / messagesPerPage));
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMessages();
  };

  const handleUserFilter = (userId: string) => {
    setSelectedUser(userId);
    setCurrentPage(1);
  };

  if (loading && messages.length === 0) {
    return <div className="text-center py-4">Carregando mensagens...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar nas mensagens</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="sm:w-64">
          <Label htmlFor="user-filter">Filtrar por usuário</Label>
          <Select value={selectedUser} onValueChange={handleUserFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.nome || user.numero_whatsapp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de mensagens */}
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {message.usuarios?.nome || message.usuarios?.numero_whatsapp || 'Usuário desconhecido'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {formatDate(message.timestamp)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Usuário:</p>
                  <p className="text-sm text-blue-800">{message.mensagem_recebida}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Bot className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">Bot:</p>
                  <p className="text-sm text-green-800">{message.mensagem_enviada}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page <= totalPages) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {messages.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || selectedUser !== 'all' 
            ? 'Nenhuma mensagem encontrada com os filtros aplicados.' 
            : 'Nenhuma mensagem encontrada. As conversas aparecerão aqui quando os usuários interagirem com o bot.'
          }
        </div>
      )}
    </div>
  );
};

export default MessagesView;
