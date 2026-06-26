"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ModuleStats } from "@/lib/storage";
import { scoreColor } from "@/lib/utils";

interface ModuleCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "primary" | "secondary" | "warning";
  stats?: ModuleStats;
  index?: number;
}

const accentMap = {
  primary: { bg: "bg-primary/10", text: "text-primary-dark", ring: "ring-primary/20" },
  secondary: {
    bg: "bg-secondary/10",
    text: "text-secondary-dark",
    ring: "ring-secondary/20",
  },
  warning: { bg: "bg-warning/10", text: "text-amber-700", ring: "ring-warning/20" },
};

export function ModuleCard({
  href,
  title,
  description,
  icon: Icon,
  accent,
  stats,
  index = 0,
}: ModuleCardProps) {
  const a = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="h-full"
    >
      <Link
        href={href}
        className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-soft transition-shadow hover:shadow-soft-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      >
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${a.bg} ring-4 ${a.ring}`}
        >
          <Icon className={a.text} size={32} />
        </div>

        <h3 className="font-display text-xl font-extrabold text-ink">{title}</h3>
        <p className="mt-1 flex-1 text-slate-500">{description}</p>

        <div className="mt-4 flex items-center justify-between">
          {stats && stats.average !== null ? (
            <Badge tone="neutral">
              Média:{" "}
              <span className={scoreColor(stats.average).text}>
                {stats.average.toFixed(1)}
              </span>
            </Badge>
          ) : (
            <Badge tone="neutral">Por começar</Badge>
          )}
          <span
            className={`flex items-center gap-1 font-display font-bold ${a.text} transition-transform group-hover:translate-x-1`}
          >
            Começar <ArrowRight size={18} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
