import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Button } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { authEndpoints } from '@eta/api-client';
import { router } from 'expo-router';
import { Phone, Mail, Shield, Info, LogOut } from 'lucide-react-native';

import { useJourneyStore } from '../../stores/journey.store';
import { useCartStore } from '../../stores/cart.store';

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearJourney = useJourneyStore((s) => s.clearJourney);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.replace('/(auth)/login');
  }, [hasHydrated, isAuthenticated]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && !user) {
      authEndpoints.me().then(({ data }) => setUser(data)).catch(() => {});
    }
  }, [hasHydrated, isAuthenticated, user]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await authEndpoints.me();
      setUser(data as any);
    } catch {}
    setRefreshing(false);
  }, [setUser]);

  if (!hasHydrated || !isAuthenticated) return null;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text style={{ ...t.typography.bodySm, color: t.colors.textMuted, marginTop: 12 }}>Loading profile…</Text>
      </View>
    );
  }

  const fullName = user.full_name?.trim() || 'Traveller';
  const initial = fullName[0]?.toUpperCase() ?? '?';

  async function handleLogout() {
    clearCart();
    clearJourney();
    await clearAuth();
  }

  function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
      <View style={styles.infoRow}>
        <View style={[styles.infoIcon, { backgroundColor: t.colors.surface2 }]}>
          {icon}
        </View>
        <View>
          <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>{label}</Text>
          <Text style={{ ...t.typography.body, color: t.colors.textPrimary, marginTop: 2 }}>{value}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>ACCOUNT</Text>
      <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Your profile
      </Text>

      {/* Identity card */}
      <Card tone="powder" padding="lg" radius="card" style={styles.card}>
        <View style={styles.identityRow}>
          <View style={[styles.avatar, { backgroundColor: t.colors.primary }]}>
            <Text style={{ fontSize: 26, fontWeight: '600', color: t.colors.textOnDark, letterSpacing: -0.5 }}>
              {initial}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...t.typography.label, color: t.colors.accentPowderBlueInk }}>Passenger</Text>
            <Text style={{ ...t.typography.h2, color: t.colors.textPrimary, marginTop: 4 }} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>{user.phone_number}</Text>
          </View>
        </View>
      </Card>

      {/* Info card */}
      <Card tone="default" padding="none" radius="card" style={styles.card}>
        <InfoRow
          icon={<Phone size={16} strokeWidth={1.8} color={t.colors.textTertiary} />}
          label="Phone"
          value={user.phone_number}
        />
        <View style={[styles.divider, { backgroundColor: t.colors.borderSubtle }]} />
        {user.email && (
          <>
            <InfoRow
              icon={<Mail size={16} strokeWidth={1.8} color={t.colors.textTertiary} />}
              label="Email"
              value={user.email}
            />
            <View style={[styles.divider, { backgroundColor: t.colors.borderSubtle }]} />
          </>
        )}
        <InfoRow
          icon={<Shield size={16} strokeWidth={1.8} color={t.colors.textTertiary} />}
          label="Security"
          value="OTP-based sign in"
        />
      </Card>

      {/* Privacy notice */}
      <Card tone="elevated" padding="md" radius="card" style={styles.card}>
        <View style={styles.privacyRow}>
          <Info size={16} strokeWidth={1.9} color={t.colors.accentSoftCreamInk} style={{ marginTop: 2 }} />
          <Text style={{ ...t.typography.bodySm, color: t.colors.accentSoftCreamInk, flex: 1, lineHeight: 20 }}>
            ETAEats never stores your bus ticket or payment details. We only need your phone to confirm pickup.
          </Text>
        </View>
      </Card>

      {/* Sign out */}
      <Button
        label="Sign out"
        variant="secondary"
        onPress={handleLogout}
        fullWidth
        style={styles.card}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { marginTop: 8, marginBottom: 20 },
  card: { marginBottom: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  infoIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginLeft: 76 },
  privacyRow: { flexDirection: 'row', gap: 12 },
});
