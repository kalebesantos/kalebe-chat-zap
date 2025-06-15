
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useTrainingMessages } from "@/hooks/useTrainingMessages";
import { TrainingQualityTip } from "@/components/TrainingQualityTip";
import { ImportWhatsAppMessages } from "@/components/ImportWhatsAppMessages";
import { TrainingMessagesTable } from "@/components/TrainingMessagesTable";

interface TrainingMessagesProps {
  adminId: string;
  onUpdate: () => void;
}

const MIN_QUALITY = 15;

const TrainingMessages = ({ adminId, onUpdate }: TrainingMessagesProps) => {
  const [novaMensagem, setNovaMensagem] = useState("");
  const [showImport, setShowImport] = useState(false);

  const {
    mensagens,
    loading,
    buscarMensagens,
    adicionarMensagem,
    removerMensagem,
  } = useTrainingMessages(adminId, onUpdate);

  return (
    <div className="space-y-6">
      {/* Dica visual para qualidade do treinamento */}
      <TrainingQualityTip count={mensagens.length} minQuality={MIN_QUALITY} />

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
              {mensagens.filter((m) => m.fonte === "manual").length}
            </div>
            <div className="text-sm text-gray-600">Adicionadas Manualmente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mensagens.filter((m) => m.fonte === "whatsapp_export").length}
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
          <Button
            onClick={async () => {
              const ok = await adicionarMensagem(novaMensagem);
              if (ok) setNovaMensagem("");
            }}
            disabled={!novaMensagem.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Mensagem
          </Button>
        </CardContent>
      </Card>

      {/* Importar do WhatsApp */}
      <div>
        <Button
          variant="outline"
          onClick={() => setShowImport((v) => !v)}
          className="mb-2"
        >
          {showImport ? "Cancelar" : "Importar do WhatsApp"}
        </Button>
        {showImport && (
          <ImportWhatsAppMessages
            adminId={adminId}
            onImported={() => {
              buscarMensagens();
              onUpdate();
              setShowImport(false);
            }}
          />
        )}
      </div>

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
          <TrainingMessagesTable
            mensagens={mensagens}
            loading={loading}
            onRemover={removerMensagem}
            onRefresh={buscarMensagens}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingMessages;
