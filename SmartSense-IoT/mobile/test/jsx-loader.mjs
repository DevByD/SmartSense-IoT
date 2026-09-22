import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import esbuild from 'esbuild';

const mocksDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'mocks');

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react-native') {
    return {
      url: pathToFileURL(path.join(mocksDir, 'react-native.js')).href,
      format: 'module',
      shortCircuit: true,
    };
  }

  if (specifier === '@expo/vector-icons' || specifier.startsWith('@expo/vector-icons/')) {
    return {
      url: pathToFileURL(path.join(mocksDir, 'vector-icons.js')).href,
      format: 'module',
      shortCircuit: true,
    };
  }

  if (specifier === 'react-native-safe-area-context') {
    return {
      url: pathToFileURL(path.join(mocksDir, 'safe-area.js')).href,
      format: 'module',
      shortCircuit: true,
    };
  }

  if (specifier === 'expo-status-bar') {
    return {
      url: pathToFileURL(path.join(mocksDir, 'expo-status-bar.js')).href,
      format: 'module',
      shortCircuit: true,
    };
  }

  if (specifier === 'react-native-svg') {
    return {
      url: pathToFileURL(path.join(mocksDir, 'svg.js')).href,
      format: 'module',
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('@react-navigation/')) {
    return {
      url: pathToFileURL(path.join(mocksDir, 'navigation.js')).href,
      format: 'module',
      shortCircuit: true,
    };
  }

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
  if (url.endsWith('.jsx') || (url.includes('/src/') && url.endsWith('.js'))) {
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
