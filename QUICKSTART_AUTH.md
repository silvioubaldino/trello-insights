# 🚀 Quick Start - Autenticação Google OAuth

## ⚡ Início Rápido (5 minutos)

### 1. Gerar AUTH_SECRET

```bash
openssl rand -base64 32
```

Copie o resultado.

### 2. Criar arquivo `.env.local`

Na raiz do projeto, crie o arquivo `.env.local`:

```bash
AUTH_SECRET=cole_o_resultado_do_comando_acima
AUTH_GOOGLE_ID=seu_google_client_id
AUTH_GOOGLE_SECRET=seu_google_client_secret

# Trello (se já configurado)
TRELLO_API_KEY=sua_trello_api_key
TRELLO_API_TOKEN=seu_trello_token
```

### 3. Configurar Google Cloud Console

#### 3.1. Criar Projeto OAuth

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**

#### 3.2. Configurar OAuth Consent Screen

1. Vá em **OAuth consent screen**
2. Escolha **External** (ou **Internal** se tiver Google Workspace)
3. Preencha:
   - App name: **Trello Insights**
   - User support email: seu-email@manacacomunicacao.com.br
   - Developer contact: seu-email@manacacomunicacao.com.br
4. Em **Scopes**, adicione:
   - `userinfo.email`
   - `userinfo.profile`
5. Salve

#### 3.3. Criar Credenciais

1. Volte em **Credentials**
2. **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Application type: **Web application**
4. Name: **Trello Insights Web Client**
5. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Clique em **CREATE**
7. **COPIE o Client ID e Client Secret**

### 4. Atualizar `.env.local`

Cole as credenciais no arquivo `.env.local`:

```bash
AUTH_SECRET=sua_chave_gerada_no_passo_1
AUTH_GOOGLE_ID=cole_o_client_id_aqui
AUTH_GOOGLE_SECRET=cole_o_client_secret_aqui

TRELLO_API_KEY=sua_trello_api_key
TRELLO_API_TOKEN=seu_trello_token
```

### 5. Iniciar o servidor

```bash
npm run dev
```

### 6. Testar

1. Abra: http://localhost:3000
2. Você será redirecionado para `/login`
3. Clique em **Entrar com Google**
4. Faça login com uma conta `@manacacomunicacao.com.br`
5. Você será redirecionado para o dashboard

## ✅ Checklist Rápido

- [ ] `openssl rand -base64 32` executado
- [ ] Arquivo `.env.local` criado
- [ ] Projeto criado no Google Cloud Console
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth criadas
- [ ] Redirect URI configurado: `http://localhost:3000/api/auth/callback/google`
- [ ] Client ID e Secret copiados para `.env.local`
- [ ] `npm run dev` executado
- [ ] Login testado com sucesso

## ❌ Problemas Comuns

### "redirect_uri_mismatch"

**Causa**: URI não cadastrada no Google Cloud Console.

**Solução**: Adicione exatamente `http://localhost:3000/api/auth/callback/google` nas **Authorized redirect URIs**.

### "AccessDenied" após login

**Causa**: E-mail não é `@manacacomunicacao.com.br`.

**Solução**: Use uma conta do domínio autorizado.

### Variável não definida

**Causa**: `.env.local` não está na raiz ou tem nome errado.

**Solução**: Verifique se o arquivo está em `/Users/sineto/github/silvioubaldino/trello-insights/.env.local`.

## 📚 Documentação Completa

- **[AUTH_SETUP.md](./AUTH_SETUP.md)** - Guia detalhado de configuração
- **[TESTING_AUTH.md](./TESTING_AUTH.md)** - Guia de testes completo
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumo técnico da implementação

## 🎯 Próximos Passos

Após testar localmente:

1. Configure as mesmas variáveis na Vercel/plataforma de deploy
2. Adicione a URI de produção no Google Cloud Console
3. Faça deploy

## 💡 Dica

Para testar o bloqueio de domínio, tente fazer login com uma conta `@gmail.com` ou outro domínio. Você deve ver a mensagem de erro e ser bloqueado.

---

**Tempo estimado**: 5-10 minutos (dependendo da familiaridade com Google Cloud Console)


