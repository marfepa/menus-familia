import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function isFile(file) {
  return existsSync(file) && statSync(file).isFile();
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = path.join(SRC, specifier.slice(2));
    const candidates = [`${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts'), base];
    for (const file of candidates) {
      if (isFile(file)) {
        return { url: pathToFileURL(file).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
