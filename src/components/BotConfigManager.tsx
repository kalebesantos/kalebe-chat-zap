import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bot, Users, MessageSquare, RefreshCw, QrCode, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';
import { MetricCard } from './common/MetricCard';
import { useBotOnlineStatus } from '@/hooks/useBotOnlineStatus';

const BotConfigManager = () => {
  const [modoRestrito, setModoRestrito] = useState(false);
  const [aprendizadoAtivo, setAprendizadoAtivo] = useState(false);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [conversasAtivas, setConversasAtivas] = useState(0);
  const [loading, setLoading] = useState(true);
  const { status: botStatus, errorMessage, lastHeartbeat, qrCode, refresh: refreshBotStatus } = useBotOnlineStatus(5000); // Poll mais rápido
  const { toast } = useToast();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <StatusBadge status={botStatus} />
            </div>
            <Button variant="outline" size="sm" onClick={() => { buscarConfiguracoes(); refreshBotStatus(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <CardDescription>
            <span>
              O status do bot é atualizado a cada 5 segundos.<br />
              {botStatus === "online" && (
                <span className="text-green-700 font-medium">Bot conectado e pronto para interagir.</span>
              )}
              {botStatus === "offline" && (
                <span className="text-gray-700 font-medium">Bot desconectado. Reinicie o serviço.</span>
              )}
              {botStatus === "starting" && (
                <span className="text-blue-700 font-medium">Inicializando...</span>
              )}
              {botStatus === "authenticated" && (
                <span className="text-blue-700 font-medium">Autenticado no WhatsApp, conectando...</span>
              )}
              {botStatus === "qr_pending" && (
                <span className="text-orange-700 font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4 inline" /> Escaneie o QR code para conectar!
                </span>
              )}
              {botStatus === "error" && (
                <span className="text-red-600 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 inline" />
                  {errorMessage || "Erro desconhecido"}
                </span>
              )}
            </span>
            <br/>
            <span className="block text-xs text-gray-400">
              Última atualização: {lastHeartbeat ? lastHeartbeat.toLocaleString() : 'N/D'}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qrCode && botStatus === "qr_pending" && (
            <div className="bg-orange-50 border border-orange-200 rounded p-4 flex flex-col items-center mb-4">
              <span className="font-medium mb-2">QR Code do WhatsApp:</span>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200`}
                alt="QR Code WhatsApp"
                className="w-40 h-40"
              />
              <span className="text-xs mt-2 text-neutral-600">Escaneie para conectar o bot ao WhatsApp.</span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard value={totalUsuarios} label="Usuários Total" colorClass="text-blue-600" icon={<Users className="h-4 w-4" />} />
            <MetricCard value={conversasAtivas} label="Conversas Ativas" colorClass="text-green-600" icon={<MessageSquare className="h-4 w-4" />} />
            <MetricCard
              value={<Badge variant={modoRestrito ? "destructive" : "default"} className="text-lg py-1">{modoRestrito ? "Restrito" : "Aberto"}</Badge>}
              label="Modo Atual"
            />
            <MetricCard
              value={<Badge variant={aprendizadoAtivo ? "default" : "secondary"} className="text-lg py-1">{aprendizadoAtivo ? "Ativo" : "Inativo"}</Badge>}
              label="Aprendizado IA"
            />
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
