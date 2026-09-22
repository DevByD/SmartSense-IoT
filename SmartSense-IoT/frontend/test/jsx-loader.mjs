import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      for (const ext of ['.jsx', '.js', '.json']) {
        try {
          return await nextResolve(`${specifier}${ext}`, context);
        } catch {}
      }
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const filePath = fileURLToPath(url);
    const source = fs.readFileSync(filePath, 'utf8');
    const transformed = esbuild.transformSync(source, {
      loader: 'jsx',
      sourcefile: filePath,
      format: 'esm',
    });
    return {
      format: 'module',
      shortCircuit: true,
      source: transformed.code,
    };
  }
  return nextLoad(url, context);
}
