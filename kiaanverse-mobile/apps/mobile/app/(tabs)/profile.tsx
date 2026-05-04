/**
 * Profile Tab — The Seeker's Identity
 *
 * Layout (top → bottom):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Gradient hero (150 px)                       │
 *   │    • 80 px avatar with breathing gold ring    │
 *   │    • Name / email                             │
 *   │    • Animated TierBadge (per tier motion)     │
 *   ├──────────────────────────────────────────────┤
 *   │  3-column stats card                          │
 *   │    [🔥 Streak] │ [☸ Journeys] │ [📖 Verses]   │
 *   ├──────────────────────────────────────────────┤
 *   │  Menu sections (Account, Subscription, …)     │
 *   ├──────────────────────────────────────────────┤
 *   │  Sign Out                                     │
 *   └──────────────────────────────────────────────┘
 *
 * Stats numbers flow from the existing /api/user/me endpoint. We keep
 * the tier mapping aligned with the store's `SubscriptionTier` union so
 * the hero, badge, and downstream subscription screens never drift.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  DivineScreenWrapper,
  GoldenDivider,
  OmLoader,
  SacredCard,
} from '@kiaanverse/ui';
import { apiClient } from '@kiaanverse/api';
import { useAuthStore, type SubscriptionTier } from '@kiaanverse/store';

import { ProfileHero, StatsRow } from '../../components/profile';

// React Native / Expo global — always defined at runtime.
declare const __DEV__: boolean;

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.4)';
const GOLD = '#D4A017';

interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly profile_photo_url?: string | null;
  readonly subscription_tier: SubscriptionTier;
  readonly streak_days: number;
  readonly journeys_completed: number;
  readonly verses_read: number;
  readonly language?: string;
  readonly created_at?: string;
}

/**
 * The backend's `subscription_tier` string originates from an enum that
 * will occasionally emit unknown values during schema migrations. We
 * coerce here so the UI never crashes on an unexpected string.
 */
function toSubscriptionTier(raw: unknown): SubscriptionTier {
  switch (raw) {
    case 'free':
    case 'bhakta':
    case 'sadhak':
    case 'siddha':
      return raw;
    default:
      return 'free';
  }
}

interface MenuItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly gold?: boolean;
}

interface MenuSection {
  readonly title: string;
  readonly items: readonly MenuItem[];
}

const MENU_SECTIONS: readonly MenuSection[] = [
  {
    title: 'Account',
    items: [
      // Group-segment-stripped — see the matching comment in the
      // Legal block below for the full rationale.
      { label: 'Edit Profile', route: '/edit-profile', icon: '✦' },
      { label: 'Change Password', route: '/change-password', icon: '🔒' },
      { label: 'Language', route: '/language-settings', icon: '🌐' },
      { label: 'Notifications', route: '/notifications', icon: '🔔' },
    ],
  },
  {
    title: 'Subscription',
    items: [
      {
        label: 'My Subscription',
        route: '/subscription',
        icon: '✦',
        gold: true,
      },
      {
        label: 'Upgrade Plan',
        route: '/subscription/plans',
        icon: '⬆',
        gold: true,
      },
      // Billing History entry removed: no app/(app)/billing-history.tsx
      // exists yet, so tapping previously 404'd. Restore once the
      // backend transaction-history endpoint + screen are ready.
    ],
  },
  {
    title: 'Sacred Tools',
    items: [
      { label: 'My Journeys', route: '/journey', icon: '🗺' },
      { label: 'Karma Footprint', route: '/karma-footprint', icon: '☸' },
      { label: 'KarmaLytix', route: '/analytics', icon: '📊' },
    ],
  },
  {
    title: 'Support',
    items: [
      // Group-segment-stripped routes — `app/(app)/help.tsx` is
      // reachable as /help, not /(app)/help. See the matching comment
      // in the Legal block below for the full rationale.
      { label: 'Help Center', route: '/help', icon: '❓' },
      { label: 'Contact Us', route: '/contact', icon: '✉' },
      { label: 'Rate the App', route: 'external:rate', icon: '⭐' },
    ],
  },
  {
    title: 'Legal',
    items: [
      // Expo Router 3.5 strips group segments from URL paths — pushing
      // `/(app)/privacy` is treated as a literal path containing the
      // segment "(app)" that doesn't exist, hence the
      // "kiaanverse:///(app)/privacy → Unmatched Route" 404 in
      // production AABs. The actual file at app/(app)/privacy.tsx is
      // reachable as /privacy because the `(app)` group is purely
      // organisational.
      { label: 'Privacy Policy', route: '/privacy', icon: '📄' },
      { label: 'Terms of Service', route: '/terms', icon: '📄' },
      { label: 'Data & Privacy', route: '/data-privacy', icon: '🛡' },
    ],
  },
];

export default function ProfileScreen(): React.JSX.Element {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await apiClient.get<UserProfile>('/api/user/me');
        if (alive) setProfile(data);
      } catch (e) {
        if (__DEV__) console.error('Profile fetch error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleMenuPress = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route.startsWith('external:')) {
      // External links (e.g., store rating) — hooked up in a later pass.
      return;
    }
    router.push(route as never);
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Kiaanverse?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }, [logout]);

  if (loading) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label="Loading your sacred profile…" />
        </View>
      </DivineScreenWrapper>
    );
  }

  const tier: SubscriptionTier = profile
    ? toSubscriptionTier(profile.subscription_tier)
    : 'free';

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHero
          name={profile?.name ?? 'Sacred Seeker'}
          email={profile?.email ?? undefined}
          photoUrl={profile?.profile_photo_url ?? null}
          tier={tier}
          topInset={52}
        />

        <View style={styles.statsWrap}>
          <StatsRow
            streakDays={profile?.streak_days ?? 0}
            journeys={profile?.journeys_completed ?? 0}
            verses={profile?.verses_read ?? 0}
          />
        </View>

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <SacredCard
              style={styles.sectionCard}
              contentStyle={styles.sectionCardContent}
            >
              {section.items.map((item, idx) => (
                <React.Fragment key={item.route}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(item.route)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.menuLabel,
                        item.gold ? styles.menuLabelGold : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </TouchableOpacity>
                  {idx < section.items.length - 1 ? (
                    <GoldenDivider style={styles.menuDivider} />
                  ) : null}
                </React.Fragment>
              ))}
            </SacredCard>
          </View>
        ))}

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {profile?.created_at ? (
          <Text style={styles.memberSince}>
            Sacred seeker since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        ) : null}
      </ScrollView>
    </DivineScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsWrap: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionCard: {
    width: '100%',
  },
  sectionCardContent: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    fontSize: 16,
    width: 28,
    color: SACRED_WHITE,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    color: SACRED_WHITE,
  },
  menuLabelGold: {
    color: GOLD,
    fontFamily: 'Outfit-Medium',
  },
  menuChevron: {
    fontSize: 20,
    color: 'rgba(240,235,225,0.35)',
    fontWeight: '300',
  },
  menuDivider: {
    marginHorizontal: 16,
  },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  signOutText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 15,
    color: '#EF4444',
  },
  memberSince: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: 'rgba(240,235,225,0.25)',
    textAlign: 'center',
    marginTop: 16,
  },
});
