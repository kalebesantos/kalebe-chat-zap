
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImportWhatsAppMessagesProps {
  adminId: string;
  onImported: () => void;
}

export function ImportWhatsAppMessages({ adminId, onImported }: ImportWhatsAppMessagesProps) {
  const [exportText, setExportText] = useState("");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const importarMensagens = async () => {
    if (!exportText.trim()) {
      toast({
        title: "Erro",
        description: "Cole o texto do export do WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const regexMensagem = /\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - ([^:]+): (.+)/g;
      const mensagensParaImportar = [];
      let match;

      while ((match = regexMensagem.exec(exportText)) !== null) {
        const [, autor, conteudo] = match;
        if (autor.trim().includes(adminId) || autor.trim() === adminId) {
          mensagensParaImportar.push({
            admin_id: adminId,
            conteudo: conteudo.trim(),
            fonte: "whatsapp_export",
          });
        }
      }

      if (mensagensParaImportar.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma mensagem do administrador foi encontrada no texto.",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("admin_messages").insert(mensagensParaImportar);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${mensagensParaImportar.length} mensagens importadas com sucesso!`,
      });

      setExportText("");
      onImported();

    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível importar as mensagens.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" /> Importar do WhatsApp
        </CardTitle>
        <CardDescription>Importe mensagens de um export do WhatsApp</CardDescription>
      </CardHeader>
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
        <Button onClick={importarMensagens} disabled={!exportText.trim() || importing}>
          {importing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Importando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Importar Mensagens
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

