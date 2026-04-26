/**
 * userUploads — Import and persist user's private music files.
 *
 * Uses expo-document-picker to let the user select audio files from their
 * device (Google Drive, Files, Downloads, SD card — anywhere the system
 * picker exposes). The picked file is copied into the app's private
 * documents directory via expo-file-system so it persists across app
 * restarts and is playable by react-native-track-player as a file://
 * URI. Metadata (title, artist, duration) is stored as JSON next to the
 * file so the Library can render it without re-parsing.
 *
 * Supported formats: any audio the OS decoder supports. On Android this
 * is MP3, M4A, AAC, WAV, FLAC, OGG, MIDI, and more. On iOS it is MP3,
 * M4A, AAC, WAV, AIFF, CAF.
 *
 * Privacy: files never leave the device. The app's documents directory
 * is sandboxed and scoped to this install — no other app can read it.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import type { MeditationTrack } from '@kiaanverse/api';

const UPLOADS_DIR = FileSystem.documentDirectory + 'vibe-uploads/';
const MANIFEST_PATH = UPLOADS_DIR + 'manifest.json';

/**
 * The widest reasonable set of audio file extensions. Validated as a fall-
 * back when the OS picker reports a non-audio MIME type (some Android OEMs
 * — MIUI, ColorOS, OneUI — return `application/octet-stream` for ordinary
 * MP3s if the user picked them through the "Recent Files" path, which made
 * `audio/*` filtering hide perfectly playable files from the picker).
 */
export const ACCEPTED_AUDIO_EXTENSIONS: readonly string[] = [
  '.mp3', '.m4a', '.m4b', '.mp4', '.aac', '.aacp',
  '.wav', '.wave',
  '.ogg', '.oga', '.opus',
  '.flac',
  '.webm', '.weba',
  '.3gp', '.3gpp', '.amr',
  '.mid', '.midi',
  '.wma',
  '.aiff', '.aif', '.caf',
];

function hasAudioExtension(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return ACCEPTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function looksLikeAudio(asset: {
  readonly name: string;
  readonly mimeType: string | null | undefined;
}): boolean {
  const mime = (asset.mimeType ?? '').toLowerCase();
  if (mime.startsWith('audio/')) return true;
  return hasAudioExtension(asset.name);
}

export interface UserTrack extends MeditationTrack {
  /** Absolute file:// URI to the copied audio asset. */
  audioUrl: string;
  /** Always 'user-upload'. Lets the UI distinguish built-ins from uploads. */
  source: 'user-upload';
  /** Unix ms of when this track was imported. */
  uploadedAt: number;
  /** Size of the copied file in bytes (for "Storage used" UI). */
  fileSize: number;
  /** Original file name (e.g. "my-mantra.mp3") preserved for display. */
  originalFileName: string;
}

interface UploadManifest {
  readonly version: 1;
  readonly tracks: readonly UserTrack[];
}

const EMPTY_MANIFEST: UploadManifest = { version: 1, tracks: [] };

async function ensureUploadsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(UPLOADS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(UPLOADS_DIR, { intermediates: true });
  }
}

async function readManifest(): Promise<UploadManifest> {
  try {
    const info = await FileSystem.getInfoAsync(MANIFEST_PATH);
    if (!info.exists) return EMPTY_MANIFEST;
    const raw = await FileSystem.readAsStringAsync(MANIFEST_PATH);
    const parsed = JSON.parse(raw) as UploadManifest;
    if (parsed.version !== 1 || !Array.isArray(parsed.tracks)) {
      return EMPTY_MANIFEST;
    }
    return parsed;
  } catch {
    return EMPTY_MANIFEST;
  }
}

async function writeManifest(manifest: UploadManifest): Promise<void> {
  await ensureUploadsDir();
  await FileSystem.writeAsStringAsync(
    MANIFEST_PATH,
    JSON.stringify(manifest, null, 2)
  );
}

/** List all previously uploaded user tracks, newest first. */
export async function listUserTracks(): Promise<readonly UserTrack[]> {
  const manifest = await readManifest();
  return [...manifest.tracks].sort((a, b) => b.uploadedAt - a.uploadedAt);
}

/**
 * Open the system file picker for audio. On success, copies the chosen
 * file into the sandbox and registers it in the manifest. Returns the
 * new UserTrack, or null if the user cancelled.
 *
 * Robustness on Android:
 *   - First pass uses an audio-only MIME filter so the system picker
 *     pre-filters to audio.
 *   - If the user cancels (e.g. because every file is greyed out, which
 *     happens on some OEM builds that mis-tag MP3 / FLAC), a second pass
 *     opens the picker with the all-files filter. The picked file is then
 *     validated by extension instead of MIME, so `application/octet-stream`
 *     and friends still pass through.
 *
 * Throws when the user explicitly picked a non-audio file in the wide pass
 * — callers can show that as "unsupported file" without conflating it
 * with a normal cancellation.
 */
export async function pickAndImportAudio(): Promise<UserTrack | null> {
  // ── Pass 1: strict audio/* picker ──
  let result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  // ── Pass 2: fall back to */* on cancel so users on quirky Android OEMs
  //   that hide MP3s under audio/* still have a path to upload music. We
  //   validate by extension below.
  if (result.canceled) {
    result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
  }

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) return null;

  // Validate by extension when MIME is missing/unreliable. If the user
  // picked something that isn't audio at all (a PDF, an image), throw
  // a clear error so the caller can show it.
  if (!looksLikeAudio({ name: asset.name, mimeType: asset.mimeType })) {
    throw new Error(
      `${asset.name} is not a recognised audio format. Try MP3, M4A, WAV, OGG, Opus, FLAC, AAC or WebM.`
    );
  }

  await ensureUploadsDir();

  // Derive a stable, collision-free destination filename.
  const extension = asset.name.includes('.')
    ? asset.name.slice(asset.name.lastIndexOf('.'))
    : '.mp3';
  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const destination = UPLOADS_DIR + id + extension;

  await FileSystem.copyAsync({ from: asset.uri, to: destination });

  const info = await FileSystem.getInfoAsync(destination);
  const fileSize =
    info.exists && typeof (info as { size?: number }).size === 'number'
      ? (info as { size: number }).size
      : (asset.size ?? 0);

  // Title = filename without extension. User can edit later in-UI.
  const displayTitle = asset.name.replace(/\.[^.]+$/, '');

  const track: UserTrack = {
    id,
    title: displayTitle,
    artist: 'My Music',
    duration: 0, // TrackPlayer will populate from the file's metadata
    // Uploads don't map to the curated 4-category taxonomy; 'meditation'
    // is the most neutral bucket so they still render in the "All" list.
    category: 'meditation',
    audioUrl: destination,
    description: asset.name,
    source: 'user-upload',
    uploadedAt: Date.now(),
    fileSize,
    originalFileName: asset.name,
  };

  const manifest = await readManifest();
  await writeManifest({
    version: 1,
    tracks: [track, ...manifest.tracks],
  });

  return track;
}

/** Delete an uploaded track and its audio file. */
export async function deleteUserTrack(trackId: string): Promise<void> {
  const manifest = await readManifest();
  const track = manifest.tracks.find((t) => t.id === trackId);
  if (!track) return;

  try {
    const info = await FileSystem.getInfoAsync(track.audioUrl);
    if (info.exists) {
      await FileSystem.deleteAsync(track.audioUrl, { idempotent: true });
    }
  } catch {
    // Swallow — the manifest update still removes it from the UI.
  }

  await writeManifest({
    version: 1,
    tracks: manifest.tracks.filter((t) => t.id !== trackId),
  });
}

/** Rename an uploaded track's display title. */
export async function renameUserTrack(
  trackId: string,
  newTitle: string
): Promise<void> {
  const manifest = await readManifest();
  const next = manifest.tracks.map((t) =>
    t.id === trackId ? { ...t, title: newTitle } : t
  );
  await writeManifest({ version: 1, tracks: next });
}

/** Sum file sizes of all uploads in bytes. */
export async function getTotalUploadSize(): Promise<number> {
  const tracks = await listUserTracks();
  return tracks.reduce((sum, t) => sum + t.fileSize, 0);
}
