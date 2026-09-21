/**
 * Arranca o Next a partir da raiz do projeto com a caixa real do sistema de
 * ficheiros.
 *
 * No Windows os caminhos não distinguem maiúsculas de minúsculas, mas o webpack
 * distingue: arrancar a partir de "c:\projetos\edukit" em vez de
 * "C:\projetos\EduKit" faz com que o mesmo ficheiro seja resolvido por dois
 * caminhos diferentes. O runtime do Next fica duplicado, passam a existir dois
 * ActionQueueContext e a hidratação rebenta com
 * "Invariant: Missing ActionQueueContext".
 *
 * realpathSync.native devolve a caixa verdadeira em disco, seja qual for a que
 * foi escrita no terminal.
 */
import { realpathSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = realpathSync.native(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
);

if (path.resolve(process.cwd()) !== root) {
  console.log(`[next-cased] a corrigir a diretoria: ${process.cwd()} -> ${root}`);
}

const child = spawn(
  process.execPath,
  [path.join(root, "node_modules", "next", "dist", "bin", "next"), ...process.argv.slice(2)],
  { cwd: root, stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
