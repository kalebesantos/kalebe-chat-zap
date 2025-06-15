import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Trash2, Upload, FileText, RefreshCw } from 'lucide-react';

interface TrainingMessagesProps {
  adminId: string;
  onUpdate: () => void;
}

interface Mensagem {
  id: string;
  conteudo: string;
  fonte: string;
  timestamp: string;
}

const TrainingMessages = ({ adminId, onUpdate }: TrainingMessagesProps) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [exportText, setExportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();

  const MIN_QUALITY = 15; // recomendação mínima de exemplos para um bom aprendizado

  const buscarMensagens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('admin_id', adminId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens de treinamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarMensagem = async () => {
    if (!novaMensagem.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para adicionar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_messages')
        .insert({
          admin_id: adminId,
          conteudo: novaMensagem.trim(),
          fonte: 'manual'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Mensagem adicionada com sucesso!",
      });

      setNovaMensagem('');
      buscarMensagens();
      onUpdate();
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const removerMensagem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Mensagem removida com sucesso!",
      });

      buscarMensagens();
      onUpdate();
    } catch (error) {
      console.error('Erro ao remover mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a mensagem.",
        variant: "destructive",
      });
    }
  };

  const importarMensagens = async () => {
    if (!exportText.trim()) {
      toast({
        title: "Erro",
        description: "Cole o texto do export do WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Regex para extrair mensagens do formato WhatsApp export
      const regexMensagem = /\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - ([^:]+): (.+)/g;
      const mensagensParaImportar = [];
      let match;

      while ((match = regexMensagem.exec(exportText)) !== null) {
        const [, autor, conteudo] = match;
        
        // Verifica se é mensagem do admin (por nome ou número)
        if (autor.trim().includes(adminId) || autor.trim() === adminId) {
          mensagensParaImportar.push({
            admin_id: adminId,
            conteudo: conteudo.trim(),
            fonte: 'whatsapp_export'
          });
        }
      }

      if (mensagensParaImportar.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma mensagem do administrador foi encontrada no texto.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('admin_messages')
        .insert(mensagensParaImportar);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${mensagensParaImportar.length} mensagens importadas com sucesso!`,
      });

      setExportText('');
      setShowImport(false);
      buscarMensagens();
      onUpdate();
    } catch (error) {
      console.error('Erro ao importar mensagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível importar as mensagens.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    buscarMensagens();
  }, [adminId]);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getFonteBadge = (fonte: string) => {
    switch (fonte) {
      case 'manual':
        return <Badge variant="default">Manual</Badge>;
      case 'whatsapp_export':
        return <Badge variant="secondary">WhatsApp</Badge>;
      case 'sistema':
        return <Badge variant="outline">Sistema</Badge>;
      default:
        return <Badge variant="outline">{fonte}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dica visual para qualidade do treinamento */}
      <div className="rounded-lg p-3 mb-2"
        style={{
          background: mensagens.length < MIN_QUALITY
            ? 'linear-gradient(90deg,#fffbe9 40%,#ffe2e2 100%)'
            : 'linear-gradient(90deg,#e7fff6 40%,#f3ffe2 100%)'
        }}>
        <div className="flex items-center gap-3">
          {mensagens.length < MIN_QUALITY ? (
            <>
              <span className="text-amber-700 font-bold">Poucos exemplos!</span>
              <span className="text-sm text-gray-600">
                Adicione pelo menos <b>{MIN_QUALITY} mensagens</b> para garantir um melhor aprendizado do estilo do bot.
              </span>
            </>
          ) : (
            <>
              <span className="text-green-600 font-bold">Ótimo aprendizado!</span>
              <span className="text-sm text-gray-600">
                Continue adicionando exemplos variados e reais para “ensinar” melhor a IA a imitar seu jeito.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{mensagens.length}</div>
            <div className="text-sm text-gray-600">Total de Mensagens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {mensagens.filter(m => m.fonte === 'manual').length}
            </div>
            <div className="text-sm text-gray-600">Adicionadas Manualmente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mensagens.filter(m => m.fonte === 'whatsapp_export').length}
            </div>
            <div className="text-sm text-gray-600">Importadas do WhatsApp</div>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Nova Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Nova Mensagem
          </CardTitle>
          <CardDescription>
            Adicione mensagens individuais para treinar o estilo do bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite uma mensagem típica do administrador..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            rows={3}
          />
          <Button onClick={adicionarMensagem} disabled={!novaMensagem.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Mensagem
          </Button>
        </CardContent>
      </Card>

      {/* Importar do WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar do WhatsApp
            </div>
            <Button
              variant="outline"
              onClick={() => setShowImport(!showImport)}
            >
              {showImport ? 'Cancelar' : 'Importar'}
            </Button>
          </CardTitle>
          <CardDescription>
            Importe mensagens de um export do WhatsApp
          </CardDescription>
        </CardHeader>
        {showImport && (
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Como exportar do WhatsApp:</h4>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Abra a conversa no WhatsApp</li>
                <li>2. Toque nos 3 pontos → Mais → Exportar conversa</li>
                <li>3. Escolha "Sem mídia"</li>
                <li>4. Cole o texto completo abaixo</li>
              </ol>
            </div>
            <Textarea
              placeholder="Cole aqui o texto do export do WhatsApp..."
              value={exportText}
              onChange={(e) => setExportText(e.target.value)}
              rows={6}
            />
            <Button onClick={importarMensagens} disabled={!exportText.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Mensagens
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Lista de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensagens de Treinamento
            </div>
            <Button variant="outline" size="sm" onClick={buscarMensagens}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <CardDescription>
            Todas as mensagens usadas para treinar o estilo do bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma mensagem de treinamento encontrada</p>
              <p className="text-sm">Adicione mensagens para começar o treinamento</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mensagens.map((mensagem) => (
                  <TableRow key={mensagem.id}>
                    <TableCell className="max-w-md">
                      <p className="truncate" title={mensagem.conteudo}>
                        {mensagem.conteudo}
                      </p>
                    </TableCell>
                    <TableCell>
                      {getFonteBadge(mensagem.fonte)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatarData(mensagem.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerMensagem(mensagem.id)}
                        className="text-red-600 hover:text-red-700"
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

export default TrainingMessages;
