
#!/bin/bash

echo "🚀 Configurando Bot WhatsApp com OpenAI e Supabase..."

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verifica versão do Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instala dependências
echo "📦 Instalando dependências..."
npm install

# Cria arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env e adicione sua OPENAI_API_KEY"
else
    echo "✅ Arquivo .env já existe"
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env e adicione sua OPENAI_API_KEY"
echo "2. Execute: npm start"
echo "3. Escaneie o QR Code com o WhatsApp"
echo ""
echo "💡 Comandos disponíveis:"
echo "   npm start    - Inicia o bot"
echo "   npm run dev  - Inicia em modo desenvolvimento"
echo ""
