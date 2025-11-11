# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a453928e-c3c1-4268-bef5-f5b316034895

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a453928e-c3c1-4268-bef5-f5b316034895) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Next.js (App Router)
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🔐 Configuração Segura - Migração Next.js

**⚠️ IMPORTANTE:** Este projeto usa Next.js para proteger suas credenciais do Trello no servidor.

### 📖 Documentação Completa

- **[SETUP.md](./SETUP.md)** - Guia completo de instalação e configuração
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Auditoria de segurança e fluxo de dados

### 🚀 Quick Start

1. **Obter credenciais do Trello:**
   - Acesse: https://trello.com/app-key
   - Copie sua **API Key** e gere um **Token**

2. **Criar arquivo `.env.local`:**
   ```bash
   TRELLO_API_KEY=sua_api_key_aqui
   TRELLO_API_TOKEN=seu_token_aqui
   ```

3. **Instalar e executar:**
   ```bash
   npm install
   npm run dev
   ```

### 🔒 Arquitetura de Segurança

```
Browser → /api/trello/* → src/server/trello.ts → api.trello.com
(público)   (servidor)      (credenciais)         (API Trello)
```

✅ **Credenciais protegidas** - nunca expostas ao navegador  
✅ **API Routes server-side** - todas as chamadas passam pelo servidor  
✅ **`'server-only'`** - garante execução apenas no servidor  
✅ **Cache inteligente** - 1 hora de cache para otimizar performance  

### 📡 API Endpoints

- `GET /api/trello/cards/[boardId]` - Busca cards do board
- `GET /api/trello/actions/[boardId]` - Busca ações (movimentos, rejeições)
- `GET /api/trello/actions/[boardId]?since=2025-01-01` - Actions com paginação

### 🎯 Deploy na Vercel

1. Configure as variáveis de ambiente no dashboard da Vercel:
   - `TRELLO_API_KEY`
   - `TRELLO_API_TOKEN`
2. Faça deploy normalmente
3. As credenciais ficam protegidas no servidor

**Veja [SETUP.md](./SETUP.md) para instruções detalhadas**

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a453928e-c3c1-4268-bef5-f5b316034895) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
