import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bot, Users, MessageSquare, RefreshCw } from 'lucide-react';

const BotConfigManager = () => {
  const [modoRestrito, setModoRestrito] = useState(false);
  const [aprendizadoAtivo, setAprendizadoAtivo] = useState(false);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [conversasAtivas, setConversasAtivas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [botOnline, setBotOnline] = useState(false);
  const { toast } = useToast();

  const buscarStatusBot = async () => {
    // Busca o status na tabela bot_status (com fallback; se não existe, sempre retorna off)
    try {
      const { data, error } = await supabase
        .from('bot_status')
        .select('online, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setBotOnline(false);
        console.error('Erro ao buscar status do bot:', error);
      } else if (data && data.online === true) {
        setBotOnline(true);
      } else {
        setBotOnline(false);
      }
    } catch (err) {
      setBotOnline(false);
      console.error('Erro ao buscar status do bot:', err);
    }
  };

  const buscarConfiguracoes = async () => {
    try {
      setLoading(true);

      // Buscar modo de resposta
      const { data: modoData, error: modoError } = await supabase
        .from('bot_config')
        .select('valor')
        .eq('chave', 'modo_resposta')
        .maybeSingle();

      if (modoError) {
        console.error('Erro ao buscar modo:', modoError);
      } else {
        setModoRestrito(modoData?.valor === 'restrito');
      }

      // Buscar aprendizado de estilo
      const { data: aprendizadoData, error: aprendizadoError } = await supabase
        .from('bot_config')
        .select('valor')
        .eq('chave', 'aprendizado_estilo_ativo')
        .maybeSingle();

      if (aprendizadoError) {
        console.error('Erro ao buscar aprendizado:', aprendizadoError);
      } else {
        setAprendizadoAtivo(aprendizadoData?.valor === 'true');
      }

      // Buscar estatísticas
      const { count: usuariosCount } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      const { count: conversasCount } = await supabase
        .from('conversas_ativas')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      setTotalUsuarios(usuariosCount || 0);
      setConversasAtivas(conversasCount || 0);

      await buscarStatusBot();
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const alternarModo = async (restrito: boolean) => {
    try {
      const novoModo = restrito ? 'restrito' : 'aberto';
      
      // Primeiro tenta buscar se já existe
      const { data: existing } = await supabase
        .from('bot_config')
        .select('id')
        .eq('chave', 'modo_resposta')
        .maybeSingle();

      let error;
      if (existing) {
        // Se existe, atualiza
        const result = await supabase
          .from('bot_config')
          .update({
            valor: novoModo,
            updated_at: new Date().toISOString()
          })
          .eq('chave', 'modo_resposta');
        error = result.error;
      } else {
        // Se não existe, insere
        const result = await supabase
          .from('bot_config')
          .insert({
            chave: 'modo_resposta',
            valor: novoModo,
            descricao: 'Modo de resposta do bot (aberto ou restrito)'
          });
        error = result.error;
      }

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

  const alternarAprendizado = async (ativo: boolean) => {
    try {
      // Primeiro tenta buscar se já existe
      const { data: existing } = await supabase
        .from('bot_config')
        .select('id')
        .eq('chave', 'aprendizado_estilo_ativo')
        .maybeSingle();

      let error;
      if (existing) {
        // Se existe, atualiza
        const result = await supabase
          .from('bot_config')
          .update({
            valor: ativo ? 'true' : 'false',
            updated_at: new Date().toISOString()
          })
          .eq('chave', 'aprendizado_estilo_ativo');
        error = result.error;
      } else {
        // Se não existe, insere
        const result = await supabase
          .from('bot_config')
          .insert({
            chave: 'aprendizado_estilo_ativo',
            valor: ativo ? 'true' : 'false',
            descricao: 'Controla se o bot está aprendendo estilos de comunicação'
          });
        error = result.error;
      }

      if (error) throw error;

      setAprendizadoAtivo(ativo);
      toast({
        title: "Sucesso",
        description: `Aprendizado de estilo ${ativo ? 'ativado' : 'desativado'}!`,
      });
    } catch (error) {
      console.error('Erro ao alterar aprendizado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração de aprendizado.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    buscarConfiguracoes();

    // Atualiza status do bot a cada 12 segundos
    const timer = setInterval(() => {
      buscarStatusBot();
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Status do Bot
              <span>
                {botOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">
                    <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" /> Offline
                  </span>
                )}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={buscarConfiguracoes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <CardDescription>
            Visão geral do status e configurações do bot WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalUsuarios}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                Usuários Total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{conversasAtivas}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Conversas Ativas
              </div>
            </div>
            <div className="text-center">
              <Badge variant={modoRestrito ? "destructive" : "default"} className="text-lg py-1">
                {modoRestrito ? "Restrito" : "Aberto"}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">Modo Atual</div>
            </div>
            <div className="text-center">
              <Badge variant={aprendizadoAtivo ? "default" : "secondary"} className="text-lg py-1">
                {aprendizadoAtivo ? "Ativo" : "Inativo"}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">Aprendizado IA</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Principais
          </CardTitle>
          <CardDescription>
            Configure o comportamento do bot de forma visual e intuitiva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Modo de Resposta</Label>
              <p className="text-sm text-gray-600">
                {modoRestrito 
                  ? "Bot responde apenas usuários em conversas ativas" 
                  : "Bot responde todos os usuários que enviarem mensagem"
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="modo-restrito" className="text-sm">
                {modoRestrito ? "Restrito" : "Aberto"}
              </Label>
              <Switch
                id="modo-restrito"
                checked={modoRestrito}
                onCheckedChange={alternarModo}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Aprendizado de Estilo</Label>
              <p className="text-sm text-gray-600">
                {aprendizadoAtivo 
                  ? "Bot está aprendendo e imitando estilos de comunicação" 
                  : "Bot usa respostas padrão sem personalização de estilo"
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="aprendizado-ativo" className="text-sm">
                {aprendizadoAtivo ? "Ativo" : "Inativo"}
              </Label>
              <Switch
                id="aprendizado-ativo"
                checked={aprendizadoAtivo}
                onCheckedChange={alternarAprendizado}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre o Modo Restrito */}
      {modoRestrito && (
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Modo Restrito Ativo</CardTitle>
            <CardDescription>
              No modo restrito, apenas usuários com conversas ativas podem interagir com o bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Para gerenciar quais usuários podem conversar com o bot, use a aba "Conversas Ativas" 
              para adicionar ou remover usuários da lista de conversas permitidas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BotConfigManager;
