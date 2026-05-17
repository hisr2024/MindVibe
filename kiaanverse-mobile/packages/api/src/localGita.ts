/**
 * localGita — Bundled Bhagavad Gita corpus, identical to the web app's
 * `data/gita/{sa,en,hi}.json`.
 *
 * The backend's `/api/gita/chapters/:id` and `/api/gita/verses/:c/:v`
 * endpoints currently return placeholder rows ("Bhagavad Gita Chapter X,
 * Verse Y teaches wisdom on …") for every verse beyond 1.1 because the
 * MeditationVerseDB seed only ships a single real shloka per chapter.
 * The web mobile app (`kiaanverse.com/m/`) sidesteps this by reading the
 * JSON corpus directly. This module does the same for the React Native
 * app so both surfaces show the full 700-verse text in Sanskrit, English
 * and Hindi.
 *
 * Files are bundled into the JS bundle by Metro at build time, so this
 * works offline and never depends on the backend being reachable.
 */

import saData from './gita-data/sa.json';
import enData from './gita-data/en.json';
import hiData from './gita-data/hi.json';

interface RawLanguageFile {
  readonly languageCode: string;
  readonly languageName: string;
  readonly chapters: ReadonlyArray<RawChapter>;
}

interface RawChapter {
  readonly chapterNumber: number;
  readonly nameSanskrit: string;
  readonly nameEnglish: string;
  readonly description?: string;
  readonly verseCount: number;
  readonly verses: ReadonlyArray<RawVerse>;
}

interface RawVerse {
  readonly verseNumber: number;
  readonly sanskrit?: string;
  readonly transliteration?: string;
  readonly translation: string;
}

const SA = saData as RawLanguageFile;
const EN = enData as RawLanguageFile;
const HI = hiData as RawLanguageFile;

/** A merged verse with all three languages resolved. */
export interface LocalGitaVerse {
  readonly chapter: number;
  readonly verse: number;
  readonly verseId: string;
  readonly sanskrit: string;
  readonly transliteration: string;
  readonly english: string;
  readonly hindi: string;
}

/** Chapter header without verses — used by chapter list views. */
export interface LocalGitaChapterHeader {
  readonly chapter: number;
  readonly nameSanskrit: string;
  readonly nameEnglish: string;
  readonly description: string;
  readonly verseCount: number;
}

/** Full chapter with merged verses for all 3 languages. */
export interface LocalGitaChapter extends LocalGitaChapterHeader {
  readonly verses: ReadonlyArray<LocalGitaVerse>;
}

// ============ Internal helpers ============

function findChapter(file: RawLanguageFile, chapterNum: number): RawChapter | undefined {
  return file.chapters.find((c) => c.chapterNumber === chapterNum);
}

function findVerse(chapter: RawChapter | undefined, verseNum: number): RawVerse | undefined {
  return chapter?.verses.find((v) => v.verseNumber === verseNum);
}

// ============ Public API ============

/** All 18 chapter headers (Sanskrit + English name + verse count). */
export function getLocalChapterHeaders(): ReadonlyArray<LocalGitaChapterHeader> {
  return EN.chapters.map((c) => ({
    chapter: c.chapterNumber,
    nameSanskrit: c.nameSanskrit,
    nameEnglish: c.nameEnglish,
    description: c.description ?? '',
    verseCount: c.verseCount,
  }));
}

/** Get a single chapter with every verse merged across the 3 languages. */
export function getLocalChapter(chapterNum: number): LocalGitaChapter | undefined {
  const enChapter = findChapter(EN, chapterNum);
  const saChapter = findChapter(SA, chapterNum);
  const hiChapter = findChapter(HI, chapterNum);
  if (!enChapter) return undefined;

  const verses: LocalGitaVerse[] = enChapter.verses.map((enVerse) => {
    const saVerse = findVerse(saChapter, enVerse.verseNumber);
    const hiVerse = findVerse(hiChapter, enVerse.verseNumber);
    return {
      chapter: chapterNum,
      verse: enVerse.verseNumber,
      verseId: `${chapterNum}.${enVerse.verseNumber}`,
      sanskrit: saVerse?.sanskrit ?? '',
      transliteration: saVerse?.transliteration ?? '',
      english: enVerse.translation,
      hindi: hiVerse?.translation ?? '',
    };
  });

  return {
    chapter: chapterNum,
    nameSanskrit: enChapter.nameSanskrit,
    nameEnglish: enChapter.nameEnglish,
    description: enChapter.description ?? '',
    verseCount: enChapter.verseCount,
    verses,
  };
}

/** Get a single merged verse, or undefined if not found. */
export function getLocalVerse(chapterNum: number, verseNum: number): LocalGitaVerse | undefined {
  const chapter = getLocalChapter(chapterNum);
  return chapter?.verses.find((v) => v.verse === verseNum);
}

/** Did the local corpus successfully load? Used for diagnostics. */
export function isLocalGitaAvailable(): boolean {
  return EN.chapters.length === 18 && SA.chapters.length === 18 && HI.chapters.length === 18;
}
