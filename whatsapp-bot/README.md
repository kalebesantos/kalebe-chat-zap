# 🤖 Bot WhatsApp com Aprendizado de Estilo Humano

Bot inteligente para WhatsApp que **aprende seu estilo de comunicação** e responde como se fosse você! Utiliza IA da OpenAI para gerar respostas personalizadas baseadas no seu jeito de escrever.

## 🚀 Funcionalidades Principais

- ✅ **Aprendizado Automático**: Analisa suas mensagens e aprende seu estilo
- 🧠 **Respostas Humanas**: Responde como você responderia, não como um assistente
- 🎭 **Imitação Perfeita**: Usa suas gírias, emojis e jeito de falar
- 🎤 **Transcrição de Áudio**: Converte áudios em texto e responde naturalmente
- 📱 **Comandos Avançados**: Controle total via WhatsApp
- 💾 **Histórico Completo**: Armazena todas as conversas no Supabase

## 🎯 Como Funciona o Aprendizado

1. **Detecção Automática**: O bot detecta automaticamente seu número quando conecta
2. **Coleta de Mensagens**: Analisa suas mensagens existentes no WhatsApp
3. **Análise de Estilo**: IA identifica seu tom, gírias, emojis e padrões
4. **Imitação Perfeita**: Responde como se fosse você escrevendo

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Chave da API OpenAI
- WhatsApp instalado no celular

## ⚙️ Instalação Rápida

### 1. Configure o ambiente
```bash
cd whatsapp-bot
npm install
cp .env.example .env
```

### 2. Adicione sua chave OpenAI
Edite o arquivo `.env` e adicione:
```
OPENAI_API_KEY=sua_chave_da_openai_aqui
```

### 3. Execute o bot
```bash
npm start
```

### 4. Conecte ao WhatsApp
1. Escaneie o QR Code que aparece no terminal
2. Aguarde a mensagem "Bot conectado e pronto!"
3. O bot automaticamente analisará suas mensagens existentes

## 🎓 Treinando o Bot

### Método 1: Automático (Recomendado)
O bot automaticamente coleta e analisa suas mensagens quando conecta.

### Método 2: Manual
Use comandos para treinar manualmente:

```
/adicionar_msg Oi, tudo bem? Como você está?
/adicionar_msg Valeu pela mensagem! 😊
/analisar_estilo Seu Nome
/ativar_estilo
```

### Método 3: Importar Conversa
1. Exporte uma conversa do WhatsApp (sem mídia)
2. Use: `/processar_export [texto copiado]`

## 💬 Comandos Disponíveis

### 🎯 Aprendizado de Estilo
- `/adicionar_msg [mensagem]` - Ensina uma mensagem sua
- `/analisar_estilo [nome]` - Analisa seu estilo de comunicação
- `/ativar_estilo` - Ativa imitação do seu estilo
- `/desativar_estilo` - Volta ao modo normal
- `/listar_perfis` - Ver perfis disponíveis

### 🔧 Configurações
- `/modo aberto` - Responde a todos
- `/modo restrito` - Só responde conversas ativas
- `/audio on/off` - Liga/desliga transcrição de áudio
- `/status` - Ver status do bot

### 👥 Conversas Ativas (Modo Restrito)
- `/ativar [numero]` - Permite conversa com número
- `/desativar [numero]` - Remove permissão
- `/listar_ativos` - Ver quem pode conversar

## 🎭 Exemplos de Aprendizado

**Antes do treinamento:**
```
Usuário: oi, tudo bem?
Bot: Olá! Como posso ajudá-lo hoje?
```

**Depois do treinamento:**
```
Usuário: oi, tudo bem?
Bot: oi! tudo certo por aqui 😊 e aí, como tá?
```

## 🔧 Configurações Avançadas

### Modo de Operação
- **Aberto**: Responde qualquer pessoa
- **Restrito**: Só responde quem você autorizar

### Transcrição de Áudio
- Converte áudios em texto automaticamente
- Responde no seu estilo baseado no áudio

### Múltiplos Perfis
- Suporte a vários administradores
- Cada um com seu estilo único

## 📊 Painel Web

Acesse o painel web para:
- Ver todas as conversas
- Gerenciar usuários
- Configurar o bot visualmente
- Analisar estatísticas

## 🛠️ Troubleshooting

### Bot responde como assistente
1. Verifique se o estilo está ativo: `/status`
2. Adicione mais mensagens: `/adicionar_msg [sua mensagem]`
3. Reanalise o estilo: `/analisar_estilo Seu Nome`
4. Ative o perfil: `/ativar_estilo`

### Não encontra mensagens automaticamente
1. Use `/adicionar_msg` para ensinar manualmente
2. Exporte uma conversa e use `/processar_export`
3. Certifique-se que há mensagens suas no WhatsApp

### Erro de API
- Verifique se `OPENAI_API_KEY` está correta
- Confirme se tem créditos na OpenAI
- Teste a chave em outros serviços

## 🎯 Dicas para Melhor Aprendizado

1. **Adicione Variedade**: Ensine diferentes tipos de resposta
2. **Use Seus Emojis**: Inclua emojis que você realmente usa
3. **Seja Natural**: Adicione mensagens como você realmente escreve
4. **Contextos Diferentes**: Ensine saudações, despedidas, perguntas, etc.

## 🔒 Privacidade e Segurança

- Suas mensagens ficam no seu banco Supabase
- Chaves API ficam no seu servidor
- Nenhum dado é compartilhado externamente
- Você tem controle total dos dados

## 📈 Próximas Funcionalidades

- [ ] Aprendizado contínuo automático
- [ ] Múltiplos estilos por contexto
- [ ] Integração com mais plataformas
- [ ] Análise de sentimentos
- [ ] Respostas por horário

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**🎯 Objetivo**: Criar um bot que responde tão naturalmente que as pessoas pensem que é você mesmo respondendo!