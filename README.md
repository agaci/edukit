# EduKit

Aplicação web educacional para o ensino português **do 1.º ao 12.º ano** (ensino básico e secundário), com três módulos de treino e correção inteligente por IA (Claude). A persona do professor e a dificuldade dos conteúdos adaptam-se automaticamente ao ano escolar escolhido:

1. **Ditado** — o aluno ouve um texto (voz do browser, gratuita), escreve no teclado ou tira foto do papel, e recebe nota de 0 a 20 com correção da ortografia.
2. **Compreensão Escrita** — o aluno lê um texto que depois se fecha permanentemente, escreve sobre o que leu, e é avaliado em 4 critérios.
3. **Matemática** — o aluno resolve no papel, fotografa, e o Claude Vision analisa o raciocínio manuscrito e corrige.

Tudo funciona em **tablet** (uso principal) e desktop. As notas e o histórico ficam guardados **apenas no dispositivo** (localStorage).

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS v3** (design system próprio)
- **Anthropic SDK** (`@anthropic-ai/sdk`) — modelo `claude-opus-4-8` (texto + visão)
- **MongoDB Atlas** (`mongodb`) — utilizadores e trabalhos
- **Autenticação** com sessão JWT em cookie httpOnly (`jose`) + `bcryptjs`
- **Web Speech API** nativa do browser (TTS gratuito)
- **Framer Motion** (animações) + **Lucide React** (ícones)

A chave da API e a ligação à base de dados **nunca** vão para o cliente: todas as
chamadas ao Claude e ao Mongo passam pelas **API Routes** do Next.js (server-side).

## Perfis: Tutor e Aluno

- O **tutor** cria conta, adiciona **alunos** (cada aluno tem um *utilizador único* +
  PIN) e cria **trabalhos**: gera em sequência um Ditado, uma Compreensão e uma
  Matemática, pré-vê cada um, e atribui o conjunto a um aluno.
- O **aluno** entra com o seu utilizador + PIN e vê logo os trabalhos. Resolve os 3
  exercícios em sequência. Cada exercício recebe uma nota e o trabalho tem uma
  **nota final = média das três**.

---

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# editar .env.local e preencher:
#   ANTHROPIC_API_KEY  — chave da Anthropic
#   MONGODB_URI        — connection string do MongoDB Atlas
#   MONGODB_DB         — nome da base de dados (ex.: edukit)
#   AUTH_SECRET        — string longa e aleatória (assina as sessões)

# 3. Arrancar em desenvolvimento
npm run dev
```

### MongoDB Atlas

1. Cria um cluster gratuito em [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Em **Database → Connect → Drivers**, copia a connection string
   (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/...`) para `MONGODB_URI`.
3. Em **Network Access**, autoriza o teu IP (ou `0.0.0.0/0` em testes).
4. Os índices (utilizador único, etc.) são criados automaticamente na primeira
   utilização.

Abre [http://localhost:3000](http://localhost:3000).

### Configurar a `ANTHROPIC_API_KEY`

1. Cria uma conta em [console.anthropic.com](https://console.anthropic.com).
2. Gera uma API key.
3. Coloca-a em `.env.local`:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

A chave é lida apenas no servidor (`lib/anthropic.ts`) e nunca é exposta no browser.

---

## Fluxo de utilização

### Tutor (pai/professor)
1. Escolhe um módulo na página inicial.
2. Configura o exercício (tema, ano escolar, dificuldade, modo de submissão, tempos…).
3. Define um **PIN de 4 dígitos** (padrão `1234` — convém alterar em **Definições**).
4. Gera o conteúdo e entrega o tablet ao aluno.

### Aluno
- **Ditado:** ouve o texto (com controlos de velocidade e repetição), escreve ou fotografa, entrega.
- **Compreensão:** lê com cronómetro, o texto fecha, escreve sobre o que leu, entrega.
- **Matemática:** resolve no papel (pode imprimir), fotografa a resolução, envia.

Para voltar à configuração (área do tutor), é pedido o PIN.

### Resultados
- Nota animada de 0 a 20 com cores por intervalo (vermelho/laranja/verde/dourado).
- Lista de erros com correção e explicação simples.
- Feedback pedagógico do professor (Claude).
- Histórico e relatório imprimível em `/relatorio`.

---

## Estrutura

```
app/            páginas (App Router) + API routes
components/     UI, layout e componentes partilhados
hooks/          useTTS, useTimer, useCamera
lib/            cliente Anthropic, prompts, storage, utils
types/          tipos TypeScript globais
```

---

## Scripts

| Comando         | Descrição                          |
| --------------- | ---------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento        |
| `npm run build` | Build de produção                  |
| `npm run start` | Servir o build de produção         |
| `npm run lint`  | Linting                            |

---

## Privacidade

- Sem autenticação online — tudo é local.
- O histórico vive no `localStorage` do dispositivo.
- As fotos são enviadas ao Claude apenas para correção e não são armazenadas pela app.

---

Feito para tornar o estudo numa aventura.
