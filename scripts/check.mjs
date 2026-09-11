import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else files.push(target);
  }
}
walk(path.join(root, 'Online'));
walk(path.join(root, 'archive'));

let scripts = 0;
let links = 0;
for (const file of files) {
  const relative = path.relative(root, file);
  if (file.endsWith('.js') && !file.endsWith('config.local.js')) {
    new Script(readFileSync(file, 'utf8'), { filename: relative });
    scripts++;
  }
  if (!/\.(html|php)$/.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/i.test(match[1]) && match[2].trim()) {
      new Script(match[2], { filename: `${relative} (inline)` });
      scripts++;
    }
  }
  for (const match of source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const url = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
    const target = url.split(/[?#]/)[0];
    if (!target) continue;
    if (target === 'config.local.js') {
      assert(existsSync(path.join(root, 'Online/config.example.js')), 'Missing configuration example');
    } else {
      assert(existsSync(path.resolve(path.dirname(file), target)), `${relative}: missing ${target}`);
    }
    links++;
  }
  if (/<script\b[^>]*src\s*=\s*["'](?:reserve|res3)\.js/i.test(source)) {
    assert(source.includes('src="config.local.js"'), `${relative}: missing account configuration script`);
    assert(source.indexOf('src="config.local.js"') < source.search(/src\s*=\s*["'](?:reserve|res3)\.js/), `${relative}: configuration must load first`);
  }
}

const schedule = JSON.parse(readFileSync(path.join(root, 'Online/booking-intervals.json'), 'utf8'));
const days = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
assert(schedule && typeof schedule === 'object' && !Array.isArray(schedule), 'Schedule must be an object');
for (const [library, dayMap] of Object.entries(schedule)) {
  assert(dayMap && typeof dayMap === 'object' && !Array.isArray(dayMap), `${library}: invalid day map`);
  for (const [day, intervals] of Object.entries(dayMap)) {
    assert(days.has(day) && Array.isArray(intervals), `${library}: invalid day ${day}`);
    for (const interval of intervals) {
      assert(interval && typeof interval.start === 'string' && typeof interval.end === 'string', `${library}/${day}: invalid interval`);
      assert(time.test(interval.start) && time.test(interval.end) && interval.start < interval.end, `${library}/${day}: invalid times`);
    }
  }
}
console.log(`Passed: ${scripts} JavaScript scripts, ${links} local links, and booking schedule JSON. No booking code was executed.`);
