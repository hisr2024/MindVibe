/**
 * UploadsSection — "My Music" tab body.
 *
 * Lets the user pick any audio file from their device (via the system
 * file picker) and play it through the KIAAN Vibe Player. Uploaded
 * tracks persist in the app sandbox across restarts and can be renamed
 * or deleted in-line.
 *
 * Everything is offline — no network upload happens. "Upload" here
 * means "import into the app". Files live in the sandboxed documents
 * directory and are only accessible to this install.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, Trash2, Music } from 'lucide-react-native';
import type { MeditationTrack } from '@kiaanverse/api';
import { PlayerTrackCard } from './PlayerTrackCard';
import {
  deleteUserTrack,
  listUserTracks,
  pickAndImportAudio,
  type UserTrack,
} from './userUploads';

// React Native/Expo global — available at runtime, not in @types/react-native.
declare const __DEV__: boolean;

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212,160,23,0.28)';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';

export interface UploadsSectionProps {
  readonly currentTrackId: string | undefined;
  readonly isPlaying: boolean;
  readonly onTrackPress: (track: MeditationTrack) => void;
}

export function UploadsSection({
  currentTrackId,
  isPlaying,
  onTrackPress,
}: UploadsSectionProps): React.JSX.Element {
  const [tracks, setTracks] = useState<readonly UserTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await listUserTracks();
      setTracks(next);
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[UploadsSection] listUserTracks failed:', err);
      }
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleImport = useCallback(async () => {
    if (importing) return;
    void Haptics.selectionAsync().catch(() => undefined);
    setImporting(true);
    try {
      const track = await pickAndImportAudio();
      if (track) {
        await refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('Import failed', `We couldn't add that file. ${message}`, [
        { text: 'OK' },
      ]);
    } finally {
      setImporting(false);
    }
  }, [importing, refresh]);

  const handleDelete = useCallback(
    (track: UserTrack) => {
      Alert.alert(
        'Delete track',
        `Remove "${track.title}" from your library? The original file on your device is not affected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteUserTrack(track.id);
              await refresh();
            },
          },
        ]
      );
    },
    [refresh]
  );

  const renderTrack = useCallback(
    ({ item }: ListRenderItemInfo<UserTrack>) => {
      const isCurrent = currentTrackId === item.id;
      return (
        <View style={styles.row}>
          <View style={styles.rowCard}>
            <PlayerTrackCard
              track={{
                id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration,
                category: item.category,
              }}
              isCurrent={isCurrent}
              isPlaying={isCurrent && isPlaying}
              isBookmarked={false}
              onPress={() => onTrackPress(item)}
              onToggleBookmark={() => undefined}
            />
          </View>
          <Pressable
            onPress={() => handleDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title}`}
            hitSlop={10}
            style={styles.deleteButton}
          >
            <Trash2 size={18} color="rgba(229,115,115,0.85)" />
          </Pressable>
        </View>
      );
    },
    [currentTrackId, isPlaying, onTrackPress, handleDelete]
  );

  const keyExtractor = useCallback((item: UserTrack) => item.id, []);

  return (
    <FlatList
      data={tracks}
      renderItem={renderTrack}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.headerStack}>
          <Pressable
            onPress={handleImport}
            accessibilityRole="button"
            accessibilityLabel="Add your music"
            disabled={importing}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
              importing && styles.addButtonDisabled,
            ]}
          >
            {importing ? (
              <ActivityIndicator color={GOLD} />
            ) : (
              <>
                <Plus size={18} color={GOLD} />
                <Text style={styles.addButtonText}>Add your music</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.hintText}>
            Import MP3, M4A, WAV, FLAC, OGG or any audio file from your device.
            Your files stay private — they never leave this phone.
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={GOLD} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Music size={40} color={GOLD_SOFT} />
            <Text style={styles.emptyTitle}>Your library is empty</Text>
            <Text style={styles.emptySubtitle}>
              Tap “Add your music” to import your first sacred sound.
            </Text>
          </View>
        )
      }
      ItemSeparatorComponent={ItemSeparator}
    />
  );
}

function ItemSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  headerStack: {
    gap: 10,
    paddingBottom: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'rgba(212,160,23,0.12)',
  },
  addButtonPressed: {
    backgroundColor: 'rgba(212,160,23,0.22)',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: GOLD,
    letterSpacing: 0.3,
  },
  hintText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowCard: {
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,115,115,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(229,115,115,0.25)',
  },
  stateContainer: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 18,
    color: SACRED_WHITE,
  },
  emptySubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  separator: {
    height: 10,
  },
});
