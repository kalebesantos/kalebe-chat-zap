
# 🤖 Bot WhatsApp com OpenAI e Supabase

Bot inteligente para WhatsApp que utiliza IA da OpenAI para gerar respostas automáticas e Supabase para armazenar dados dos usuários e conversas.

## 🚀 Funcionalidades

- ✅ Autenticação automática via WhatsApp Web (QR Code)
- 🤖 Respostas inteligentes usando OpenAI GPT-3.5/GPT-4
- 👤 Cadastro automático de usuários no Supabase
- 🎭 6 estilos de fala personalizáveis por usuário
- 💾 Armazenamento de todas as conversas
- 📱 Comandos interativos via WhatsApp

## 🎭 Estilos de Fala Disponíveis

- **neutro**: Resposta equilibrada e natural
- **engracado**: Resposta divertida e descontraída  
- **educado**: Resposta formal e respeitosa
- **direto**: Resposta objetiva e prática
- **amigavel**: Resposta calorosa e acolhedora
- **brasileiro**: Resposta com gírias e jeito brasileiro

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Chave da API OpenAI
- WhatsApp instalado no celular

## ⚙️ Configuração

### 1. Clone e instale dependências

```bash
# Clone o projeto
git clone <repositorio>
cd whatsapp-bot

# Instale as dependências
npm install
```

### 2. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e adicione suas chaves:
# - OPENAI_API_KEY: Sua chave da OpenAI
# - SUPABASE_URL e SUPABASE_KEY: Já estão configuradas
```

### 3. Configure a OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma conta ou faça login
3. Vá em "API Keys" e gere uma nova chave
4. Copie a chave e cole no arquivo `.env`

### 4. Execute o bot

```bash
# Inicie o bot
npm start

# Ou para desenvolvimento (com auto-reload)
npm run dev
```

### 5. Autentique no WhatsApp

1. Um QR Code aparecerá no terminal
2. Abra o WhatsApp no seu celular
3. Vá em "Dispositivos conectados" > "Conectar dispositivo"
4. Escaneie o QR Code
5. Aguarde a mensagem "Bot WhatsApp conectado e pronto!"

## 💬 Como usar

### Comandos disponíveis:

- `/ajuda` - Mostra os comandos disponíveis
- `/estilos` - Lista todos os estilos de fala
- `/estilo [nome]` - Altera seu estilo de fala
  - Exemplo: `/estilo engracado`

### Uso normal:

Simplesmente envie qualquer mensagem para o bot e ele responderá usando IA baseada no seu estilo de fala configurado.

## 🗂️ Estrutura do Projeto

```
whatsapp-bot/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração Supabase
│   ├── services/
│   │   ├── userService.js       # Gerenciamento de usuários
│   │   ├── messageService.js    # Gerenciamento de mensagens
│   │   └── openaiService.js     # Integração OpenAI
│   ├── handlers/
│   │   └── messageHandler.js    # Processamento de mensagens
│   └── index.js                 # Arquivo principal
├── .env.example                 # Variáveis de ambiente
├── package.json
└── README.md
```

## 🛠️ Banco de Dados (Supabase)

### Tabela `usuarios`
- `id` (UUID) - Chave primária
- `nome` (TEXT) - Nome do usuário
- `numero_whatsapp` (TEXT) - Número único do WhatsApp
- `estilo_fala` (TEXT) - Estilo de fala personalizado
- `created_at` (TIMESTAMP) - Data de criação

### Tabela `mensagens`
- `id` (UUID) - Chave primária
- `usuario_id` (UUID) - Referência ao usuário
- `mensagem_recebida` (TEXT) - Mensagem recebida
- `mensagem_enviada` (TEXT) - Resposta enviada
- `timestamp` (TIMESTAMP) - Data/hora da conversa

## 🔧 Troubleshooting

### Bot não conecta:
- Verifique se o Node.js 18+ está instalado
- Confirme se todas as dependências foram instaladas
- Verifique as variáveis de ambiente no `.env`

### Erro de autenticação WhatsApp:
- Delete a pasta `.wwebjs_auth` e tente novamente
- Certifique-se de escanear o QR Code rapidamente
- Verifique sua conexão com internet

### Erro na OpenAI:
- Verifique se sua chave API está correta
- Confirme se você tem créditos disponíveis na OpenAI
- Teste a chave em outros serviços OpenAI

### Erro no Supabase:
- Verifique as URLs e chaves do Supabase
- Confirme se as tabelas foram criadas corretamente
- Verifique as políticas RLS se necessário

## 📝 Logs

O bot exibe logs detalhados no console:
- 📱 Mensagens recebidas
- 👤 Usuários encontrados/criados
- 🤖 Respostas geradas
- 💾 Dados salvos no banco
- ❌ Erros e problemas

## 🔒 Segurança

- Nunca compartilhe suas chaves API
- Use `.env` para variáveis sensíveis
- Mantenha o arquivo `.env` fora do controle de versão
- Configure políticas RLS no Supabase conforme necessário

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.
