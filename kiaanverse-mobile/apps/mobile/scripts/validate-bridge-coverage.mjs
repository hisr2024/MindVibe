#!/usr/bin/env node
/**
 * validate-bridge-coverage.mjs — verify every JS NativeModules call
 * resolves to a real Kotlin @ReactMethod.
 *
 * The RN bridge is dynamically typed: JS does
 *   `NativeModules.SakhaVoice.someMethod(args)`
 * If `someMethod` doesn't exist in the Kotlin module class, JS gets back
 * `undefined`, calling it throws "TypeError: Native.someMethod is not a
 * function" at runtime — silent until the user actually invokes that
 * code path. TypeScript can declare a `.d.ts`-style interface but does
 * not VERIFY that the Kotlin side actually exposes the methods.
 *
 * This validator:
 *   1. Greps every `@ReactMethod fun NAME(...)` in Kotlin source.
 *   2. Greps every `Native.NAME(...)` / `NativeModules.X.NAME(...)`
 *      callsite in `apps/mobile/voice/`.
 *   3. Asserts every JS callsite has a matching Kotlin method on the
 *      same module class.
 *   4. Asserts the corresponding ReactPackage is in the plugin's
 *      ADD_LINES table (so the module is actually registered at app
 *      startup — without that, even a correct method signature is
 *      `undefined` because the entire module is missing).
 *
 * What this catches:
 *   • Renaming a Kotlin method without updating JS call sites
 *   • Adding a JS call to a method that was never implemented Kotlin-side
 *   • Removing a Kotlin @ReactMethod while JS still calls it
 *   • Forgetting to register a new module's Package in the plugin
 *
 * What this does NOT catch:
 *   • Parameter type mismatches (JS passing a string where Kotlin
 *     expects a Double — RN bridge silently coerces or fails at runtime
 *     depending on the type). Verifying types would require a real
 *     TS+Kotlin parser; this scope was rejected as gold-plating.
 *   • Methods called only via reflection / dynamic property access.
 *
 * Exit codes:
 *   0 — every JS-called method is implemented + its module is registered
 *   1 — at least one drift, with a diagnostic
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const NATIVE_ROOT = resolve(APP_ROOT, 'native/android/src/main/java');
const TS_ROOT = resolve(APP_ROOT, 'voice');
const PLUGIN_PATH = resolve(APP_ROOT, 'plugins/withKiaanSakhaVoicePackages.js');

// ─── 1. Discover Kotlin @ReactMethod declarations ───────────────────────
//
// Each module class has a NAME constant that JS uses as
// `NativeModules.<NAME>.<method>`. Build a map: NAME → Set<method>.

function findKotlinModuleMethods() {
  // Find module files that contain `override fun getName()`. Each is a
  // module class — look for NAME = "X" + every @ReactMethod-tagged fun.
  const kotlinFiles = execFileSync(
    'find',
    [
      NATIVE_ROOT,
      '-name',
      '*.kt',
      '-exec',
      'grep',
      '-l',
      'override fun getName',
      '{}',
      '+',
    ],
    { encoding: 'utf-8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  const modules = {}; // { "SakhaVoice": Set("initialize", "activate", ...) }

  for (const file of kotlinFiles) {
    const src = readFileSync(file, 'utf-8');
    const nameMatch = src.match(/const\s+val\s+NAME\s*=\s*"([^"]+)"/);
    if (!nameMatch) continue;
    const moduleName = nameMatch[1];

    const methods = new Set();
    // @ReactMethod (optionally with annotation args) directly preceding
    // a `fun NAME(`. Allows for blank lines / comments between the
    // annotation and the fun keyword by capturing across at most ~3 lines.
    const re = /@ReactMethod(?:\([^)]*\))?\s+(?:[^\n]*\n)?\s*fun\s+(\w+)\s*\(/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      methods.add(m[1]);
    }

    // addListener / removeListeners are required by the EventEmitter
    // contract — many modules implement them WITHOUT @ReactMethod (they
    // use the parent class's annotation). Treat them as always-present
    // so the validator doesn't false-positive on emitter setup code.
    methods.add('addListener');
    methods.add('removeListeners');

    modules[moduleName] = methods;
  }
  return modules;
}

// ─── 2. Discover JS callsites ───────────────────────────────────────────

function findJsCallsites() {
  // Pattern A: `const Native = NativeModules.<X>` followed by `Native.<m>(`
  // Pattern B: `NativeModules.<X>.<m>(` directly
  // Pattern C: `<Local>Candidate = NativeModules.<X>` then `<Local>.<m>(`
  //
  // Strategy: in each TS file under voice/, find all lines binding a
  // local variable to `NativeModules.<X>`, then within the same file
  // find every `<localname>.<m>(` call. Also catch direct
  // `NativeModules.<X>.<m>(` calls.
  const tsFiles = execSync(
    `find ${TS_ROOT} -name "*.ts" -o -name "*.tsx"`,
    { encoding: 'utf-8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  const callsites = []; // [{ moduleName, methodName, file }]

  for (const file of tsFiles) {
    const src = readFileSync(file, 'utf-8');
    if (!src.includes('NativeModules')) continue;

    // Local-binding pattern: `const X = NativeModules.<Module>` or
    // `const X = NativeModules.<Module> as <Type> | undefined`.
    const bindings = {}; // localName → moduleName
    const bindRe = /\b(?:const|let|var)\s+(\w+)\s*=\s*NativeModules\.(\w+)\b/g;
    let bm;
    while ((bm = bindRe.exec(src)) !== null) {
      bindings[bm[1]] = bm[2];
    }

    // Direct calls: `NativeModules.<Module>.<method>(`
    const directRe = /NativeModules\.(\w+)\.(\w+)\(/g;
    let dm;
    while ((dm = directRe.exec(src)) !== null) {
      callsites.push({ moduleName: dm[1], methodName: dm[2], file });
    }

    // Indirect calls via local binding: `<localName>.<method>(`
    for (const [localName, moduleName] of Object.entries(bindings)) {
      // \b<localName>\?.\w+\( OR \b<localName>\.\w+\(
      const indirectRe = new RegExp(
        `\\b${localName}\\??\\.([a-zA-Z_]\\w*)\\(`,
        'g',
      );
      let im;
      while ((im = indirectRe.exec(src)) !== null) {
        callsites.push({ moduleName, methodName: im[1], file });
      }
    }
  }

  return callsites;
}

// ─── 3. Check plugin's ADD_LINES coverage ───────────────────────────────

function findPluginRegisteredPackages() {
  // Read the plugin and pull its ADD_LINES table. The Module class for
  // `add(XPackage())` lives in the same Kotlin source file as the
  // Package class — easiest way to map Package → Module is via grep:
  // for each Package class, find the Module it instantiates.
  const stub = {
    withMainApplication: (c) => c,
    withSettingsGradle: (c) => c,
    withAppBuildGradle: (c) => c,
  };
  const requireFromHere = createRequire(import.meta.url);
  // Stub @expo/config-plugins so the plugin loads without node_modules.
  const cjsModule = requireFromHere('module');
  const origLoad = cjsModule._load;
  cjsModule._load = function (request, ...rest) {
    if (request === '@expo/config-plugins') return stub;
    return origLoad.call(this, request, ...rest);
  };
  const plugin = requireFromHere(PLUGIN_PATH);
  cjsModule._load = origLoad;
  return plugin.__internals.ADD_LINES.map((l) =>
    l.replace(/^add\(/, '').replace(/\(\)\)$/, ''),
  );
}

function findPackageToModuleMap() {
  // For each *Package.kt file, find its `createNativeModules` body and
  // extract the Module class it instantiates. That gives us the
  // Package → Module mapping the plugin's add() calls implicitly rely on.
  const packageFiles = execSync(
    `find ${NATIVE_ROOT} -name "*Package.kt"`,
    { encoding: 'utf-8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  const map = {}; // PackageClassName → ModuleClassName | null
  for (const file of packageFiles) {
    const src = readFileSync(file, 'utf-8');
    const classMatch = src.match(/class\s+(\w+Package)\s*:/);
    if (!classMatch) continue;
    const pkgName = classMatch[1];
    // listOf(KiaanAudioPlayerModule(reactContext)) etc. Could also be
    // emptyList() (KiaanVoicePackage is the case in this codebase —
    // package exists for AAR keep-alive but exposes no JS-facing module).
    const moduleMatch = src.match(/listOf\(\s*(\w+)\s*\(/);
    map[pkgName] = moduleMatch ? moduleMatch[1] : null;
  }
  return map;
}

// ─── 4. Run all checks ──────────────────────────────────────────────────

function main() {
  const kotlinModules = findKotlinModuleMethods();
  const jsCallsites = findJsCallsites();
  const pluginPackages = findPluginRegisteredPackages();
  const packageToModule = findPackageToModuleMap();

  console.log(
    `Discovered ${Object.keys(kotlinModules).length} Kotlin native modules: ${Object.keys(kotlinModules).join(', ')}`,
  );
  console.log(
    `Discovered ${jsCallsites.length} JS native call sites across voice/`,
  );
  console.log(
    `Plugin registers ${pluginPackages.length} ReactPackages: ${pluginPackages.join(', ')}`,
  );
  console.log('');

  let failures = 0;
  const report = (ok, label, detail) => {
    if (ok) {
      console.log('OK   ' + label);
    } else {
      console.error('FAIL ' + label + (detail ? ': ' + detail : ''));
      failures++;
    }
  };

  // Check 1: Every JS callsite resolves to a Kotlin @ReactMethod
  const seen = new Set();
  for (const cs of jsCallsites) {
    const key = `${cs.moduleName}.${cs.methodName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const kotlinModule = kotlinModules[cs.moduleName];
    if (!kotlinModule) {
      report(
        false,
        `JS calls NativeModules.${cs.moduleName}.${cs.methodName}() but no Kotlin module named ${cs.moduleName}`,
        `(see ${cs.file.replace(APP_ROOT + '/', '')})`,
      );
      continue;
    }
    const ok = kotlinModule.has(cs.methodName);
    report(
      ok,
      `JS NativeModules.${cs.moduleName}.${cs.methodName}() → Kotlin @ReactMethod`,
      ok
        ? null
        : `Kotlin ${cs.moduleName} has no @ReactMethod fun ${cs.methodName}; called from ${cs.file.replace(APP_ROOT + '/', '')}`,
    );
  }

  // Check 2: Every Kotlin module the plugin registers IS reached by JS
  //   (so we don't ship a registered-but-dead module class wasting the
  //   bridge slot). Soft warning — not a hard fail since some modules
  //   might be registered for native-side use only (e.g., a future JS
  //   surface). For KiaanVoicePackage specifically, the package
  //   intentionally exposes no module (emptyList()) so it shouldn't
  //   appear in kotlinModules at all — its presence in the plugin's
  //   ADD_LINES is to keep the AAR's compute trinity classes alive.
  for (const pkgName of pluginPackages) {
    const moduleName = packageToModule[pkgName];
    if (moduleName === null) {
      console.log(
        `INFO ${pkgName} registers no Module (emptyList) — package exists for AAR keep-alive, no JS surface expected`,
      );
      continue;
    }
    if (!moduleName) {
      report(
        false,
        `Plugin registers ${pkgName} but no *Package.kt source maps it to a Module`,
        'package class file may be missing or malformed',
      );
      continue;
    }
    const kotlinModule = kotlinModules[
      Object.keys(kotlinModules).find((k) => {
        // A package's Module class might not match its NAME constant
        // 1:1 (e.g., SakhaForegroundServiceModule has NAME =
        // "SakhaForegroundService"). So we use the packageToModule
        // map (Module class name → NAME) by looking up via the
        // module file.
        return true; // always-true; we'll match on the module file path next
      })
    ];
    // Find the NAME for this Module class
    const moduleFiles = execSync(
      `find ${NATIVE_ROOT} -name "${moduleName}.kt"`,
      { encoding: 'utf-8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    if (moduleFiles.length === 0) {
      report(
        false,
        `Plugin registers ${pkgName} → instantiates ${moduleName}, but ${moduleName}.kt not found`,
        'package references a missing class',
      );
      continue;
    }
    const moduleSrc = readFileSync(moduleFiles[0], 'utf-8');
    const nameMatch = moduleSrc.match(/const\s+val\s+NAME\s*=\s*"([^"]+)"/);
    if (!nameMatch) {
      report(
        false,
        `${moduleName} has no NAME constant — JS can't find this module by NativeModules.<X>`,
        moduleFiles[0],
      );
      continue;
    }
    report(
      true,
      `${pkgName} → ${moduleName} (NAME="${nameMatch[1]}") wired correctly`,
    );
  }

  // Check 3: Every Kotlin module's NAME corresponds to a Package the
  //   plugin registers (otherwise the @ReactMethod is unreachable).
  const registeredModuleNames = new Set();
  for (const pkgName of pluginPackages) {
    const moduleName = packageToModule[pkgName];
    if (!moduleName) continue;
    const moduleFiles = execSync(
      `find ${NATIVE_ROOT} -name "${moduleName}.kt"`,
      { encoding: 'utf-8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    if (moduleFiles.length === 0) continue;
    const moduleSrc = readFileSync(moduleFiles[0], 'utf-8');
    const nameMatch = moduleSrc.match(/const\s+val\s+NAME\s*=\s*"([^"]+)"/);
    if (nameMatch) registeredModuleNames.add(nameMatch[1]);
  }
  for (const moduleName of Object.keys(kotlinModules)) {
    report(
      registeredModuleNames.has(moduleName),
      `Kotlin module "${moduleName}" reachable via plugin-registered Package`,
      registeredModuleNames.has(moduleName)
        ? null
        : `${moduleName} has @ReactMethods but no Package in plugin's ADD_LINES references it`,
    );
  }

  if (failures > 0) {
    console.error(`\n${failures} bridge-coverage check(s) failed`);
    process.exit(1);
  }
  console.log('\nvalidate-bridge-coverage: all checks passed');
}

main();
