import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
  platform: 'node',
  tsconfig: './tsconfig.json',
  target: 'es5',
  legacyOutput: true,
  shims: false,
  dts: true,
  onSuccess: 'echo {\\"type\\": \\"module\\"} > dist/esm/package.json',
});
