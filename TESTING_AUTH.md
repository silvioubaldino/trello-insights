# Guia de Testes - Autenticação Google OAuth

Este documento descreve os testes manuais para validar a implementação de autenticação.

## Pré-requisitos para Testes

Antes de testar, certifique-se de que:

1. ✅ Dependência `next-auth` instalada
2. ✅ Arquivo `.env.local` configurado com:
   - `AUTH_SECRET` (gerado com `openssl rand -base64 32`)
   - `AUTH_GOOGLE_ID` (do Google Cloud Console)
   - `AUTH_GOOGLE_SECRET` (do Google Cloud Console)
3. ✅ OAuth configurado no Google Cloud Console com redirect URI: `http://localhost:3000/api/auth/callback/google`
4. ✅ Servidor rodando (`npm run dev`)

## Checklist de Validação

### 1. Proteção de Rotas - Usuário NÃO Autenticado

| Teste | URL | Resultado Esperado | Status |
|-------|-----|-------------------|--------|
| Acesso à home | `http://localhost:3000/` | Redireciona para `/login` | ⬜ |
| Acesso direto ao dashboard | `http://localhost:3000/` | Redireciona para `/login` | ⬜ |
| Acesso à API de cards | `http://localhost:3000/api/trello/cards/[boardId]` | Redireciona para `/login` | ⬜ |
| Acesso à API de actions | `http://localhost:3000/api/trello/actions/[boardId]` | Redireciona para `/login` | ⬜ |
| Acesso à página de login | `http://localhost:3000/login` | Exibe página de login | ⬜ |

### 2. Fluxo de Login - Domínio Autorizado

| Teste | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| Clicar "Entrar com Google" | Na página `/login` | Redireciona para Google OAuth | ⬜ |
| Selecionar conta autorizada | Conta `@manacacomunicacao.com.br` | Login bem-sucedido | ⬜ |
| Redirecionamento pós-login | Após autenticação | Redireciona para `/` (dashboard) | ⬜ |
| Acesso ao dashboard | Após login | Dashboard carrega normalmente | ⬜ |
| Persistência de sessão | Recarregar página | Mantém usuário logado | ⬜ |

### 3. Bloqueio por Domínio - Domínio NÃO Autorizado

| Teste | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| Login com Gmail pessoal | `usuario@gmail.com` | Bloqueado e retorna ao `/login` | ⬜ |
| Mensagem de erro | Após bloqueio | Exibe "Acesso permitido apenas para o domínio @manacacomunicacao.com.br" | ⬜ |
| URL contém erro | Após bloqueio | URL é `/login?error=AccessDenied` | ⬜ |
| Login com Outlook | `usuario@outlook.com` | Bloqueado e retorna ao `/login` | ⬜ |
| Login com outro domínio | `usuario@outrodominio.com.br` | Bloqueado e retorna ao `/login` | ⬜ |

### 4. Acesso a Recursos Protegidos - Usuário Autenticado

| Teste | URL | Resultado Esperado | Status |
|-------|-----|-------------------|--------|
| Dashboard principal | `http://localhost:3000/` | Carrega dashboard com dados | ⬜ |
| API de cards | `http://localhost:3000/api/trello/cards/[boardId]` | Retorna JSON com cards | ⬜ |
| API de actions | `http://localhost:3000/api/trello/actions/[boardId]` | Retorna JSON com actions | ⬜ |
| Filtros funcionando | Sidebar de filtros | Filtros aplicam corretamente | ⬜ |
| Gráficos carregando | Dashboard | Todos os gráficos renderizam | ⬜ |

### 5. Assets e Recursos Públicos

| Teste | URL | Resultado Esperado | Status |
|-------|-----|-------------------|--------|
| Favicon | `http://localhost:3000/favicon.ico` | Carrega sem autenticação | ⬜ |
| Imagens públicas | `http://localhost:3000/android-chrome-192x192.png` | Carrega sem autenticação | ⬜ |
| Robots.txt | `http://localhost:3000/robots.txt` | Carrega sem autenticação | ⬜ |

### 6. Logout e Sessão

| Teste | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| Logout (se implementado) | Clicar em botão de logout | Desloga e redireciona para `/login` | ⬜ |
| Acesso após logout | Tentar acessar `/` | Redireciona para `/login` | ⬜ |
| Nova aba (mesma sessão) | Abrir nova aba com `/` | Mantém sessão ativa | ⬜ |
| Navegador privado | Abrir em modo anônimo | Requer novo login | ⬜ |

## Testes de Segurança Avançados

### 7. Tentativas de Bypass

| Teste | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| Manipular cookie | Alterar cookie de sessão | Invalida sessão, redireciona para `/login` | ⬜ |
| Token JWT inválido | Cookie com JWT malformado | Invalida sessão, redireciona para `/login` | ⬜ |
| Acesso direto à API | `curl` sem autenticação | Retorna erro ou redireciona | ⬜ |

## Como Executar os Testes

### Teste 1: Proteção de Rotas (Não Autenticado)

```bash
# 1. Abra o navegador em modo anônimo
# 2. Acesse http://localhost:3000/
# 3. Verifique se foi redirecionado para /login
# 4. Tente acessar /api/trello/cards/test no navegador
# 5. Verifique se foi redirecionado para /login
```

### Teste 2: Login com Domínio Autorizado

```bash
# 1. Na página /login, clique em "Entrar com Google"
# 2. Selecione uma conta @manacacomunicacao.com.br
# 3. Verifique se foi redirecionado para / (dashboard)
# 4. Verifique se o dashboard carregou corretamente
# 5. Recarregue a página e verifique se continua logado
```

### Teste 3: Bloqueio por Domínio

```bash
# 1. Faça logout (ou use modo anônimo)
# 2. Na página /login, clique em "Entrar com Google"
# 3. Selecione uma conta de outro domínio (ex: @gmail.com)
# 4. Verifique se foi bloqueado e retornou para /login
# 5. Verifique se a mensagem de erro aparece
# 6. Verifique se a URL contém ?error=AccessDenied
```

### Teste 4: Acesso a APIs Protegidas

```bash
# 1. Com usuário autenticado, abra o DevTools (F12)
# 2. Vá para a aba Network
# 3. Recarregue o dashboard
# 4. Verifique se as chamadas para /api/trello/* retornam 200 OK
# 5. Verifique se os dados são carregados corretamente
```

### Teste 5: Persistência de Sessão

```bash
# 1. Faça login com conta autorizada
# 2. Feche a aba (não o navegador)
# 3. Abra uma nova aba e acesse http://localhost:3000/
# 4. Verifique se continua autenticado
# 5. Feche o navegador completamente
# 6. Abra novamente e acesse http://localhost:3000/
# 7. Verifique se precisa fazer login novamente
```

## Comandos Úteis para Debug

### Verificar variáveis de ambiente

```bash
# Verificar se as variáveis estão carregadas (não exibe valores por segurança)
npm run dev
# Procure por erros relacionados a AUTH_SECRET, AUTH_GOOGLE_ID, etc.
```

### Limpar cache e cookies

```bash
# Chrome/Edge: Ctrl+Shift+Del
# Firefox: Ctrl+Shift+Del
# Safari: Cmd+Option+E
```

### Verificar logs do NextAuth

```bash
# Os logs aparecem no terminal onde você rodou npm run dev
# Procure por mensagens como:
# - [auth][error] signIn
# - [auth][error] callback
```

## Problemas Comuns e Soluções

### ❌ "redirect_uri_mismatch"

**Solução**: Verifique se `http://localhost:3000/api/auth/callback/google` está cadastrado no Google Cloud Console.

### ❌ Redirecionamento infinito

**Solução**: Verifique se a rota `/login` está excluída no matcher do middleware.

### ❌ "AccessDenied" mesmo com domínio correto

**Solução**: Verifique se o e-mail da conta Google realmente termina com `@manacacomunicacao.com.br`.

### ❌ Sessão não persiste

**Solução**: Verifique se `AUTH_SECRET` está configurado no `.env.local`.

## Relatório de Testes

Após executar todos os testes, preencha o relatório:

```
Data: ___/___/______
Testador: _________________

Testes Executados: ___/30
Testes Aprovados: ___/30
Testes Falhados: ___/30

Observações:
_________________________________
_________________________________
_________________________________
```

## Conclusão

Todos os testes devem passar para considerar a implementação completa e segura.

Se algum teste falhar, revise:
1. Configuração do `.env.local`
2. Configuração do Google Cloud Console
3. Código do middleware (`src/middleware.ts`)
4. Código de autenticação (`src/auth.ts`)


