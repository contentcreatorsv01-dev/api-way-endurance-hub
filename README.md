# API WAY ENDURANCE HUB

Backend API para o app WAY Endurance — coaches de corrida com IA (Maya e Luca).

## Stack
- **Runtime:** Node.js 22+ / TypeScript
- **Framework:** Express 5
- **AI:** NVIDIA NIM API (meta/llama-3.1-8b-instruct)
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Vercel (serverless)

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/healthz` | Health check |
| POST | `/api/way-profile` | Salvar perfil do onboarding |
| GET | `/api/coach/status` | Status da IA |
| GET | `/api/coach/info/:coach` | Info do coach (maya/luca) |
| POST | `/api/coach/chat` | Chat com coach IA |
| POST | `/api/coach/greeting` | Saudação do coach |

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Rodar
npm run dev
```

## Variáveis de Ambiente (Vercel)

Configure no dashboard da Vercel em **Settings → Environment Variables**:

```
SUPABASE_URL
SUPABASE_KEY
NVIDIA_API_KEY
NVIDIA_API_URL
NVIDIA_MODEL
AI_COACH_ENABLED
NODE_ENV
```

## Deploy

Deploy automático via GitHub push para `main`.
