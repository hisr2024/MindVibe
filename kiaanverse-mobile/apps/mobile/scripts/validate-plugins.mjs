#!/usr/bin/env node
/**
 * validate-plugins.mjs — verify the 3 Sakha config plugins parse and
 * export a default function with the Expo plugin signature.
 *
 * Runs at CI without needing the full Expo SDK installed: we stub out
 * @expo/config-plugins so the smoke test exercises the plugin's
 * load + invoke contract only.
 *
 * Exit codes:
 *   0 — all 3 plugins load + invoke
 *   1 — load or contract failure
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = resolve(__dirname, '..', 'plugins');

const PLUGINS = [
  'withKiaanForegroundService.js',
  'withKiaanAudioFocus.js',
  'withPicovoice.js',
];

const stub = {
  withAndroidManifest: (config, modifier) => {
    const fakeManifest = {
      manifest: {
        application: [{ $: {}, service: [], 'meta-data': [] }],
      },
    };
    modifier({ ...config, modResults: fakeManifest.manifest });
    return config;
  },
  withStringsXml: (config, modifier) => {
    const fakeStrings = { resources: { string: [] } };
    modifier({ ...config, modResults: fakeStrings });
    return config;
  },
  withAppBuildGradle: (config, modifier) => {
    const fakeGradle = {
      contents:
        'apply plugin: "com.android.application"\n\nandroid {\n    defaultConfig {\n        applicationId "x"\n    }\n}',
    };
    modifier({ ...config, modResults: fakeGradle });
    return config;
  },
  AndroidConfig: {
    Manifest: {
      getMainApplicationOrThrow: (m) =>
        (m && m.manifest && m.manifest.application && m.manifest.application[0]) ||
        (m && m.application && m.application[0]) ||
        m,
    },
  },
};

const require = createRequire(import.meta.url);

// Hijack '@expo/config-plugins' resolution
const Module = require('module');
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === '@expo/config-plugins') return stub;
  return origLoad.call(this, request, parent, ...rest);
};

const fakeConfig = {
  name: 'Sakha',
  android: { package: 'com.kiaanverse.sakha' },
  extra: { picovoice: { accessKey: 'TEST_KEY' } },
};

let failed = 0;
for (const file of PLUGINS) {
  const full = resolve(PLUGINS_DIR, file);
  if (!existsSync(full)) {
    console.error('validate-plugins: missing ' + full);
    failed++;
    continue;
  }
  delete require.cache[full];
  try {
    const plugin = require(full);
    const fn = plugin.default || plugin;
    if (typeof fn !== 'function') {
      console.error('validate-plugins: ' + file + ' default export is ' + typeof fn);
      failed++;
      continue;
    }
    const result = fn(fakeConfig);
    if (typeof result !== 'object') {
      console.error('validate-plugins: ' + file + ' returned ' + typeof result);
      failed++;
      continue;
    }
    console.log('OK   ' + file);
  } catch (e) {
    console.error('FAIL ' + file + ': ' + e.message);
    failed++;
  }
}

if (failed > 0) {
  console.error(failed + ' plugin(s) failed validation');
  process.exit(1);
}
console.log('validate-plugins: ' + PLUGINS.length + ' plugins OK');
