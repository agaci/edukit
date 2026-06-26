import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  User,
  PencilLine,
  BookOpen,
  Calculator,
  ListChecks,
  Award,
  ShieldCheck,
  LifeBuoy,
  Sparkles,
  UserPlus,
  KeyRound,
  Volume2,
  Camera,
  Timer,
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

const TOC = [
  { href: "#intro", label: "O que é o EduKit" },
  { href: "#perfis", label: "Tutor e Aluno" },
  { href: "#tutor", label: "Guia do Tutor" },
  { href: "#aluno", label: "Guia do Aluno" },
  { href: "#modulos", label: "Os três módulos" },
  { href: "#notas", label: "Como são as notas" },
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
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">
          Índice
        </h2>
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
          artificial. Tem três módulos — <strong>Ditado</strong>,{" "}
          <strong>Compreensão Escrita</strong> e <strong>Matemática</strong> — e
          adapta o conteúdo ao ano escolar escolhido, do 1.º ao 12.º ano.
        </p>
        <p>
          O <strong>tutor</strong> (pai, mãe ou professor) cria trabalhos e
          atribui-os a um <strong>aluno</strong>. O aluno entra, faz os exercícios
          em sequência e recebe uma nota por exercício e uma nota final.
        </p>
      </Section>

      {/* Perfis */}
      <Section
        id="perfis"
        icon={<ListChecks size={22} />}
        title="Tutor e Aluno"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 p-4">
            <Badge tone="secondary" className="mb-2">
              <GraduationCap size={14} /> Tutor
            </Badge>
            <p className="text-sm">
              Cria a sua conta, regista alunos, gera trabalhos de 3 exercícios e
              acompanha as notas de cada aluno.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 p-4">
            <Badge tone="primary" className="mb-2">
              <User size={14} /> Aluno
            </Badge>
            <p className="text-sm">
              Entra com o utilizador e PIN que o tutor lhe deu, vê os trabalhos
              por fazer e resolve-os em sequência.
            </p>
          </div>
        </div>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm">
          <strong>Nomes únicos:</strong> cada aluno tem um nome de utilizador
          único (gerado a partir do nome — ex.: <em>Maria</em> → <code>maria</code>
          ; se já existir, <code>maria2</code>). O nome a mostrar pode repetir-se;
          o utilizador é que distingue cada aluno.
        </p>
      </Section>

      {/* Guia do Tutor */}
      <Section
        id="tutor"
        icon={<GraduationCap size={22} />}
        title="Guia do Tutor"
      >
        <Steps
          items={[
            <>
              <strong>Criar conta.</strong> No ecrã inicial escolhe{" "}
              <em>Criar conta de tutor</em> e define nome, utilizador e
              palavra-passe.
            </>,
            <>
              <strong>Adicionar alunos.</strong> No painel, em{" "}
              <em>Adicionar aluno</em>, escreve o nome do aluno. O EduKit sugere um
              utilizador único; define um <strong>PIN de 4 dígitos</strong> e
              entrega ao aluno o <strong>utilizador + PIN</strong>.
            </>,
            <>
              <strong>Criar um trabalho.</strong> Em <em>Criar trabalho</em> geras,
              em sequência, os três exercícios (Ditado, Compreensão e Matemática).
              Em cada um descreves o tema, escolhes o ano e a dificuldade, e o
              EduKit gera o conteúdo — podes pré-ver e <em>regenerar</em> ou{" "}
              <em>aceitar</em>.
            </>,
            <>
              <strong>Atribuir ao aluno.</strong> No fim, escolhes o aluno da tua
              lista. O trabalho fica logo disponível para ele.
            </>,
            <>
              <strong>Ver as notas.</strong> No painel vês cada trabalho, o seu
              estado e as notas — por exercício e a <strong>nota final</strong>{" "}
              (média das três).
            </>,
          ]}
        />
        <div className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3 text-sm text-primary-dark">
          <UserPlus size={18} className="mt-0.5 shrink-0" />
          <span>
            Dica: cria primeiro os alunos e só depois os trabalhos — assim podes
            atribuir logo no fim da criação.
          </span>
        </div>
      </Section>

      {/* Guia do Aluno */}
      <Section id="aluno" icon={<User size={22} />} title="Guia do Aluno">
        <Steps
          items={[
            <>
              <strong>Entrar.</strong> Usa o <strong>utilizador + PIN</strong> que o
              tutor te deu.
            </>,
            <>
              <strong>Ver os trabalhos.</strong> Ao entrares, vês logo os trabalhos
              que tens para fazer.
            </>,
            <>
              <strong>Fazer em sequência.</strong> Abre um trabalho e resolve os
              três exercícios, um a seguir ao outro.
            </>,
            <>
              <strong>Ver as notas.</strong> No fim vês a nota de cada exercício e a{" "}
              <strong>nota final</strong> (a média das três).
            </>,
          ]}
        />
        <div className="flex items-start gap-2 rounded-2xl bg-secondary/10 p-3 text-sm text-secondary-dark">
          <KeyRound size={18} className="mt-0.5 shrink-0" />
          <span>
            Esqueceste o PIN? Pede ao teu tutor — é ele que gere os acessos.
          </span>
        </div>
      </Section>

      {/* Módulos */}
      <Section id="modulos" icon={<BookOpen size={22} />} title="Os três módulos">
        <div className="space-y-4">
          <ModuleBlock
            icon={<PencilLine size={18} className="text-primary-dark" />}
            title="Ditado"
            accent="bg-primary/15"
          >
            <p>
              Ouves um texto lido em voz alta e escreves o que ouves — no teclado
              (enquanto ouves) ou em papel, fotografando depois.
            </p>
            <p className="flex items-center gap-1.5">
              <Volume2 size={14} className="text-secondary" />
              Controlas o <strong>ritmo</strong>: a voz lê sempre natural e o que
              muda é a <strong>pausa entre palavras</strong>, para teres tempo de
              escrever.
            </p>
            <p>
              A nota tem em conta os erros (ortografia, acentuação, pontuação,
              maiúsculas) <strong>e quanto do texto escreveste</strong> — escrever
              só uma parte dá nota proporcional.
            </p>
          </ModuleBlock>

          <ModuleBlock
            icon={<BookOpen size={18} className="text-secondary-dark" />}
            title="Compreensão Escrita"
            accent="bg-secondary/15"
          >
            <p className="flex items-center gap-1.5">
              <Timer size={14} className="text-secondary" />
              Lês um texto durante um tempo definido. Depois o texto{" "}
              <strong>fecha e não volta a abrir</strong>.
            </p>
            <p>
              Escreves, por palavras tuas, sobre o que leste. És avaliado em quatro
              critérios: compreensão do tema, coerência, vocabulário e
              ortografia/gramática.
            </p>
          </ModuleBlock>

          <ModuleBlock
            icon={<Calculator size={18} className="text-amber-700" />}
            title="Matemática"
            accent="bg-warning/15"
          >
            <p className="flex items-center gap-1.5">
              <Camera size={14} className="text-secondary" />
              Resolves os exercícios no papel (podes imprimir) e fotografas a
              resolução.
            </p>
            <p>
              O EduKit analisa o teu <strong>raciocínio passo a passo</strong>, não
              só o resultado final. Um processo certo com erro de cálculo vale a
              maior parte da pontuação.
            </p>
          </ModuleBlock>
        </div>
      </Section>

      {/* Notas */}
      <Section id="notas" icon={<Award size={22} />} title="Como são as notas">
        <p>
          Cada exercício recebe uma nota de <strong>0 a 20</strong>. A{" "}
          <strong>nota final</strong> de um trabalho é a média das três notas.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="danger">0–9 · vermelho</Badge>
          <Badge tone="warning">10–13 · laranja</Badge>
          <Badge tone="success">14–17 · verde</Badge>
          <Badge tone="primary">18–20 · dourado</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Além da nota, o EduKit dá sempre um feedback do &quot;professor&quot; e,
          quando há erros, mostra a correção com uma explicação simples.
        </p>
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
            portuguesa instalada. Usa o Chrome ou o Edge, ou escolhe a voz nas
            Definições do tutor.
          </li>
          <li>
            <strong>A foto saiu ilegível.</strong> O EduKit pede para repetir.
            Procura boa luz, sem sombras, e enquadra a folha inteira com a letra
            bem visível.
          </li>
          <li>
            <strong>Não consigo entrar.</strong> Confirma o utilizador e o PIN com o
            tutor. O utilizador é tudo em minúsculas, sem espaços nem acentos.
          </li>
          <li>
            <strong>O tempo acabou na compreensão.</strong> É normal — o trabalho é
            entregue automaticamente com o que escreveste até ao momento.
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
            As contas e os trabalhos ficam guardados na base de dados do EduKit.
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
