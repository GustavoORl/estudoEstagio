import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir(new URL('../public/vendor/',import.meta.url),{recursive:true});
await build({entryPoints:{editor:'editor-src/index.js','editor.worker':'node_modules/monaco-editor/esm/vs/editor/editor.worker.js','typescript.worker':'node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js'},outdir:'public/vendor',bundle:true,format:'esm',splitting:true,minify:true,target:'es2022',loader:{'.ttf':'file'},assetNames:'[name]-[hash]',chunkNames:'chunk-[hash]',logLevel:'warning'});
console.log('Editor local preparado.');
