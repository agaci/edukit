"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  PencilLine,
  KeyRound,
  Volume2,
  Trash2,
  Save,
  Play,
} from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PinGate } from "@/components/shared/PinGate";
import { Field, SegmentedControl, Slider } from "@/components/ui/Controls";
import { GradeSelect } from "@/components/ui/GradeSelect";
import { useToast } from "@/components/ui/Toast";
import { useTTS } from "@/hooks/useTTS";
import {
  loadSettings,
  saveSettings,
  clearHistory,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import type { AppSettings, InputMode } from "@/types";

export default function SettingsPage() {
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [confirmClear, setConfirmClear] = useState(false);

  const tts = useTTS({ voiceURI: settings.ttsVoiceURI });

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function persist() {
    if (settings.tutorPin.length !== 4) {
      toast("O PIN do tutor deve ter 4 dígitos.", "warning");
      return;
    }
    saveSettings(settings);
    toast("Definições guardadas!", "success");
  }

  function handleClear() {
    clearHistory();
    setConfirmClear(false);
    toast("Histórico apagado.", "success");
  }

  if (!unlocked) {
    return (
      <PinGate
        open
        expectedPin={loadSettings().tutorPin}
        title="Definições"
        description="Esta área é só para o tutor. Introduz o PIN."
        onSuccess={() => setUnlocked(true)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <h1 className="font-display text-3xl font-extrabold text-ink">Definições</h1>

      {/* Perfil do aluno */}
      <Card className="space-y-4">
        <SectionTitle icon={<User size={20} />} title="Perfil do aluno" />
        <Field label="Nome do aluno">
          <input
            type="text"
            value={settings.studentName}
            onChange={(e) => update("studentName", e.target.value)}
            placeholder="ex.: Maria"
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          />
        </Field>
        <Field label="Ano escolar">
          <GradeSelect
            value={settings.gradeLevel}
            onChange={(v) => update("gradeLevel", v)}
          />
        </Field>
      </Card>

      {/* Preferências de ditado */}
      <Card className="space-y-4">
        <SectionTitle icon={<PencilLine size={20} />} title="Preferências de ditado" />
        <Field label="Modo de submissão padrão">
          <SegmentedControl
            value={settings.inputMode}
            onChange={(v) => update("inputMode", v as InputMode)}
            options={[
              { value: "keyboard", label: "Teclado" },
              { value: "photo", label: "Foto" },
              { value: "both", label: "À escolha" },
            ]}
          />
        </Field>
        <Field label="Máximo de reproduções TTS">
          <Slider
            value={settings.maxTTSPlays}
            min={1}
            max={6}
            onChange={(v) => update("maxTTSPlays", v)}
            format={(v) => `${v}x`}
          />
        </Field>
      </Card>

      {/* Voz TTS */}
      <Card className="space-y-4">
        <SectionTitle icon={<Volume2 size={20} />} title="Voz de leitura" />
        {tts.supported ? (
          <>
            <Field label="Voz disponível no navegador">
              <select
                value={settings.ttsVoiceURI}
                onChange={(e) => {
                  update("ttsVoiceURI", e.target.value);
                  tts.setVoiceURI(e.target.value);
                }}
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <option value="">Automática (pt-PT / pt-BR)</option>
                {tts.voices
                  .filter((v) => v.lang.toLowerCase().startsWith("pt"))
                  .map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </Field>
            <Button
              variant="outline"
              icon={<Play size={18} />}
              onClick={() => tts.speak("Olá! Esta é a voz que vais ouvir nos ditados.")}
            >
              Testar voz
            </Button>
          </>
        ) : (
          <p className="text-slate-500">
            Este navegador não suporta síntese de voz.
          </p>
        )}
      </Card>

      {/* PIN do tutor */}
      <Card className="space-y-4">
        <SectionTitle icon={<KeyRound size={20} />} title="PIN do tutor" />
        <CardSubtitle>
          Altera o PIN de 4 dígitos. (Padrão inicial: 1234 — convém mudar.)
        </CardSubtitle>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={settings.tutorPin}
          onChange={(e) =>
            update("tutorPin", e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          className="w-32 rounded-2xl border-2 border-slate-200 px-4 py-3 text-center font-display text-2xl font-extrabold tracking-[0.4em] text-ink focus:border-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20"
        />
      </Card>

      {/* Limpar dados */}
      <Card className="space-y-4 border-2 border-danger/20">
        <SectionTitle icon={<Trash2 size={20} />} title="Limpar dados" />
        <CardSubtitle>Apaga todo o histórico de resultados (irreversível).</CardSubtitle>
        <Button
          variant="danger"
          icon={<Trash2 size={18} />}
          onClick={() => setConfirmClear(true)}
        >
          Apagar histórico
        </Button>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Button size="lg" fullWidth icon={<Save size={20} />} onClick={persist}>
          Guardar Definições
        </Button>
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Apagar histórico?"
      >
        <p className="text-slate-600">
          Esta acção remove todos os resultados guardados neste dispositivo e não
          pode ser desfeita.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setConfirmClear(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleClear}>
            Apagar tudo
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary-dark">
        {icon}
      </span>
      <CardTitle className="text-xl">{title}</CardTitle>
    </div>
  );
}
