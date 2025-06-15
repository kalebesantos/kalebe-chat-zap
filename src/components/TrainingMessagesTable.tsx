
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import React from "react";

interface Mensagem {
  id: string;
  conteudo: string;
  fonte: string;
  timestamp: string;
}

interface TrainingMessagesTableProps {
  mensagens: Mensagem[];
  loading: boolean;
  onRemover: (id: string) => void;
  onRefresh: () => void;
}

function getFonteBadge(fonte: string) {
  switch (fonte) {
    case "manual":
      return <Badge variant="default">Manual</Badge>;
    case "whatsapp_export":
      return <Badge variant="secondary">WhatsApp</Badge>;
    case "sistema":
      return <Badge variant="outline">Sistema</Badge>;
    default:
      return <Badge variant="outline">{fonte}</Badge>;
  }
}

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR");
}

export function TrainingMessagesTable({ mensagens, loading, onRemover }: TrainingMessagesTableProps) {
  if (loading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  if (mensagens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Nenhuma mensagem de treinamento encontrada</p>
        <p className="text-sm">Adicione mensagens para começar o treinamento</p>
      </div>
    );
  }

  return (
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
            <TableCell>{getFonteBadge(mensagem.fonte)}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {formatarData(mensagem.timestamp)}
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemover(mensagem.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
