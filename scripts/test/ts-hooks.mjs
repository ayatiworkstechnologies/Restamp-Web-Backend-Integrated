/**
 * Node module hooks so the plain-node tests can import the website's real
 * TypeScript sources (no test framework, no extra dependencies):
 * - "@/x" resolves to src/x(.ts|.tsx), like tsconfig's paths;
 * - extensionless relative imports from a .ts file resolve to .ts/.tsx;
 * - .ts/.tsx files are compiled with the project's own TypeScript
 *   (type-only imports are dropped, as in the Next build).
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SRC = new URL('../../src/', import.meta.url);
const EXTENSIONS = ['.ts', '.tsx'];
const isTs = (url) => EXTENSIONS.some((ext) => url.endsWith(ext));

export async function resolve(specifier, context, nextResolve) {
  let target = null;
  if (specifier.startsWith('@/')) target = new URL(specifier.slice(2), SRC);
  else if (/^\.\.?\//.test(specifier) && context.parentURL && isTs(context.parentURL)) {
    target = new URL(specifier, context.parentURL);
  }
  if (target && !path.extname(target.pathname)) {
    for (const ext of EXTENSIONS) {
      const candidate = new URL(target.href + ext);
      if (existsSync(candidate)) return { url: candidate.href, format: 'module', shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!isTs(url)) return nextLoad(url, context);
  const file = fileURLToPath(url);
  const { outputText } = ts.transpileModule(await readFile(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  return { format: 'module', source: outputText, shortCircuit: true };
}
