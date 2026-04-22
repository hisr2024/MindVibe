/**
 * gitaWisdomCore — shared verse-type shim for screens that import
 * `@kiaanverse/api/wisdom/gitaWisdomCore`.
 *
 * The historical `wisdom/` subpath was removed when the repo migrated to
 * the consolidated hooks API. Screens that were built against the old
 * path still import `GitaVerse` from here, so we re-export the canonical
 * type and provide a compact helper shape used by the chat / emotional
 * reset flows.
 */

export type { GitaVerse } from '../types';
