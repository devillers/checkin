import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const appDir = path.join(projectRoot, 'app');
const libDir = path.join(projectRoot, 'lib');
const stubsDir = path.join(projectRoot, 'tests', 'stubs');

const stubMap = new Map([
  ['next/server', pathToFileURL(path.join(stubsDir, 'next-server.mjs')).href],
  ['@/lib/mongodb', pathToFileURL(path.join(stubsDir, 'lib-mongodb.mjs')).href],
  ['@/lib/auth', pathToFileURL(path.join(stubsDir, 'lib-auth.mjs')).href],
  ['uuid', pathToFileURL(path.join(stubsDir, 'uuid.mjs')).href]
]);

const routeFilePath = path.join(projectRoot, 'app', 'api', 'properties', '[id]', 'route.js');
const utilsStubUrl = pathToFileURL(path.join(stubsDir, 'utils.mjs')).href;

export async function resolve(specifier, context, nextResolve) {
  if (stubMap.has(specifier)) {
    return {
      url: stubMap.get(specifier),
      shortCircuit: true
    };
  }

  if (specifier === '../utils' && typeof context.parentURL === 'string') {
    const parentPath = fileURLToPath(context.parentURL);
    if (parentPath === routeFilePath) {
      return {
        url: utilsStubUrl,
        shortCircuit: true
      };
    }
  }

  if (specifier.startsWith('@/')) {
    const targetUrl = pathToFileURL(path.join(projectRoot, specifier.slice(2))).href;
    return nextResolve(targetUrl, context);
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file://')) {
    const filepath = fileURLToPath(url);
    if (filepath.startsWith(appDir) || filepath.startsWith(libDir)) {
      return nextLoad(url, { ...context, format: 'module' });
    }
  }

  return nextLoad(url, context);
}
