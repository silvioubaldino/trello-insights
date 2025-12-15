# Configuração de Autenticação Google OAuth

Este documento descreve como configurar a autenticação Google OAuth para o Trello Insights.

## Pré-requisitos

- Conta Google Cloud Platform
- Acesso ao domínio @manacacomunicacao.com.br

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Anote o nome do projeto

## Passo 2: Configurar OAuth Consent Screen

1. No menu lateral, vá em **APIs & Services** > **OAuth consent screen**
2. Selecione **Internal** (se disponível) ou **External**
3. Preencha as informações:
   - **App name**: Trello Insights
   - **User support email**: seu-email@manacacomunicacao.com.br
   - **Developer contact**: seu-email@manacacomunicacao.com.br
4. Clique em **Save and Continue**
5. Em **Scopes**, adicione:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Clique em **Save and Continue**

## Passo 3: Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Selecione **Application type**: Web application
4. Preencha:
   - **Name**: Trello Insights Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-dominio.com` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
     - `https://seu-dominio.com/api/auth/callback/google` (produção)
5. Clique em **CREATE**
6. **Copie o Client ID e Client Secret** - você precisará deles!

## Passo 4: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie o arquivo `.env.local`:

```bash
# Gere uma chave secreta aleatória
AUTH_SECRET=

# Cole as credenciais do Google Cloud Console
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Trello API (se já configurado)
TRELLO_API_KEY=
TRELLO_API_TOKEN=
```

2. Gere o `AUTH_SECRET` executando no terminal:

```bash
openssl rand -base64 32
```

3. Cole o resultado no arquivo `.env.local`

4. Cole o **Client ID** em `AUTH_GOOGLE_ID`

5. Cole o **Client Secret** em `AUTH_GOOGLE_SECRET`

## Passo 5: Testar a Autenticação

1. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

2. Acesse http://localhost:3000

3. Você será redirecionado para `/login`

4. Clique em **Entrar com Google**

5. Faça login com uma conta `@manacacomunicacao.com.br`

6. Você será redirecionado para o dashboard

## Validações de Segurança

### ✅ Testes que devem PASSAR:

- Login com e-mail `@manacacomunicacao.com.br` → Acesso concedido
- Acesso a `/` autenticado → Dashboard carregado
- Acesso a `/api/trello/*` autenticado → Dados retornados

### ❌ Testes que devem FALHAR:

- Login com e-mail de outro domínio → Redirecionado para `/login?error=AccessDenied`
- Acesso a `/` sem autenticação → Redirecionado para `/login`
- Acesso a `/api/trello/*` sem autenticação → Redirecionado para `/login`

## Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: A URI de redirecionamento não está configurada no Google Cloud Console.

**Solução**: Verifique se a URI exata está cadastrada em **Authorized redirect URIs**.

### Erro: "Access blocked: This app's request is invalid"

**Causa**: O OAuth consent screen não está configurado corretamente.

**Solução**: Complete todas as etapas do OAuth consent screen.

### Erro: "AccessDenied" após login

**Causa**: O e-mail não pertence ao domínio @manacacomunicacao.com.br.

**Solução**: Use uma conta do domínio autorizado.

### Erro: "AUTH_SECRET is not set"

**Causa**: A variável `AUTH_SECRET` não está definida no `.env.local`.

**Solução**: Gere e configure a variável conforme o Passo 4.

## Deploy em Produção

### Vercel

1. No dashboard da Vercel, vá em **Settings** > **Environment Variables**
2. Adicione as variáveis:
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `TRELLO_API_KEY`
   - `TRELLO_API_TOKEN`
3. No Google Cloud Console, adicione a URI de produção:
   - `https://seu-dominio.vercel.app/api/auth/callback/google`
4. Faça o deploy

### Outras Plataformas

1. Configure as variáveis de ambiente na plataforma
2. Adicione a URI de callback no Google Cloud Console
3. Faça o deploy

## Segurança

- ✅ Credenciais nunca expostas no código
- ✅ Sessões via JWT (sem banco de dados necessário)
- ✅ Validação de domínio em duas camadas (callback + middleware)
- ✅ Proteção automática de todas as rotas
- ✅ Tokens seguros gerados aleatoriamente

## Suporte

Para problemas ou dúvidas, consulte:
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)


