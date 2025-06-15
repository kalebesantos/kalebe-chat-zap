export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_messages: {
        Row: {
          admin_id: string
          conteudo: string
          created_at: string | null
          fonte: string | null
          id: string
          timestamp: string | null
        }
        Insert: {
          admin_id: string
          conteudo: string
          created_at?: string | null
          fonte?: string | null
          id?: string
          timestamp?: string | null
        }
        Update: {
          admin_id?: string
          conteudo?: string
          created_at?: string | null
          fonte?: string | null
          id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      admin_style_profiles: {
        Row: {
          admin_id: string
          ativo: boolean | null
          created_at: string | null
          emojis_frequentes: string[] | null
          estilo_resumo: string | null
          exemplos_mensagens: string[] | null
          id: string
          nome_admin: string | null
          palavras_frequentes: Json | null
          tom_comunicacao: string | null
          total_mensagens: number | null
          ultima_atualizacao: string | null
          updated_at: string | null
          vocabulario_caracteristico: string[] | null
        }
        Insert: {
          admin_id: string
          ativo?: boolean | null
          created_at?: string | null
          emojis_frequentes?: string[] | null
          estilo_resumo?: string | null
          exemplos_mensagens?: string[] | null
          id?: string
          nome_admin?: string | null
          palavras_frequentes?: Json | null
          tom_comunicacao?: string | null
          total_mensagens?: number | null
          ultima_atualizacao?: string | null
          updated_at?: string | null
          vocabulario_caracteristico?: string[] | null
        }
        Update: {
          admin_id?: string
          ativo?: boolean | null
          created_at?: string | null
          emojis_frequentes?: string[] | null
          estilo_resumo?: string | null
          exemplos_mensagens?: string[] | null
          id?: string
          nome_admin?: string | null
          palavras_frequentes?: Json | null
          tom_comunicacao?: string | null
          total_mensagens?: number | null
          ultima_atualizacao?: string | null
          updated_at?: string | null
          vocabulario_caracteristico?: string[] | null
        }
        Relationships: []
      }
      bot_config: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      conversas_ativas: {
        Row: {
          admin_iniciou: boolean
          ativo: boolean
          created_at: string | null
          id: string
          ultima_atividade: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          admin_iniciou?: boolean
          ativo?: boolean
          created_at?: string | null
          id?: string
          ultima_atividade?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          admin_iniciou?: boolean
          ativo?: boolean
          created_at?: string | null
          id?: string
          ultima_atividade?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_ativas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_contexts: {
        Row: {
          admin_id: string
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          palavras_chave: string[] | null
          respostas_padrao: string[] | null
          tipo_contexto: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          palavras_chave?: string[] | null
          respostas_padrao?: string[] | null
          tipo_contexto: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          palavras_chave?: string[] | null
          respostas_padrao?: string[] | null
          tipo_contexto?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_history_analysis: {
        Row: {
          admin_id: string
          contextos_identificados: Json | null
          created_at: string | null
          id: string
          mensagens_aprovadas: number | null
          mensagens_rejeitadas: number | null
          padroes_descobertos: Json | null
          periodo_fim: string
          periodo_inicio: string
          qualidade_geral: number | null
          status: string | null
          total_mensagens_analisadas: number | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          contextos_identificados?: Json | null
          created_at?: string | null
          id?: string
          mensagens_aprovadas?: number | null
          mensagens_rejeitadas?: number | null
          padroes_descobertos?: Json | null
          periodo_fim: string
          periodo_inicio: string
          qualidade_geral?: number | null
          status?: string | null
          total_mensagens_analisadas?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          contextos_identificados?: Json | null
          created_at?: string | null
          id?: string
          mensagens_aprovadas?: number | null
          mensagens_rejeitadas?: number | null
          padroes_descobertos?: Json | null
          periodo_fim?: string
          periodo_inicio?: string
          qualidade_geral?: number | null
          status?: string | null
          total_mensagens_analisadas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          id: string
          mensagem_enviada: string
          mensagem_recebida: string
          timestamp: string | null
          usuario_id: string | null
        }
        Insert: {
          id?: string
          mensagem_enviada: string
          mensagem_recebida: string
          timestamp?: string | null
          usuario_id?: string | null
        }
        Update: {
          id?: string
          mensagem_enviada?: string
          mensagem_recebida?: string
          timestamp?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      response_feedback: {
        Row: {
          contexto_conversa: string | null
          created_at: string | null
          feedback_tipo: string | null
          id: string
          mensagem_enviada: string
          observacoes: string | null
          timestamp_resposta: string | null
          usuario_id: string | null
        }
        Insert: {
          contexto_conversa?: string | null
          created_at?: string | null
          feedback_tipo?: string | null
          id?: string
          mensagem_enviada: string
          observacoes?: string | null
          timestamp_resposta?: string | null
          usuario_id?: string | null
        }
        Update: {
          contexto_conversa?: string | null
          created_at?: string | null
          feedback_tipo?: string | null
          id?: string
          mensagem_enviada?: string
          observacoes?: string | null
          timestamp_resposta?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_feedback_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      training_candidates: {
        Row: {
          analysis_id: string | null
          aprovado: boolean | null
          confianca_admin: number | null
          contexto: string | null
          created_at: string | null
          id: string
          mensagem_original: string
          motivo_aprovacao: string | null
          qualidade_estimada: number | null
          timestamp_original: string | null
          tipo_resposta: string | null
        }
        Insert: {
          analysis_id?: string | null
          aprovado?: boolean | null
          confianca_admin?: number | null
          contexto?: string | null
          created_at?: string | null
          id?: string
          mensagem_original: string
          motivo_aprovacao?: string | null
          qualidade_estimada?: number | null
          timestamp_original?: string | null
          tipo_resposta?: string | null
        }
        Update: {
          analysis_id?: string | null
          aprovado?: boolean | null
          confianca_admin?: number | null
          contexto?: string | null
          created_at?: string | null
          id?: string
          mensagem_original?: string
          motivo_aprovacao?: string | null
          qualidade_estimada?: number | null
          timestamp_original?: string | null
          tipo_resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_candidates_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "conversation_history_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string | null
          estilo_fala: string | null
          id: string
          nome: string | null
          numero_whatsapp: string
        }
        Insert: {
          created_at?: string | null
          estilo_fala?: string | null
          id?: string
          nome?: string | null
          numero_whatsapp: string
        }
        Update: {
          created_at?: string | null
          estilo_fala?: string | null
          id?: string
          nome?: string | null
          numero_whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
