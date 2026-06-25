// Ensure Node globals exist for browser bundles (webpack 5 drops these).
// Imported first in index.js so they're set before the app's module graph evaluates.
import process from 'process/browser';
import {Buffer} from 'buffer';

if (typeof window !== 'undefined') {
  window.global = window.global || window;
  window.process = window.process || process;
  window.Buffer = window.Buffer || Buffer;
}
