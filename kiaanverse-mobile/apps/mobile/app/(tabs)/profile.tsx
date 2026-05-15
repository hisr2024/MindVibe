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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
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
import { useTranslation } from '@kiaanverse/i18n';

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
  /** i18n key for the menu label, e.g. "settings.menuEditProfile". */
  readonly labelKey: string;
  readonly route: string;
  readonly icon: string;
  readonly gold?: boolean;
}

interface MenuSection {
  /** i18n key for the section heading. */
  readonly titleKey: string;
  readonly items: readonly MenuItem[];
}

const MENU_SECTIONS: readonly MenuSection[] = [
  {
    titleKey: 'settings.sectionAccount',
    items: [
      // Group-segment-stripped — see the matching comment in the
      // Legal block below for the full rationale.
      { labelKey: 'settings.menuEditProfile', route: '/edit-profile', icon: '✦' },
      { labelKey: 'settings.menuChangePassword', route: '/change-password', icon: '🔒' },
      { labelKey: 'settings.menuLanguage', route: '/language-settings', icon: '🌐' },
      { labelKey: 'settings.menuNotifications', route: '/notifications', icon: '🔔' },
    ],
  },
  {
    titleKey: 'settings.sectionSubscription',
    items: [
      { labelKey: 'settings.menuMySubscription', route: '/subscription', icon: '✦', gold: true },
      { labelKey: 'settings.menuUpgradePlan', route: '/subscription/plans', icon: '⬆', gold: true },
      // Billing History entry removed: no app/(app)/billing-history.tsx
      // exists yet, so tapping previously 404'd. Restore once the
      // backend transaction-history endpoint + screen are ready.
    ],
  },
  {
    titleKey: 'settings.sectionSacredTools',
    items: [
      { labelKey: 'settings.menuMyJourneys', route: '/journey', icon: '🗺' },
      { labelKey: 'settings.menuKarmaFootprint', route: '/karma-footprint', icon: '☸' },
      { labelKey: 'settings.menuKarmalytix', route: '/karmalytix', icon: '📊' },
    ],
  },
  {
    titleKey: 'settings.sectionSupport',
    items: [
      // Group-segment-stripped routes — `app/(app)/help.tsx` is
      // reachable as /help, not /(app)/help. See the matching comment
      // in the Legal block below for the full rationale.
      { labelKey: 'settings.menuHelpCenter', route: '/help', icon: '❓' },
      { labelKey: 'settings.menuContactUs', route: '/contact', icon: '✉' },
      { labelKey: 'settings.menuRateApp', route: 'external:rate', icon: '⭐' },
    ],
  },
  {
    titleKey: 'settings.sectionLegal',
    items: [
      // Expo Router 3.5 strips group segments from URL paths — pushing
      // `/(app)/privacy` is treated as a literal path containing the
      // segment "(app)" that doesn't exist, hence the
      // "kiaanverse:///(app)/privacy → Unmatched Route" 404 in
      // production AABs. The actual file at app/(app)/privacy.tsx is
      // reachable as /privacy because the `(app)` group is purely
      // organisational.
      { labelKey: 'settings.menuPrivacyPolicy', route: '/privacy', icon: '📄' },
      { labelKey: 'settings.menuTermsOfService', route: '/terms', icon: '📄' },
      { labelKey: 'settings.menuDataPrivacy', route: '/data-privacy', icon: '🛡' },
    ],
  },
];

export default function ProfileScreen(): React.JSX.Element {
  const { t, locale } = useTranslation();
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
    if (route === 'external:rate') {
      // Native store-rating URL. Falls back to the web Play Store / App Store
      // page if the native scheme isn't installed (rare, but handled).
      const PACKAGE_ID = 'com.kiaanverse.app';
      const APPLE_ID = '6743000000'; // placeholder until App Store id is final
      const native =
        Platform.OS === 'android'
          ? `market://details?id=${PACKAGE_ID}`
          : `itms-apps://itunes.apple.com/app/id${APPLE_ID}?action=write-review`;
      const web =
        Platform.OS === 'android'
          ? `https://play.google.com/store/apps/details?id=${PACKAGE_ID}`
          : `https://apps.apple.com/app/id${APPLE_ID}?action=write-review`;
      Linking.canOpenURL(native)
        .then((ok) => Linking.openURL(ok ? native : web))
        .catch(() => {
          void Linking.openURL(web).catch(() => undefined);
        });
      return;
    }
    if (route.startsWith('external:')) {
      // Other external links — hooked up in a later pass.
      return;
    }
    router.push(route as never);
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('settings.signOutConfirmTitle'),
      t('settings.signOutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }, [logout, t]);

  // Localized member-since date — uses the active app locale (with a
  // safe fallback to en-US when the active code isn't a valid Intl tag).
  const memberSinceText = useMemo(() => {
    if (!profile?.created_at) return null;
    let intlLocale = 'en-US';
    try {
      // `Intl.DateTimeFormat.supportedLocalesOf` will throw on invalid
      // tags; the catch keeps us on en-US in that case.
      const supported = Intl.DateTimeFormat.supportedLocalesOf([locale]);
      if (supported.length > 0) intlLocale = supported[0]!;
    } catch {
      // keep en-US
    }
    const date = new Date(profile.created_at).toLocaleDateString(intlLocale, {
      month: 'long',
      year: 'numeric',
    });
    return t('settings.memberSince', { date });
  }, [profile?.created_at, locale, t]);

  if (loading) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label={t('settings.loadingProfile')} />
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
          name={profile?.name ?? t('settings.defaultUserName')}
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
          <View key={section.titleKey} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
            <SacredCard
              style={styles.sectionCard}
              contentStyle={styles.sectionCardContent}
            >
              {section.items.map((item, idx) => {
                const label = t(item.labelKey);
                return (
                  <React.Fragment key={item.route}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuPress(item.route)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                    >
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.menuLabel,
                          item.gold ? styles.menuLabelGold : null,
                        ]}
                      >
                        {label}
                      </Text>
                      <Text style={styles.menuChevron}>›</Text>
                    </TouchableOpacity>
                    {idx < section.items.length - 1 ? (
                      <GoldenDivider style={styles.menuDivider} />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </SacredCard>
          </View>
        ))}

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel={t('settings.signOut')}
        >
          <Text style={styles.signOutText}>
            {signingOut ? t('settings.signingOut') : t('settings.signOut')}
          </Text>
        </TouchableOpacity>

        {memberSinceText ? (
          <Text style={styles.memberSince}>{memberSinceText}</Text>
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
