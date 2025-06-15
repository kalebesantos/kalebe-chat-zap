
# Painel Administrativo - Bot WhatsApp

Um painel web completo para gerenciar seu bot de WhatsApp integrado com OpenAI e Supabase.

## 🚀 Funcionalidades

### 🔐 Autenticação
- Sistema de login/logout seguro
- Cadastro de novos administradores
- Autenticação via Supabase Auth

### 👥 Gerenciamento de Usuários
- Visualizar todos os usuários cadastrados no bot
- Editar nome e estilo de fala de cada usuário
- Informações detalhadas (número WhatsApp, data de cadastro)
- 6 estilos de fala disponíveis: Neutro, Engraçado, Educado, Direto, Amigável, Brasileiro

### 💬 Histórico de Mensagens
- Visualizar todas as conversas entre usuários e o bot
- Filtrar mensagens por usuário específico
- Buscar por texto nas mensagens
- Paginação para melhor performance
- Interface intuitiva separando mensagens do usuário e respostas do bot

### 📱 Interface Responsiva
- Design moderno e limpo
- Compatível com desktop, tablet e mobile
- Componentes shadcn/ui para uma experiência consistente
- Navegação por abas entre funcionalidades

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database + Authentication)
- **Icons**: Lucide React
- **State Management**: React Query + React Hooks

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Projeto Supabase configurado
- Bot WhatsApp já funcionando (conforme pasta `whatsapp-bot/`)

## 🚀 Como executar

### 1. Instalação
```bash
# Clone o repositório (se necessário)
git clone [seu-repositorio]

# Instale as dependências
npm install
```

### 2. Configuração
O projeto já está configurado para usar o Supabase. As variáveis de ambiente estão definidas em:
- `src/integrations/supabase/client.ts`

### 3. Execução
```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### 4. Primeiro acesso
1. Acesse `http://localhost:5173`
2. Clique em "Não tem conta? Cadastre-se"
3. Crie sua conta de administrador
4. Faça login e acesse o painel

## 📊 Estrutura do Banco de Dados

O painel utiliza as mesmas tabelas do bot WhatsApp:

### Tabela `usuarios`
```sql
- id (UUID, PK)
- nome (TEXT)
- numero_whatsapp (TEXT, UNIQUE)
- estilo_fala (TEXT, DEFAULT 'neutro')
- created_at (TIMESTAMP)
```

### Tabela `mensagens`
```sql
- id (UUID, PK)
- usuario_id (UUID, FK -> usuarios.id)
- mensagem_recebida (TEXT)
- mensagem_enviada (TEXT)
- timestamp (TIMESTAMP)
```

## 🔧 Configuração do Supabase

### Autenticação
1. No painel do Supabase, vá para `Authentication > Settings`
2. Configure a URL do site: `http://localhost:5173` (desenvolvimento)
3. Adicione URLs de redirecionamento conforme necessário

### Políticas RLS
As tabelas já possuem políticas RLS configuradas para acesso público, permitindo que o painel funcione corretamente.

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── AuthPage.tsx        # Página de autenticação
│   ├── Dashboard.tsx       # Painel principal
│   ├── UsersTable.tsx      # Tabela de usuários
│   └── MessagesView.tsx    # Visualização de mensagens
├── integrations/
│   └── supabase/          # Configuração Supabase
├── pages/
│   └── Index.tsx          # Página inicial
└── lib/
    └── utils.ts           # Utilitários
```

## 🔍 Funcionalidades Detalhadas

### Gerenciamento de Usuários
- **Listagem**: Visualize todos os usuários com paginação automática
- **Edição**: Clique no ícone de edição para alterar nome e estilo de fala
- **Estilos disponíveis**:
  - 🤖 Neutro - Respostas equilibradas e naturais
  - 😂 Engraçado - Humor brasileiro e descontração
  - 🎩 Educado - Linguagem formal e respeitosa
  - ⚡ Direto - Respostas objetivas e práticas
  - 😊 Amigável - Tom caloroso e acolhedor
  - 🇧🇷 Brasileiro - Gírias e expressões regionais

### Histórico de Mensagens
- **Visualização**: Mensagens organizadas cronologicamente
- **Filtros**: Por usuário específico ou busca por texto
- **Paginação**: 10 mensagens por página para performance
- **Design**: Interface clara separando mensagens enviadas e recebidas

### Segurança
- **Autenticação obrigatória**: Apenas usuários autenticados acessam o painel
- **Session management**: Controle automático de sessões
- **RLS**: Row Level Security no Supabase para proteção dos dados

## 🚀 Deploy

Para fazer deploy em produção:

1. **Build do projeto**:
```bash
npm run build
```

2. **Deploy no Vercel/Netlify**:
   - Conecte seu repositório
   - Configure as variáveis de ambiente se necessário
   - O build será automático

3. **Configurar Supabase**:
   - Adicione a URL de produção nas configurações de autenticação
   - Atualize as URLs de redirecionamento

## 🤝 Integração com o Bot

Este painel trabalha com os mesmos dados do bot WhatsApp localizado na pasta `whatsapp-bot/`. 

**Fluxo completo**:
1. Usuário interage com o bot no WhatsApp
2. Bot cadastra/atualiza usuário no Supabase
3. Bot salva mensagens trocadas no Supabase
4. Painel web exibe e permite gerenciar esses dados

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o Supabase está configurado corretamente
2. Confirme se as tabelas existem no banco
3. Verifique as políticas RLS
4. Consulte os logs do navegador para erros

## 🔮 Próximas Funcionalidades

Possíveis melhorias futuras:
- Dashboard com estatísticas de uso
- Exportação de dados em CSV/PDF
- Configuração de respostas automáticas
- Sistema de notificações
- Análise de sentimentos das conversas
- Integração com múltiplos bots
