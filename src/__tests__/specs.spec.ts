// npm run test src/__tests__/specs.spec.ts
import path from 'path';
import fs from 'fs';
import * as yaml from 'js-yaml';
import { describe, it, expect } from 'vitest';
import JsSandbox from '../index';

const dir = path.resolve(__dirname, 'specs');

const files = fs.readdirSync(dir).filter((f) => {
  let match = true;
  if (process.env.FILTER) {
    match = new RegExp(`.*${process.env.FILTER}.*`).test(f);
  }
  return f.match(/\.yaml$/) && match;
});

function loadDocs() {
  const docs: any[] = [];
  files.forEach((f) => {
    const filePath = path.resolve(dir, f);
    const contents = fs.readFileSync(filePath, 'utf8');
    try {
      yaml.loadAll(contents, (obj: any) => {
        obj.file = f;
        docs.push(obj);
      });
    } catch (ex) {
      docs.push({
        file: f,
        name: 'loaderr',
        err: 'Unable to load file [' + f + ']\n' + ex.message + '\n' + ex.stack,
      });
    }
  });
  return docs;
}

const docs = loadDocs();

describe.each(docs)('$name', ({ fun, tests }: { name: string; fun: string; tests: any[] }) => {
  it.each(tests)('$name', async ({ options, expects }) => {
    const jsSandbox = new JsSandbox();
    const results = await jsSandbox.tests(fun, options);
    console.log(results);
    expect(results).toEqual(expects);
  });
});
