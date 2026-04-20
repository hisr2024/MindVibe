/**
 * Profile Tab — 1:1 port of kiaanverse.com/m/profile
 *
 * Avatar + name + email, subscription tier badge, stats row
 * (streak · journeys · verses), menu sections (Account, Subscription,
 * Sacred Tools, Support, Legal), and sign-out.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DivineScreenWrapper,
  SacredCard,
  GoldenDivider,
  OmLoader,
} from '@kiaanverse/ui';
import { apiClient } from '@kiaanverse/api';

// ── Types ──────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  profile_photo_url?: string;
  subscription_tier: 'free' | 'sadhak' | 'siddha';
  streak_days: number;
  journeys_completed: number;
  verses_read: number;
  language: string;
  created_at: string;
}

// ── Menu structure ─────────────────────────────────────────
const MENU_SECTIONS: ReadonlyArray<{
  title: string;
  items: ReadonlyArray<{
    label: string;
    route: string;
    icon: string;
    gold?: boolean;
  }>;
}> = [
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile',    route: '/(app)/edit-profile',      icon: '✦' },
      { label: 'Change Password', route: '/(app)/change-password',   icon: '🔒' },
      { label: 'Language',        route: '/(app)/language-settings', icon: '🌐' },
      { label: 'Notifications',   route: '/(app)/notifications',     icon: '🔔' },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { label: 'My Subscription', route: '/(app)/subscription',       icon: '✦', gold: true },
      { label: 'Upgrade Plan',    route: '/(app)/subscription/plans', icon: '⬆', gold: true },
      { label: 'Billing History', route: '/(app)/billing-history',    icon: '📋' },
    ],
  },
  {
    title: 'Sacred Tools',
    items: [
      { label: 'My Journeys',     route: '/(tabs)/journal',         icon: '🗺' },
      { label: 'Karma Footprint', route: '/(app)/karma-footprint',  icon: '☸' },
      { label: 'KarmaLytix',      route: '/(app)/karmalytix',       icon: '📊' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help Center', route: '/(app)/help',    icon: '❓' },
      { label: 'Contact Us',  route: '/(app)/contact', icon: '✉' },
      { label: 'Rate the App', route: 'external:rate', icon: '⭐' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy Policy',   route: '/(app)/privacy',      icon: '📄' },
      { label: 'Terms of Service', route: '/(app)/terms',        icon: '📄' },
      { label: 'Data & Privacy',   route: '/(app)/data-privacy', icon: '🛡' },
    ],
  },
];

const TIER_CONFIG: Record<
  UserProfile['subscription_tier'],
  { label: string; color: string; bg: string }
> = {
  free:   { label: 'Free Seeker', color: 'rgba(240,235,225,0.5)', bg: 'rgba(255,255,255,0.05)' },
  sadhak: { label: 'Sadhak',      color: '#D4A017',               bg: 'rgba(212,160,23,0.12)' },
  siddha: { label: 'Siddha',      color: '#F5E27A',               bg: 'rgba(245,226,122,0.15)' },
};

export default function ProfileScreen(): React.JSX.Element {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get<UserProfile>('/api/user/me');
      setProfile(data);
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
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
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('refresh_token');
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const handleMenuPress = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route.startsWith('external:')) {
      // TODO: handle external links (Rate app → Play Store / App Store)
      return;
    }
    router.push(route as never);
  };

  if (loading) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label="Loading your sacred profile…" />
        </View>
      </DivineScreenWrapper>
    );
  }

  const tier = TIER_CONFIG[profile?.subscription_tier ?? 'free'];

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── AVATAR SECTION ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {profile?.profile_photo_url ? (
              <Image source={{ uri: profile.profile_photo_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#1B4FBB', '#0E7490']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.name?.charAt(0)?.toUpperCase() ?? 'S'}
                </Text>
              </LinearGradient>
            )}
            {/* Gold ring around avatar */}
            <View style={styles.avatarRing} />
          </View>

          <Text style={styles.name}>{profile?.name ?? 'Sacred Seeker'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>

          {/* Subscription tier badge */}
          <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
            <Text style={[styles.tierText, { color: tier.color }]}>✦ {tier.label}</Text>
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <SacredCard style={styles.statsCard}>
          <StatItem value={profile?.streak_days ?? 0}         label="Day Streak"  unit="🔥" />
          <View style={styles.statDivider} />
          <StatItem value={profile?.journeys_completed ?? 0}  label="Journeys"    unit="☸" />
          <View style={styles.statDivider} />
          <StatItem value={profile?.verses_read ?? 0}         label="Verses Read" unit="📖" />
        </SacredCard>

        {/* ── MENU SECTIONS ── */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <SacredCard style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.route}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(item.route)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, item.gold && { color: '#D4A017' }]}>
                      {item.label}
                    </Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && (
                    <GoldenDivider style={{ marginHorizontal: 16 }} />
                  )}
                </React.Fragment>
              ))}
            </SacredCard>
          </View>
        ))}

        {/* ── SIGN OUT ── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* Member since */}
        {profile?.created_at && (
          <Text style={styles.memberSince}>
            Sacred seeker since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}
      </ScrollView>
    </DivineScreenWrapper>
  );
}

function StatItem({
  value,
  label,
  unit,
}: {
  value: number;
  label: string;
  unit: string;
}): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const GOLD = '#D4A017';
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#fff',
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 43,
    borderWidth: 1.5,
    borderColor: 'rgba(212,160,23,0.5)',
  },
  name: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#F0EBE1',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.45)',
    marginBottom: 10,
  },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
  },
  tierText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 0.08,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: GOLD,
  },
  statUnit: { fontSize: 14, marginTop: -4 },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.45)',
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: 'rgba(212,160,23,0.15)' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    color: 'rgba(240,235,225,0.4)',
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionCard: { padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: { fontSize: 16, width: 28 },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#F0EBE1',
  },
  menuChevron: {
    fontSize: 20,
    color: 'rgba(240,235,225,0.3)',
    fontWeight: '300',
  },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    color: '#EF4444',
  },
  memberSince: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.25)',
    textAlign: 'center',
    marginTop: 16,
  },
});
