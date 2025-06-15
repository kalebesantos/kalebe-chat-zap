
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Mensagem {
  id: string;
  conteudo: string;
  fonte: string;
  timestamp: string;
}

export function useTrainingMessages(adminId: string, onUpdate: () => void) {
  const { toast } = useToast();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);

  const buscarMensagens = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("admin_id", adminId)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens de treinamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [adminId, toast]);

  const adicionarMensagem = async (novaMensagem: string) => {
    if (!novaMensagem.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para adicionar.",
        variant: "destructive",
      });
      return false;
    }
    try {
      const { error } = await supabase.from("admin_messages").insert({
        admin_id: adminId,
        conteudo: novaMensagem.trim(),
        fonte: "manual",
      });
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Mensagem adicionada com sucesso!",
      });
      buscarMensagens();
      onUpdate();
      return true;
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a mensagem.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removerMensagem = async (id: string) => {
    try {
      const { error } = await supabase.from("admin_messages").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Mensagem removida com sucesso!",
      });
      buscarMensagens();
      onUpdate();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover a mensagem.",
        variant: "destructive",
      });
    }
  };

  return {
    mensagens,
    loading,
    buscarMensagens,
    adicionarMensagem,
    removerMensagem,
  };
}
