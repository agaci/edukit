# EduKit — Prompt Evolutivo para Claude Code (Next.js 14 + Tailwind)

> Usa este prompt em sessões sequenciais no Claude Code (VS Code). Cada fase é autónoma mas evolutiva — podes parar e retomar. Lê o prompt completo antes de começar a Fase 1.

---

## CONTEXTO GLOBAL DO PROJECTO

Estás a construir **EduKit**, uma aplicação web educacional para o ensino primário português, com três módulos de treino:

1. **Ditado** — o LLM gera um texto; o aluno ouve via TTS (Web Speech API); escreve no teclado OU tira foto do papel; o Claude corrige e atribui nota de 0 a 20.
2. **Compreensão Escrita** — o LLM gera um texto; o aluno lê; o texto fecha-se permanentemente; o aluno escreve um texto livre sobre o tema; o Claude avalia compreensão, coerência e expressão; atribui nota de 0 a 20; mede o tempo do exercício.
3. **Matemática** — o LLM gera exercícios; o aluno resolve no papel; tira foto; o Claude Vision analisa a resolução manuscrita, corrige, identifica erros de raciocínio e atribui nota de 0 a 20.

**Stack obrigatória:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v3
- Anthropic SDK (`@anthropic-ai/sdk`)
- Web Speech API nativa do browser (TTS gratuito, sem custo)
- API Routes do Next.js para chamadas ao Claude (a chave API nunca vai ao cliente)

**Identidade visual:**
- Público: crianças do 1.º ciclo + tutores/pais
- Paleta: fundo branco/cinza muito claro (`#F8FAFC`), acento principal verde-lima vibrante (`#84CC16`), acento secundário azul índigo (`#6366F1`), texto escuro (`#1E293B`), erros em vermelho-coral (`#F87171`), sucesso em verde (`#22C55E`)
- Tipografia: `Nunito` (display, arredondado, amigável) + `Inter` (corpo/UI)
- Raio de borda generoso (cards com `rounded-2xl`), sombras suaves, ícones Lucide React
- Motion: micro-animações subtis com Framer Motion (entrada de cards, transições de estado)
- Design responsivo: funciona em tablet (uso principal) e desktop

---

## FASE 1 — Scaffolding, Design System e Layout Base

### Objectivo
Criar o projecto Next.js completo com estrutura de pastas, design system, navegação e páginas shell vazias mas com UI completa.

### Instruções para o Claude Code

```
Cria um projecto Next.js 14 com App Router em TypeScript chamado "edukit".

DEPENDÊNCIAS a instalar:
- tailwindcss postcss autoprefixer
- @anthropic-ai/sdk
- framer-motion
- lucide-react
- @fontsource/nunito @fontsource/inter

ESTRUTURA DE PASTAS a criar:
edukit/
├── app/
│   ├── layout.tsx              # Root layout com fontes e providers
│   ├── page.tsx                # Homepage / Dashboard
│   ├── ditado/
│   │   └── page.tsx
│   ├── compreensao/
│   │   └── page.tsx
│   ├── matematica/
│   │   └── page.tsx
│   └── api/
│       ├── gerar-texto/
│       │   └── route.ts        # Gera texto via Claude
│       ├── corrigir/
│       │   └── route.ts        # Corrige exercício via Claude
│       └── gerar-exercicio/
│           └── route.ts        # Gera exercícios de matemática
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── ModuleCard.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── ScoreDisplay.tsx    # Nota de 0-20 com animação
│   │   ├── LoadingSpinner.tsx
│   │   └── ProgressBar.tsx
│   └── shared/
│       ├── PinGate.tsx         # Componente PIN tutor/aluno
│       ├── PhotoCapture.tsx    # Câmara + upload de foto
│       └── Timer.tsx           # Cronómetro visual
├── lib/
│   ├── anthropic.ts            # Cliente Anthropic (server-side only)
│   ├── prompts.ts              # Todos os system prompts centralizados
│   └── utils.ts
├── hooks/
│   ├── useTTS.ts               # Hook Web Speech API
│   ├── useTimer.ts             # Hook cronómetro
│   └── useCamera.ts            # Hook câmara/upload
├── types/
│   └── index.ts                # Tipos TypeScript globais
└── .env.local.example

DESIGN SYSTEM — implementa em tailwind.config.ts:
- Cores custom: primary (#84CC16), secondary (#6366F1), danger (#F87171), success (#22C55E), surface (#F8FAFC)
- Fonte display: Nunito (weights 400,600,700,800)
- Fonte body: Inter (weights 400,500,600)
- Animações custom: fadeIn, slideUp, pulse-soft

HOMEPAGE (app/page.tsx):
- Header com logo EduKit (ícone de livro + lápis em SVG inline, verde-lima)
- Subtítulo: "Aprender é uma aventura"  
- Grid 3 colunas com ModuleCard para cada módulo
- Cada card tem: ícone grande, nome do módulo, descrição curta, nível de dificuldade configurável, botão "Começar"
- Footer simples com créditos

NAVBAR:
- Logo à esquerda
- Links aos 3 módulos
- Indicador do módulo activo
- Sem autenticação (é local)

TYPES (types/index.ts) — define estas interfaces:
- ExerciseConfig { gradeLevel, difficulty, language, inputMode }
- ExerciseResult { score: number (0-20), feedback: string, corrections: Correction[], timeSpent?: number }
- Correction { original: string, correct: string, explanation: string }
- TTSConfig { rate: number, pitch: number, voice: string }
- AppSettings { inputMode: 'keyboard' | 'photo' | 'both', gradeLevel: number, tutorPin: string }

Não implementes ainda a lógica dos módulos — apenas UI shell com estados vazios e placeholders.
Garante que o projecto arranca sem erros com `npm run dev`.
```

---

## FASE 2 — Módulo Ditado

### Objectivo
Implementar o fluxo completo do ditado: geração de texto → TTS com controlos → submissão (teclado ou foto) → correção → nota.

### Instruções para o Claude Code

```
Implementa o módulo Ditado completo em app/ditado/page.tsx e componentes associados.

FLUXO DO MÓDULO (4 estados distintos com transição animada):

ESTADO 1 — CONFIGURAÇÃO (vista do tutor, protegida por PIN)
- Campo de prompt livre: "Descreve o tipo de texto para o ditado" (ex: "texto sobre animais da floresta, nível 3.º ano, 5 frases")
- Selector de ano escolar (1.º ao 4.º ano)
- Selector de dificuldade (Fácil / Médio / Difícil)
- Toggle: modo de submissão do aluno (Teclado / Foto / Ambos à escolha do aluno)
- Botão "Gerar Texto" → chama API route /api/gerar-texto
- Após geração: mostra preview do texto gerado ao tutor com opção de "Regenerar" ou "Aceitar e Avançar"
- PIN de 4 dígitos para passar ao estado do aluno (o tutor define antes de avançar)

ESTADO 2 — DITADO ATIVO (vista do aluno)
- O texto está completamente oculto (não existe no DOM visível)
- Painel de controlos TTS visível e amigável:
  - Botão grande "▶ Ouvir" / "⏸ Pausar"  
  - Botão "⟳ Repetir tudo"
  - Slider de velocidade (0.5x a 1.5x) com label "Velocidade"
  - Contador de reproduções (ex: "Reproduzido 2x")
  - Máximo de reproduções configurável pelo tutor (default: 3x)
- Instruções claras: "Ouve com atenção e escreve o que ouves"
- Após ouvir pelo menos 1x, aparece o botão "Já escrevi, entregar"

ESTADO 3 — SUBMISSÃO DO ALUNO
- Se modo Teclado: textarea grande, limpa, com contador de palavras
- Se modo Foto: componente PhotoCapture (câmara ou upload de ficheiro)
- Se modo Ambos: o aluno escolhe com dois botões grandes
- Botão "Entregar Ditado" → chama /api/corrigir

ESTADO 4 — RESULTADOS
- ScoreDisplay animado: nota de 0 a 20 com círculo de progresso colorido
  - 0-9: vermelho, 10-13: laranja, 14-17: verde, 18-20: dourado com estrelas
- Lista de erros encontrados com formato:
  - ❌ palavra errada → ✅ palavra correcta + explicação breve
- Feedback geral do Claude (2-3 frases pedagógicas)
- Tempo total do exercício
- Botões: "Novo Ditado" / "Ver Texto Original"

API ROUTES a implementar:

/api/gerar-texto/route.ts:
- Recebe: { prompt, gradeLevel, difficulty }
- System prompt em lib/prompts.ts: gera texto para ditado em português europeu, adequado ao ano escolar, com vocabulário apropriado, sem caracteres especiais difíceis de pronunciar pelo TTS, máximo 100 palavras para 1.º/2.º ano, 150 para 3.º/4.º
- Retorna: { text: string, wordCount: number, estimatedDuration: number }

/api/corrigir/route.ts (para ditado):
- Recebe: { originalText, studentText?, photoBase64?, mimeType? }
- Se foto: usa Claude Vision para ler o manuscrito antes de corrigir
- System prompt: és um professor de português do ensino primário português. Avalia o ditado comparando com o original. Critérios: ortografia (40%), acentuação (25%), pontuação (20%), maiúsculas (15%). Atribui nota de 0 a 20 com uma casa decimal. Identifica cada erro com localização, palavra errada, forma correcta e explicação simples. Responde em JSON estruturado.
- Retorna: ExerciseResult

HOOK useTTS.ts:
- Usa window.SpeechSynthesis
- Selecciona automaticamente voz em pt-PT se disponível, senão pt-BR
- Expõe: speak(text, config), pause(), resume(), stop(), isPlaying, currentWord (highlight)
- Respeita o limite de reproduções
- Divide o texto em frases para melhor controlo

COMPONENTE PhotoCapture.tsx:
- Dois modos: câmara (getUserMedia) ou upload de ficheiro
- Preview da imagem capturada com opção de refazer
- Converte para base64 para enviar à API
- Feedback visual do estado (a capturar / capturado / a enviar)

Garante que todos os estados têm loading states, error handling e são responsivos.
```

---

## FASE 3 — Módulo Compreensão Escrita

### Objectivo
Implementar o fluxo: geração de texto → leitura pelo aluno (com timer) → texto fecha permanentemente → escrita livre → avaliação.

### Instruções para o Claude Code

```
Implementa o módulo Compreensão Escrita em app/compreensao/page.tsx.

FLUXO DO MÓDULO (5 estados):

ESTADO 1 — CONFIGURAÇÃO (tutor, protegida por PIN)
- Campo prompt: "Descreve o tema e tipo de texto" (ex: "texto narrativo sobre uma viagem ao mar, 3.º ano")
- Ano escolar + dificuldade
- Tempo máximo de leitura (2 a 10 minutos, slider)
- Tempo máximo para escrever (5 a 20 minutos, slider)
- PIN para bloquear regresso às configurações
- Botão "Gerar Texto" → /api/gerar-texto (com tipo: 'compreensao')

ESTADO 2 — LEITURA (vista do aluno)
- Texto apresentado com tipografia generosa (Nunito, text-xl, line-height relaxado)
- Timer de contagem decrescente visível no topo (ex: "Tempo de leitura: 3:45")
- Barra de progresso do tempo
- Botão "Já li, continuar →" só aparece após 30 segundos de leitura
- Aviso: "Atenção! Quando clicares em continuar, o texto fecha e não volta a abrir."
- Modal de confirmação antes de fechar

ESTADO 3 — ESCRITA LIVRE (vista do aluno)
- O texto original está COMPLETAMENTE REMOVIDO DO DOM (não só oculto)
- Cabeçalho: "Escreve sobre o que leste"
- Dica temática visível (apenas o tema, sem conteúdo): ex: "Tema: Uma viagem ao mar"
- Textarea grande e confortável, auto-resize
- Contador de palavras em tempo real (mínimo recomendado visível)
- Timer de contagem decrescente para o tempo de escrita
- Quando o timer chega a zero: submissão automática com aviso
- Botão "Entregar" manual disponível a qualquer momento
- Guarda o tempo real gasto (leitura + escrita separados)

ESTADO 4 — A CORRIGIR (loading state)
- Animação de "O professor está a ler o teu texto..."
- Spinner amigável com mensagens rotativas encorajadoras

ESTADO 5 — RESULTADOS
- ScoreDisplay (0-20) com breakdown em 4 critérios:
  - Compreensão do tema (25%)
  - Coerência e estrutura (25%)  
  - Vocabulário e expressão (25%)
  - Ortografia e gramática (25%)
- Cada critério com mini-barra de progresso e nota parcial
- Feedback qualitativo do Claude (3-5 frases, tom encorajador)
- Estatísticas: tempo de leitura, tempo de escrita, n.º de palavras escritas
- Botão para ver o texto original (agora pode ver)

API ROUTES:

/api/gerar-texto/route.ts (adiciona suporte a tipo 'compreensao'):
- Para compreensão: texto mais longo (150-250 palavras), narrativo ou informativo, com vocabulário rico mas adequado ao ano

/api/corrigir/route.ts (adiciona tipo 'compreensao'):
- Recebe: { originalText, studentText, timeSpent, gradeLevel }
- System prompt: és um professor de português do ensino primário. O aluno leu um texto e escreveu sobre ele de memória. Avalia: (1) se captou as ideias principais do texto original, (2) coerência e estrutura do texto do aluno, (3) riqueza vocabular e expressividade, (4) correcção ortográfica e gramatical. Não penalizes por não reproduzir detalhes menores — valoriza a compreensão global e a expressão pessoal. Atribui nota de 0 a 20. Tom do feedback: encorajador, construtivo, adequado à idade.
- Retorna: ExerciseResult com breakdown por critério

HOOK useTimer.ts:
- Contagem decrescente e crescente
- Callbacks onTick, onComplete
- Formatação MM:SS
- Estado visual: normal / aviso (últimos 30s, laranja) / crítico (últimos 10s, vermelho pulsante)
```

---

## FASE 4 — Módulo Matemática

### Objectivo
Implementar geração de exercícios, resolução no papel, submissão por foto e correção via Claude Vision.

### Instruções para o Claude Code

```
Implementa o módulo Matemática em app/matematica/page.tsx.

FLUXO DO MÓDULO (4 estados):

ESTADO 1 — CONFIGURAÇÃO (tutor, PIN)
- Campo prompt: "Descreve os exercícios" (ex: "5 problemas de adição e subtracção com números até 100, 2.º ano")
- Ano escolar (1.º ao 4.º)
- Tipo de exercício (multi-select com chips):
  - Cálculo mental
  - Problemas com enunciado
  - Geometria
  - Medidas
  - Sequências e padrões
- Número de exercícios (3, 5, 8, 10)
- Dificuldade
- Botão "Gerar Exercícios" → /api/gerar-exercicio

ESTADO 2 — EXERCÍCIOS APRESENTADOS (vista do aluno)
- Cada exercício numa card numerada, com tipografia clara e grande
- Fórmulas matemáticas renderizadas de forma legível (usa unicode: ×, ÷, ², etc.)
- Instrução clara: "Resolve os exercícios no teu caderno ou numa folha"
- Botão de impressão (window.print() com CSS @media print optimizado)
- Timer opcional (visível, não obrigatório)
- Botão "Terminei, entregar foto →"

ESTADO 3 — SUBMISSÃO DA FOTO
- Componente PhotoCapture reutilizado
- Instrução: "Fotografa a tua resolução completa. Certifica-te que está legível."
- Dicas de boa fotografia (luz, enquadramento)
- Preview e opção de refazer
- Botão "Enviar para correcção"

ESTADO 4 — RESULTADOS
- Nota global de 0 a 20
- Para cada exercício identificado na foto:
  - Número do exercício
  - Estado: ✅ Correcto / ⚠️ Parcialmente correcto / ❌ Incorrecto
  - Resposta do aluno (lida da foto)
  - Resposta correcta
  - Explicação do erro (se existir) — pedagógica, passo a passo
- Feedback global: pontos fortes + áreas a melhorar
- Nota: se a foto não estiver legível, Claude pede para repetir

API ROUTES:

/api/gerar-exercicio/route.ts:
- Recebe: { prompt, gradeLevel, exerciseTypes, count, difficulty }
- System prompt: és um professor de matemática do 1.º ciclo português. Gera exercícios adequados, progressivos em dificuldade, com enunciados claros e curtos. Para problemas: contextos do quotidiano da criança (animais, brinquedos, comida, escola). Retorna JSON estruturado com array de exercícios, cada um com: id, tipo, enunciado, resposta_correcta, resolucao_esperada.
- Retorna: { exercises: Exercise[] }

/api/corrigir/route.ts (adiciona tipo 'matematica'):
- Recebe: { exercises (array original), photoBase64, mimeType, gradeLevel }
- Usa Claude Vision (modelo com suporte a imagem)
- System prompt: és um professor de matemática do 1.º ciclo português. Analisa a fotografia da resolução manuscrita do aluno. Para cada exercício da lista fornecida: identifica a resolução do aluno na foto, avalia o processo de resolução (não apenas o resultado), identifica erros conceptuais vs erros de cálculo. Critérios de nota: processo correcto mesmo com erro de cálculo final vale 70% da pontuação do exercício. Atribui nota global de 0 a 20. Feedback encorajador e construtivo.
- Retorna: ExerciseResult com detalhes por exercício

TYPES adicionais:
- Exercise { id, type, statement, correctAnswer, expectedSolution }
- MathResult extends ExerciseResult { exerciseResults: ExerciseCorrection[] }
- ExerciseCorrection { exerciseId, studentAnswer, correct, partialCredit, explanation }
```

---

## FASE 5 — Sistema de Pontuação, Histórico e Configurações

### Objectivo
Painel de histórico de resultados, configurações globais e relatório de progresso.

### Instruções para o Claude Code

```
Implementa o sistema de pontuação e configurações globais.

PÁGINA DE CONFIGURAÇÕES (/settings):
- Acessível apenas com PIN de tutor
- Secções:
  1. Perfil do Aluno: nome, ano escolar (guardado em localStorage)
  2. Preferências de ditado: modo de submissão padrão, máx. reproduções TTS
  3. PIN do tutor: alterar PIN (4 dígitos)
  4. Voz TTS: selector de voz disponível no browser, teste de voz
  5. Limpar dados: apagar todo o histórico

HISTÓRICO DE RESULTADOS:
- Guardado em localStorage como array de SessionResult
- Cada SessionResult: { id, module, date, score, timeSpent, feedback }
- Dashboard na homepage com:
  - Última sessão de cada módulo
  - Nota média por módulo (gráfico de barras simples em CSS puro)
  - Streak de dias consecutivos com actividade
  - Total de exercícios realizados

COMPONENTE ScoreDisplay (melhorar):
- Círculo SVG animado que preenche progressivamente até à nota
- Cores dinâmicas por intervalo
- Para nota >= 18: animação de estrelas/confetti (CSS puro)
- Breakdown visual se existir (barras por critério)

COMPONENTE PinGate (implementar completamente):
- Modal com 4 inputs numéricos (foco automático entre dígitos)
- Shake animation se PIN errado
- Máximo 3 tentativas, depois bloqueia 30s
- PIN padrão inicial: 1234 (com aviso para alterar)

RELATÓRIO IMPRIMÍVEL:
- Página /relatorio com CSS @media print
- Últimas N sessões por módulo
- Gráfico de evolução da nota
- Adequado para mostrar aos pais ou arquivar
```

---

## FASE 6 — Polimento Final, Animações e PWA

### Objectivo
Tornar a app polida, rápida e instalável como PWA.

### Instruções para o Claude Code

```
Fase final de polimento e PWA.

ANIMAÇÕES (Framer Motion):
- Page transitions suaves entre módulos (fade + slide)
- Card hover: scale(1.02) + sombra elevada
- ScoreDisplay: contador animado de 0 até à nota final (1.5s)
- Estado de loading: skeleton screens em vez de spinners genéricos
- Resultados: cada item da lista de erros entra com stagger delay
- Confetti em CSS puro para notas >= 18

PWA:
- app/manifest.ts com ícones, nome, cores
- Service Worker básico (cache de assets estáticos)
- Meta tags para iOS standalone
- Ícone da app: lápis + estrela, cores da paleta

ACESSIBILIDADE:
- aria-labels em todos os controlos
- Foco visível em todos os elementos interactivos  
- Tamanho mínimo de toque 44px (importante para tablet)
- Suporte a reduced-motion

OPTIMIZAÇÕES:
- next/image para imagens
- Lazy loading dos módulos pesados
- Error boundaries em cada módulo
- Toast notifications (implementar sem biblioteca, CSS puro)

PÁGINA 404 PERSONALIZADA:
- Ilustração SVG inline de um lápis perdido
- Mensagem amigável para criança
- Botão voltar ao início

TESTES DE SMOKE (opcional, se houver tempo):
- Verifica que cada API route responde sem crash
- Verifica que o hook useTTS não quebra em browsers sem SpeechSynthesis

README.md final:
- Instruções de instalação
- Como configurar a ANTHROPIC_API_KEY
- Fluxo de utilização para tutor e aluno
- Screenshots dos módulos
```

---

## VARIÁVEIS DE AMBIENTE

Cria `.env.local` com:
```
ANTHROPIC_API_KEY=sk-ant-...
```

E `.env.local.example` com:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**A chave API NUNCA deve ir para o cliente.** Todas as chamadas ao Claude passam exclusivamente pelas API Routes do Next.js (server-side).

---

## PROMPTS DO SISTEMA (lib/prompts.ts)

Centraliza aqui todos os system prompts. Exemplo de estrutura:

```typescript
export const PROMPTS = {
  gerarTextoDitado: (gradeLevel: number, difficulty: string) => `...`,
  gerarTextoCompreensao: (gradeLevel: number, difficulty: string) => `...`,
  gerarExerciciosMatematica: (gradeLevel: number, types: string[], count: number) => `...`,
  corrigirDitado: (originalText: string) => `...`,
  corrigirCompreensao: (originalText: string, gradeLevel: number) => `...`,
  corrigirMatematica: (exercises: Exercise[], gradeLevel: number) => `...`,
}
```

Todos os prompts devem:
- Usar português europeu (não brasileiro)
- Especificar o ano escolar e adequar a linguagem
- Pedir resposta sempre em JSON válido (sem markdown fences)
- Incluir exemplos de output esperado no próprio prompt
- Ter tom pedagógico, encorajador e adequado à faixa etária

---

## NOTAS DE DESENVOLVIMENTO

- Começa sempre pela Fase 1 antes de avançar
- Cada fase deve terminar com `npm run build` sem erros
- Usa `console.error` e não `console.log` para erros de API
- Todas as chamadas à API do Claude devem ter try/catch com mensagens de erro úteis
- O modelo a usar: `claude-opus-4-5` para geração e correção de texto; para Vision (foto) usa `claude-opus-4-5` que suporta imagens
- max_tokens: 2048 para geração, 4096 para correção com foto
- Temperatura: 0.7 para geração criativa, 0.2 para correção (mais determinístico)
