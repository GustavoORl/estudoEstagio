import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/editor/browser/coreCommands.js';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/editor/contrib/snippet/browser/snippetController2.js';
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution.js';
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching.js';
import 'monaco-editor/editor/contrib/parameterHints/browser/parameterHints.js';
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard.js';
import 'monaco-editor/editor/contrib/find/browser/findController.js';
import 'monaco-editor/editor/contrib/format/browser/formatActions.js';
import 'monaco-editor/languages/definitions/javascript/register.js';
import {javascriptDefaults,ScriptTarget,ModuleKind} from 'monaco-editor/language/typescript/monaco.contribution.js';

self.MonacoEnvironment = {getWorker(_id,label){return new Worker(label==='typescript'||label==='javascript'?'/vendor/typescript.worker.js':'/vendor/editor.worker.js',{type:'module'});}};
javascriptDefaults.setCompilerOptions({target:ScriptTarget.ES2022,module:ModuleKind.ESNext,allowNonTsExtensions:true,allowJs:true,checkJs:false});
javascriptDefaults.setDiagnosticsOptions({noSemanticValidation:true,noSyntaxValidation:false});
javascriptDefaults.setEagerModelSync(true);
monaco.editor.defineTheme('devpath',{base:'vs',inherit:true,rules:[{token:'comment',foreground:'87987B'},{token:'keyword',foreground:'8257A6'},{token:'string',foreground:'647F32'}],colors:{'editor.background':'#fbfcf9','editor.foreground':'#32462c','editorLineNumber.foreground':'#abb89c','editorLineNumber.activeForeground':'#687f4c','editor.lineHighlightBackground':'#f0f5e8','editor.selectionBackground':'#d9e8c5','editorCursor.foreground':'#708c49','editorSuggestWidget.background':'#ffffff','editorSuggestWidget.border':'#d6e2c7','editorSuggestWidget.selectedBackground':'#edf4e3'}});
export {monaco};
