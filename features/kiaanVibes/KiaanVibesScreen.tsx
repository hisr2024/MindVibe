'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ChevronRight, Music2, Upload, Headphones } from 'lucide-react'
import { KiaanVibesPlayer } from './Player'
import type { SourceType, Track } from './types'
import {
  buildGitaChapterTrack,
  buildGitaVerseTracks,
  GITA_CHAPTER_OPTIONS,
  GITA_LANGUAGES,
  type GitaLanguageOption
} from './sources/gitaSource'
import {
  MEDITATION_CATEGORY_DETAILS,
  type MeditationCategoryGroup,
  getMeditationTracksByGroup
} from './sources/meditationSource'
import { deleteUpload, loadUploads, saveUpload, validateUpload } from './sources/uploadSource'

export function KiaanVibesScreen() {
  const [activeSource, setActiveSource] = useState<SourceType>('gita')
  const [queue, setQueue] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [selectedLanguage, setSelectedLanguage] = useState<GitaLanguageOption>('sanskrit')
  const [selectedChapter, setSelectedChapter] = useState(1)

  const [selectedMeditationCategory, setSelectedMeditationCategory] = useState<MeditationCategoryGroup>('ambient')

  const [uploads, setUploads] = useState<Track[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const gitaChapterTrack = useMemo(
    () => buildGitaChapterTrack(selectedChapter, selectedLanguage),
    [selectedChapter, selectedLanguage]
  )

  const gitaVerseTracks = useMemo(
    () => buildGitaVerseTracks(selectedChapter, selectedLanguage),
    [selectedChapter, selectedLanguage]
  )

  const meditationTracks = useMemo(
    () => getMeditationTracksByGroup(selectedMeditationCategory),
    [selectedMeditationCategory]
  )

  const currentTrack = queue[currentIndex] ?? null

  useEffect(() => {
    loadUploads()
      .then(setUploads)
      .catch(() => setUploadError('Uploads are not available in this browser.'))
  }, [])

  const handleSelectTrack = useCallback((track: Track, tracks: Track[], source: SourceType) => {
    const index = tracks.findIndex((item) => item.id === track.id)
    setQueue(tracks)
    setCurrentIndex(index >= 0 ? index : 0)
    setActiveSource(source)
  }, [])

  const handlePlayChapter = useCallback(() => {
    handleSelectTrack(gitaChapterTrack, [gitaChapterTrack], 'gita')
  }, [gitaChapterTrack, handleSelectTrack])

  const handleUploadFiles = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setUploadError(null)
    setIsUploading(true)

    try {
      const newTracks: Track[] = []
      for (const file of files) {
        const error = validateUpload(file)
        if (error) {
          setUploadError(error)
          continue
        }
        const track = await saveUpload(file)
        newTracks.push(track)
      }

      if (newTracks.length > 0) {
        setUploads((prev) => [...newTracks, ...prev])
        setActiveSource('upload')
      }
    } catch (err) {
      setUploadError('Unable to save upload. Please try again.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }, [])

  const handleDeleteUpload = useCallback(async (trackId: string) => {
    await deleteUpload(trackId)
    setUploads((prev) => prev.filter((track) => track.id !== trackId))
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0812] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[150px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0d]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/20 p-2">
                <Headphones className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">KIAAN Vibes</h1>
                <p className="text-xs text-white/40">Gita verses • Meditation • Uploads</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-8">
          <section className="mb-6">
            <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-rose-500/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Bhagavad Gita Audio</h2>
                  <p className="text-xs text-white/60">Featured sacred recitation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSource('gita')}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:border-white/30"
                >
                  Explore
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-3 text-xs text-white/50">
                Start with the Bhagavad Gita as the primary experience, then blend in meditation tracks or your uploads.
              </p>
            </div>
          </section>

          <KiaanVibesPlayer
            queue={queue}
            currentIndex={currentIndex}
            activeSource={activeSource}
            onIndexChange={setCurrentIndex}
            onRequestSource={setActiveSource}
          />

          <section className="mt-8">
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'gita', label: 'Gita Verses', icon: BookOpen },
                { id: 'meditation', label: 'Meditation Audio', icon: Music2 },
                { id: 'upload', label: 'My Uploads', icon: Upload }
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSource(id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    activeSource === id
                      ? 'border-violet-400 bg-violet-500/10 text-violet-100'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {activeSource === 'gita' && (
            <section className="mt-6 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Gita Verses Mode</h3>
                    <p className="text-xs text-white/50">Choose language, chapter, and verse</p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePlayChapter}
                    className="rounded-full border border-white/20 px-4 py-1 text-xs text-white/70 hover:border-white/40"
                  >
                    Play Chapter Audio
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white/60">Language</p>
                    <div className="flex flex-wrap gap-2">
                      {GITA_LANGUAGES.map((language) => (
                        <button
                          key={language.id}
                          type="button"
                          onClick={() => setSelectedLanguage(language.id)}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            selectedLanguage === language.id
                              ? 'border-violet-400 text-violet-200'
                              : 'border-white/10 text-white/50 hover:border-white/30'
                          }`}
                        >
                          {language.label}
                          {!language.available && ' (Soon)'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white/60">Chapter</p>
                    <select
                      value={selectedChapter}
                      onChange={(event) => setSelectedChapter(Number(event.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-white"
                    >
                      {GITA_CHAPTER_OPTIONS.map((chapter) => (
                        <option key={chapter.number} value={chapter.number}>
                          Chapter {chapter.number}: {chapter.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="mt-4 text-xs text-white/40">
                  Verse-level audio will play chapter audio until verse recordings are added. (TODO: replace verse URLs.)
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 className="text-sm font-semibold text-white">Verses</h4>
                <div className="mt-3 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto pr-1 text-xs">
                  {gitaVerseTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelectTrack(track, gitaVerseTracks, 'gita')}
                      className={`rounded-lg border px-2 py-1 text-center ${
                        currentTrack?.id === track.id
                          ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {track.title.replace('Verse ', '')}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSource === 'meditation' && (
            <section className="mt-6 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-white">Meditation Audio Mode</h3>
                <p className="text-xs text-white/50">Ambient, ragas, nature, sleep, devotional</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {MEDITATION_CATEGORY_DETAILS.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedMeditationCategory(category.id)}
                      className={`rounded-xl border px-4 py-3 text-left text-xs transition ${
                        selectedMeditationCategory === category.id
                          ? 'border-violet-400 bg-violet-500/10 text-violet-100'
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{category.label}</p>
                      <p className="text-[11px] text-white/50">{category.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 className="text-sm font-semibold text-white">Tracks</h4>
                <div className="mt-3 space-y-2">
                  {meditationTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelectTrack(track, meditationTracks, 'meditation')}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${
                        currentTrack?.id === track.id
                          ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <span>{track.title}</span>
                      <span className="text-[11px] text-white/40">{track.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSource === 'upload' && (
            <section className="mt-6 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-white">User Upload Mode</h3>
                <p className="text-xs text-white/50">Upload MP3, WAV, or M4A files (max 50MB).</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/m4a"
                    multiple
                    onChange={handleUploadFiles}
                    className="block w-full text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-violet-500/20 file:px-4 file:py-2 file:text-xs file:text-white"
                  />
                  {isUploading && <span className="text-xs text-white/50">Uploading...</span>}
                </div>
                {uploadError && <p className="mt-2 text-xs text-red-300">{uploadError}</p>}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 className="text-sm font-semibold text-white">My Uploads</h4>
                {uploads.length === 0 ? (
                  <p className="mt-2 text-xs text-white/50">No uploads yet. Add a file to play it here.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {uploads.map((track) => (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                          currentTrack?.id === track.id
                            ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                            : 'border-white/10 text-white/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(track, uploads, 'upload')}
                          className="flex-1 text-left"
                        >
                          {track.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUpload(track.id)}
                          className="ml-3 rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60 hover:border-white/30"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="mt-10 h-16" />
        </div>
      </div>
    </main>
  )
}
