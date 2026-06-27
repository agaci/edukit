import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  User,
  Users,
  PencilLine,
  BookOpen,
  Calculator,
  Languages,
  BookOpenText,
  ListChecks,
  Award,
  ShieldCheck,
  LifeBuoy,
  Sparkles,
  UserPlus,
  KeyRound,
  CalendarClock,
  RotateCcw,
  Copy,
  BarChart3,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Manual — EduKit",
  description: "Guia completo de utilização do EduKit para tutores e alunos.",
};

// --- Helpers de apresentação --------------------------------------------------

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary-dark">
          {icon}
        </span>
        <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
      </div>
      <Card className="space-y-4 leading-relaxed text-slate-600">{children}</Card>
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/15 font-display text-sm font-extrabold text-secondary-dark">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ModuleBlock({
  icon,
  title,
  accent,
  children,
}: {
  icon: ReactNode;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </span>
        <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
      </div>
      <div className="space-y-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function Tip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3 text-sm text-primary-dark">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

const TOC = [
  { href: "#intro", label: "O que é o EduKit" },
  { href: "#contas", label: "Contas: Tutor e Aluno" },
  { href: "#tutor", label: "Guia do Tutor" },
  { href: "#aluno", label: "Guia do Aluno" },
  { href: "#exercicios", label: "Os tipos de exercício" },
  { href: "#notas", label: "Notas e repetições" },
  { href: "#resultados", label: "Resultados e evolução" },
  { href: "#problemas", label: "Resolução de problemas" },
  { href: "#privacidade", label: "Privacidade" },
];

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo size={36} />
          <h1 className="mt-3 font-display text-4xl font-extrabold text-ink">
            Manual
          </h1>
          <p className="mt-1 text-slate-500">
            Tudo o que precisas para usar o EduKit, do 1.º ao 12.º ano.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" icon={<ArrowLeft size={18} />}>
            Voltar à app
          </Button>
        </Link>
      </div>

      {/* Índice */}
      <Card className="bg-secondary/5">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">Índice</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOC.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="rounded-xl px-3 py-2 font-semibold text-secondary-dark transition hover:bg-secondary/10"
            >
              {t.label}
            </a>
          ))}
        </div>
      </Card>

      {/* O que é */}
      <Section id="intro" icon={<Sparkles size={22} />} title="O que é o EduKit">
        <p>
          O EduKit é uma aplicação de treino escolar com correção por inteligência
          artificial, do <strong>1.º ao 12.º ano</strong>. O{" "}
          <strong>tutor</strong> (pai, mãe ou professor) monta testes à medida e
          atribui-os aos <strong>alunos</strong>; cada aluno entra, resolve os
          exercícios em sequência e recebe uma nota por exercício e uma nota final.
        </p>
        <p>
          Um teste pode juntar qualquer combinação de seis tipos de exercício:
          Ditado, Compreensão Escrita, Matemática e três de Inglês (duas traduções
          e uma interpretação). O conteúdo adapta-se ao ano e à dificuldade
          escolhidos.
        </p>
      </Section>

      {/* Contas */}
      <Section id="contas" icon={<Users size={22} />} title="Contas: Tutor e Aluno">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 p-4">
            <Badge tone="secondary" className="mb-2">
              <GraduationCap size={14} /> Tutor
            </Badge>
            <p className="text-sm">
              Cria a sua conta, regista alunos, monta e atribui testes, acompanha
              notas e a evolução de cada aluno.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 p-4">
            <Badge tone="primary" className="mb-2">
              <User size={14} /> Aluno
            </Badge>
            <p className="text-sm">
              Entra com o utilizador e PIN que o tutor lhe deu e vê logo os
              trabalhos que tem para fazer.
            </p>
          </div>
        </div>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm">
          <strong>Nomes únicos:</strong> cada aluno tem um nome de utilizador único
          (gerado a partir do nome — ex.: <em>Maria</em> → <code>maria</code>; se já
          existir, <code>maria2</code>). O nome a mostrar pode repetir-se; o
          utilizador é que distingue cada aluno. É com{" "}
          <strong>utilizador + PIN</strong> que o aluno entra.
        </p>
      </Section>

      {/* Guia do Tutor */}
      <Section id="tutor" icon={<GraduationCap size={22} />} title="Guia do Tutor">
        <h3 className="font-display font-extrabold text-ink">1. Conta e alunos</h3>
        <Steps
          items={[
            <>
              <strong>Cria a tua conta</strong> de tutor (nome, utilizador,
              palavra-passe).
            </>,
            <>
              Em <em>Adicionar aluno</em>, escreve o nome, escolhe o{" "}
              <strong>ano escolar</strong> (1.º–12.º) e define um{" "}
              <strong>PIN de 4 a 6 dígitos</strong>. Entrega ao aluno o{" "}
              <strong>utilizador + PIN</strong>.
            </>,
          ]}
        />

        <h3 className="mt-2 font-display font-extrabold text-ink">
          2. Montar um teste (à la carte)
        </h3>
        <Steps
          items={[
            <>
              Em <em>Criar trabalho</em>, no primeiro passo{" "}
              <strong>escolhes os exercícios</strong> que queres incluir (um ou
              mais dos seis tipos). A ordem é a ordem por que os escolheres.
            </>,
            <>
              Configuras cada exercício (tema, ano, dificuldade…) e o EduKit{" "}
              <strong>gera o conteúdo</strong> — podes pré-ver e{" "}
              <em>regenerar</em> ou <em>aceitar</em>.
            </>,
          ]}
        />

        <h3 className="mt-2 font-display font-extrabold text-ink">
          3. Atribuir (a um aluno ou a um grupo)
        </h3>
        <Steps
          items={[
            <>
              No fim, escolhes <strong>um ou vários alunos</strong> — com atalhos{" "}
              <em>Todos</em> e por ano (ex.: &quot;todos do 3.º ano&quot;).
            </>,
            <>
              Podes definir um <strong>prazo</strong> opcional. Sem prazo, o
              trabalho fica sempre disponível; com prazo, marca{" "}
              <strong>&quot;atrasado&quot;</strong> se o aluno não terminar a tempo
              (mas não o bloqueia).
            </>,
          ]}
        />

        <h3 className="mt-2 font-display font-extrabold text-ink">
          4. Ver, repetir e criar semelhante
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <BookOpen size={16} className="mt-0.5 shrink-0 text-secondary" />
            <span>
              <strong>Ver o teste completo:</strong> clica num trabalho para veres o{" "}
              <strong>enunciado original</strong>, a <strong>resposta do aluno</strong>
              , a correção e o estado de cada exercício.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <RotateCcw size={16} className="mt-0.5 shrink-0 text-secondary" />
            <span>
              <strong>Repetir teste:</strong> repõe o mesmo teste para o aluno o
              fazer de novo; a nota anterior fica no{" "}
              <strong>histórico de tentativas</strong> (para veres a evolução).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Copy size={16} className="mt-0.5 shrink-0 text-secondary" />
            <span>
              <strong>Criar semelhante:</strong> gera um teste parecido (mas nunca
              igual) na <strong>dificuldade que escolheres</strong> — para subir ou
              descer o grau.
            </span>
          </li>
        </ul>

        <Tip icon={<UserPlus size={18} />}>
          Cria primeiro os alunos e só depois os testes — assim podes atribuir logo
          no fim da criação.
        </Tip>
      </Section>

      {/* Guia do Aluno */}
      <Section id="aluno" icon={<User size={22} />} title="Guia do Aluno">
        <Steps
          items={[
            <>
              <strong>Entra</strong> com o <strong>utilizador + PIN</strong> que o
              tutor te deu.
            </>,
            <>
              Vês logo os <strong>trabalhos por fazer</strong> (e o prazo, se
              existir).
            </>,
            <>
              Abre um trabalho e <strong>resolve os exercícios em sequência</strong>
              , um a seguir ao outro.
            </>,
            <>
              No fim, vês a nota de cada exercício e a <strong>nota final</strong>{" "}
              (a média de todos).
            </>,
          ]}
        />
        <Tip icon={<KeyRound size={18} />}>
          Esqueceste o PIN? Pede ao teu tutor — é ele que gere os acessos.
        </Tip>
      </Section>

      {/* Exercícios */}
      <Section
        id="exercicios"
        icon={<ListChecks size={22} />}
        title="Os tipos de exercício"
      >
        <p className="text-sm">
          Um teste pode ter qualquer combinação destes seis tipos:
        </p>
        <div className="space-y-4">
          <ModuleBlock
            icon={<PencilLine size={18} className="text-primary-dark" />}
            title="Ditado"
            accent="bg-primary/15"
          >
            <p>
              Ouves um texto lido em voz alta (controlas o <strong>ritmo</strong>:
              a pausa entre palavras) e escreves no teclado ou em papel
              (fotografando). A nota tem em conta os erros{" "}
              <strong>e quanto do texto escreveste</strong>.
            </p>
          </ModuleBlock>

          <ModuleBlock
            icon={<BookOpen size={18} className="text-secondary-dark" />}
            title="Compreensão Escrita"
            accent="bg-secondary/15"
          >
            <p>
              Lês um texto durante um tempo; depois o texto <strong>fecha</strong> e
              escreves, por palavras tuas, sobre o que leste. Avaliado em quatro
              critérios.
            </p>
          </ModuleBlock>

          <ModuleBlock
            icon={<Calculator size={18} className="text-amber-700" />}
            title="Matemática"
            accent="bg-warning/15"
          >
            <p>
              Resolves no papel (podes imprimir) e fotografas. O EduKit analisa o{" "}
              <strong>raciocínio passo a passo</strong>, não só o resultado.
            </p>
          </ModuleBlock>

          <ModuleBlock
            icon={<Languages size={18} className="text-secondary-dark" />}
            title="Tradução Inglês → Português / Português → Inglês"
            accent="bg-secondary/15"
          >
            <p>
              O EduKit gera um texto numa língua e tu escreves a tradução na outra.
              É avaliada a fidelidade ao sentido, a gramática e a expressão.
            </p>
          </ModuleBlock>

          <ModuleBlock
            icon={<BookOpenText size={18} className="text-primary-dark" />}
            title="Interpretação de Inglês (escolha múltipla)"
            accent="bg-primary/15"
          >
            <p>
              Lês um texto em inglês e respondes a perguntas de{" "}
              <strong>escolha múltipla</strong> (estilo americano). A correção é{" "}
              <strong>automática</strong>, com revisão pergunta a pergunta.
            </p>
          </ModuleBlock>
        </div>
      </Section>

      {/* Notas */}
      <Section id="notas" icon={<Award size={22} />} title="Notas e repetições">
        <p>
          Cada exercício recebe uma nota de <strong>0 a 20</strong>. A{" "}
          <strong>nota final</strong> de um trabalho é a média das notas de todos os
          exercícios.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="danger">0–9 · vermelho</Badge>
          <Badge tone="warning">10–13 · laranja</Badge>
          <Badge tone="success">14–17 · verde</Badge>
          <Badge tone="primary">18–20 · dourado</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Quando o tutor manda <strong>repetir</strong> um teste, a nota fica
          guardada e o aluno volta a resolvê-lo com o mesmo enunciado — assim dá
          para comparar a evolução entre tentativas.
        </p>
      </Section>

      {/* Resultados */}
      <Section
        id="resultados"
        icon={<BarChart3 size={22} />}
        title="Resultados e evolução"
      >
        <p>
          No painel do tutor, em <strong>Resultados</strong>, encontras gráficos com:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Média por tipo de exercício</strong> — onde os alunos estão
            melhores ou precisam de treino.
          </li>
          <li>
            <strong>Desempenho por aluno</strong> — média e uma linha de evolução
            ao longo dos testes.
          </li>
          <li>
            <strong>Melhoria com as repetições</strong> — a subida (ou descida) da
            nota de cada tentativa do mesmo teste.
          </li>
        </ul>
      </Section>

      {/* Problemas */}
      <Section
        id="problemas"
        icon={<LifeBuoy size={22} />}
        title="Resolução de problemas"
      >
        <ul className="space-y-3 text-sm">
          <li>
            <strong>O ditado não tem voz.</strong> O navegador pode não ter uma voz
            portuguesa. Usa o Chrome ou o Edge, ou escolhe a voz nas Definições.
          </li>
          <li>
            <strong>A foto saiu ilegível.</strong> O EduKit pede para repetir.
            Procura boa luz e enquadra a folha inteira com a letra bem visível.
          </li>
          <li>
            <strong>Não consigo entrar.</strong> Confirma o utilizador e o PIN com o
            tutor. O utilizador é tudo em minúsculas, sem espaços nem acentos.
          </li>
          <li className="flex items-start gap-2">
            <CalendarClock size={16} className="mt-0.5 shrink-0 text-warning" />
            <span>
              <strong>Apareceu &quot;atrasado&quot;.</strong> O prazo passou, mas
              ainda podes terminar — fica apenas assinalado como entregue fora do
              prazo.
            </span>
          </li>
        </ul>
      </Section>

      {/* Privacidade */}
      <Section
        id="privacidade"
        icon={<ShieldCheck size={22} />}
        title="Privacidade"
      >
        <ul className="space-y-2 text-sm">
          <li>
            As contas, os testes e as notas ficam guardados na base de dados do
            EduKit, protegidos por início de sessão.
          </li>
          <li>
            As fotos são enviadas apenas para correção e não são guardadas pela
            aplicação.
          </li>
          <li>Não há publicidade nem partilha de dados com terceiros.</li>
        </ul>
      </Section>

      {/* Regresso */}
      <div className="flex justify-center border-t border-slate-100 pt-8">
        <Link href="/">
          <Button size="lg" icon={<ArrowLeft size={20} />}>
            Voltar à app
          </Button>
        </Link>
      </div>
    </div>
  );
}
