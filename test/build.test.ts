import { writeFileSync } from 'fs';
import { execSync, exec } from 'child_process';

function testFile(filename: string, expectCode: number) {
  return new Promise((resolve) => {
    const child = exec(`node ${filename}`);
    child.on('exit', (code) => {
      try {
        expect(code).toBe(expectCode);
      } finally {
        resolve(code);
      }
    });
  });
}

beforeEach(() => {
  execSync('npx tsup');
}, 10000);

test('ESM with type=module', async () => {
  await testFile('dist/esm/index.js', 0);
});

test('ESM with type=commonjs', async () => {
  writeFileSync('dist/esm/package.json', '{"type": "commonjs"}');
  await testFile('dist/esm/index.js', 1);
});

test('pure commonjs', async () => {
  await testFile('dist/index.js', 0);
});
