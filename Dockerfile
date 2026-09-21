# ── Etapa 1: dependências ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ── Etapa 2: build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Os segredos (ANTHROPIC_API_KEY, MONGODB_URI, AUTH_SECRET) são lidos em
# runtime — não são necessários no build (a ligação ao Mongo é preguiçosa).
#
# Chama o next directamente em vez de `npm run build`: o wrapper
# scripts/next-cased.mjs existe para corrigir a caixa do caminho no Windows,
# problema que não existe dentro de um contentor Linux. Menos uma peça no
# caminho crítico do build.
RUN node node_modules/next/dist/bin/next build

# ── Etapa 3: runner (imagem final mínima) ──────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010
ENV HOSTNAME=0.0.0.0

# Utilizador não-root por segurança
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Ficheiros gerados pelo standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ferramentas de administração por linha de comandos (seed-admin, users, usage,
# settings). Sem elas não há forma de criar o primeiro administrador nem de
# aprovar contas no servidor. Resolvem o driver do Mongo a partir do
# node_modules que o output standalone já traz.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3010

CMD ["node", "server.js"]
