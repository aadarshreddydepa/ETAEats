// ⚠️  react-native-razorpay is not yet in package.json.
//     Add it before running: pnpm add react-native-razorpay
//     Then rebuild the native project (expo prebuild / eas build).
//     The UPI app-tile intent path requires this package.
//     Primary button and UPI-ID paths use the existing WebView approach.

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Button, Input } from '@eta/ui-components';
import { api } from '@eta/api-client';
import { useAuthStore } from '@eta/auth';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react-native';
import RazorpayCheckout, {
  type RazorpayOptions,
  type RazorpaySuccess,
} from '../components/RazorpayCheckout';
import { useCartStore } from '../stores/cart.store';
import { useJourneyStore } from '../stores/journey.store';

// Extended options to support UPI prefill fields that checkout.js accepts
// but the local RazorpayOptions interface does not declare.
interface ExtendedRazorpayOptions extends RazorpayOptions {
  prefill?: RazorpayOptions['prefill'] & {
    method?: string;
    vpa?: string;
  };
}

// react-native-razorpay types (installed separately — see note at top)
type RNRazorpayOptions = {
  key: string;
  amount: number;
  currency?: string;
  order_id: string;
  name?: string;
  prefill?: { contact?: string; email?: string; method?: string };
  theme?: { color?: string };
  method?: { upi?: boolean };
  upi?: { flow?: 'intent' | 'collect' };
  app_name?: string;
};

type RNRazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RNRazorpayError = {
  code?: string;
  description?: string;
};

// Lazily required so the app doesn't crash when the package is not installed.
// When installed, RazorpayCheckoutNative.open(opts) triggers the native sheet.
function getRazorpayNative(): {
  open: (opts: RNRazorpayOptions) => Promise<RNRazorpayResponse>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-razorpay').default;
  } catch {
    return null;
  }
}

interface RpPayload {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay', pkg: 'com.google.android.apps.nbu.paisa.user', iosScheme: 'gpay',     emoji: '🟦' },
  { id: 'phonepe', label: 'PhonePe',    pkg: 'com.phonepe.app',                         iosScheme: 'phonepe',  emoji: '🟪' },
  { id: 'paytm',   label: 'Paytm',      pkg: 'net.one97.paytm',                         iosScheme: 'paytmmp',  emoji: '🔵' },
  { id: 'bhim',    label: 'BHIM',       pkg: 'in.org.npci.upiapp',                      iosScheme: 'bhim',     emoji: '🇮🇳' },
] as const;

function isValidUpi(id: string): boolean {
  if (id.includes(' ')) return false;
  const parts = id.split('@');
  return parts.length === 2 && (parts[0]?.length ?? 0) > 0 && (parts[1]?.length ?? 0) > 0;
}

export default function PaymentScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { busId, items, clearCart, totalPrice } = useCartStore();
  const { activeJourney } = useJourneyStore();
  const user = useAuthStore((s) => s.user);

  const [rpPayload, setRpPayload]       = useState<RpPayload | null>(null);
  const [orderId, setOrderId]           = useState<string | null>(null);
  const [initError, setInitError]       = useState<string | null>(null);
  const [initLoading, setInitLoading]   = useState(true);
  const [paying, setPaying]             = useState(false);
  const [verifyError, setVerifyError]   = useState<string | null>(null);
  const [upiId, setUpiId]               = useState('');
  const [upiVerified, setUpiVerified]   = useState(false);
  const [upiError, setUpiError]         = useState<string | null>(null);
  const [selectedApp, setSelectedApp]   = useState<string | null>(null);
  // WebView Razorpay modal (primary + UPI-ID paths)
  const [webviewOpts, setWebviewOpts]   = useState<ExtendedRazorpayOptions | null>(null);
  const pendingOrderRef = useRef<string | null>(null);
  const initFired = useRef(false);

  const bus        = activeJourney?.bus        ?? null;
  const restaurant = activeJourney?.restaurant ?? null;
  const total      = totalPrice();

  useEffect(() => {
    if (initFired.current) return;
    initFired.current = true;
    runInit();
  }, []);

  async function runInit() {
    setInitLoading(true);
    setInitError(null);
    try {
      const effectiveBusId = busId ?? bus?.id ?? null;
      const { data: order } = await api.post('/orders/checkout/', {
        bus_id:     effectiveBusId,
        promo_code: '',
        lines:      items.map((i) => ({ menu_item: i.menu_item, quantity: i.quantity })),
      });
      setOrderId(order.id);
      pendingOrderRef.current = order.id;

      const { data: payload } = await api.post('/payments/razorpay/order/', {
        order_id: order.id,
      });
      setRpPayload(payload);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setInitError(err?.response?.data?.error?.message ?? 'Failed to initialise payment.');
    } finally {
      setInitLoading(false);
    }
  }

  async function handleConfirm(data: RazorpaySuccess) {
    setPaying(true);
    setVerifyError(null);
    const oid = pendingOrderRef.current ?? orderId;
    try {
      await api.post('/payments/razorpay/confirm/', {
        order_id:            oid,
        razorpay_order_id:   data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature:  data.razorpay_signature,
      });
      clearCart();
      router.replace(`/order/${oid}` as never);
    } catch {
      setVerifyError(
        `Payment received but verification failed — contact support with order ID ${oid?.slice(0, 8)}`
      );
      setPaying(false);
    }
  }

  function buildBaseOpts(extra: Partial<ExtendedRazorpayOptions> = {}): ExtendedRazorpayOptions {
    return {
      key_id:            rpPayload!.key_id,
      razorpay_order_id: rpPayload!.razorpay_order_id,
      amount:            rpPayload!.amount,
      currency:          rpPayload!.currency ?? 'INR',
      name:              'ETA Eats',
      description:       `Order from ${restaurant?.name ?? 'restaurant'}`,
      prefill:           { contact: user?.phone_number ?? '', email: user?.email ?? '' },
      ...extra,
    };
  }

  function handlePrimaryPay() {
    if (!rpPayload) return;
    setWebviewOpts(buildBaseOpts());
  }

  function verifyUpiId() {
    setUpiError(null);
    setUpiVerified(false);
    if (!isValidUpi(upiId)) {
      setUpiError('Enter a valid UPI ID — e.g. name@upi');
      return;
    }
    setUpiVerified(true);
  }

  function handleUpiIdPay() {
    if (!rpPayload) return;
    setWebviewOpts(
      buildBaseOpts({
        prefill: {
          contact: user?.phone_number ?? '',
          email:   user?.email ?? '',
          method:  'upi',
          vpa:     upiId,
        },
      })
    );
  }

  async function handleAppTilePay() {
    const app = UPI_APPS.find((a) => a.id === selectedApp);
    if (!app || !rpPayload) return;

    const RazorpayNative = getRazorpayNative();
    if (!RazorpayNative) {
      Alert.alert(
        'Not available',
        'react-native-razorpay is not installed. Add it to package.json and rebuild.',
      );
      return;
    }

    setPaying(true);
    try {
      const data = await RazorpayNative.open({
        key:      rpPayload.key_id,
        amount:   rpPayload.amount,
        currency: rpPayload.currency ?? 'INR',
        order_id: rpPayload.razorpay_order_id,
        name:     'ETA Eats',
        prefill:  { contact: user?.phone_number ?? '', method: 'upi' },
        theme:    { color: '#0d0d0d' },
        method:   { upi: true },
        upi:      { flow: 'intent' },
        app_name: Platform.OS === 'android' ? app.pkg : app.iosScheme,
      });
      await handleConfirm(data);
    } catch (e: unknown) {
      const err = e as RNRazorpayError;
      // User dismissed — reset silently
      if (err?.code === 'PAYMENT_CANCELLED' || err?.description === 'Payment cancelled by user') {
        setPaying(false);
        return;
      }
      Alert.alert('Payment failed', err?.description ?? 'Something went wrong. Please try again.');
      setPaying(false);
    }
  }

  function handleWebviewDismiss(reason: string) {
    setWebviewOpts(null);
    // Silent reset when user closes Razorpay without paying
    if (reason !== 'User cancelled') {
      Alert.alert('Payment not completed', reason);
    }
  }

  const isReady = !!rpPayload && !paying;

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/checkout'))}
          hitSlop={12}
        >
          <ArrowLeft size={20} color={t.colors.textPrimary} />
        </Pressable>
        <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Payment</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Order summary */}
        <Card tone="powder" padding="md" radius="card" style={styles.cardGap}>
          <Text style={{ ...t.typography.label, color: t.colors.accentPowderBlueInk }}>YOUR ORDER</Text>
          <View style={{ marginTop: 12, gap: 6 }}>
            <View style={styles.row}>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textSecondary }}>
                {items.length} item{items.length > 1 ? 's' : ''}
              </Text>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary, fontWeight: '600' }}>
                ₹{total.toFixed(0)}
              </Text>
            </View>
            {restaurant ? (
              <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>
                Stop: {restaurant.name}
              </Text>
            ) : null}
            {bus ? (
              <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>
                Bus: {bus.name} · {bus.numberPlate}
              </Text>
            ) : null}
          </View>
        </Card>

        {/* Init loading */}
        {initLoading && (
          <View style={styles.loadingRow}>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textMuted }}>
              Setting up payment…
            </Text>
          </View>
        )}

        {/* Init error */}
        {!initLoading && initError ? (
          <Card tone="default" padding="md" radius="card" style={styles.cardGap}>
            <View style={styles.errorRow}>
              <AlertCircle size={16} strokeWidth={1.8} color={t.colors.errorFg} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.bodySm, color: t.colors.errorFg }}>{initError}</Text>
                <Button
                  label="Retry"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    initFired.current = false;
                    runInit();
                  }}
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                />
              </View>
            </View>
          </Card>
        ) : null}

        {/* Verification error */}
        {verifyError ? (
          <Card tone="default" padding="md" radius="card" style={styles.cardGap}>
            <View style={styles.errorRow}>
              <AlertCircle size={16} strokeWidth={1.8} color={t.colors.errorFg} />
              <Text style={{ ...t.typography.bodySm, color: t.colors.errorFg, flex: 1 }}>
                {verifyError}
              </Text>
            </View>
          </Card>
        ) : null}

        {!initLoading && !initError && (
          <>
            {/* ── Section 1: Primary Razorpay button ── */}
            <Card tone="default" padding="md" radius="card" style={styles.cardGap}>
              <View style={styles.sectionHeader}>
                <CreditCard size={16} strokeWidth={1.8} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>PAY SECURELY</Text>
              </View>
              <Button
                label={`Pay ₹${total.toFixed(0)} · All methods`}
                onPress={handlePrimaryPay}
                disabled={!isReady}
                loading={paying}
                fullWidth
                size="lg"
                style={{ marginTop: 12 }}
              />
              <View style={[styles.trustRow, { marginTop: 10 }]}>
                <ShieldCheck size={14} strokeWidth={1.9} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted, flex: 1 }}>
                  UPI, cards, and netbanking via Razorpay
                </Text>
              </View>
            </Card>

            {/* ── Divider ── */}
            <View style={[styles.dividerRow, { marginBottom: 16 }]}>
              <View style={[styles.dividerLine, { backgroundColor: t.colors.borderSubtle }]} />
              <Text style={{ ...t.typography.label, color: t.colors.textMuted, marginHorizontal: 12 }}>
                OR PAY WITH UPI
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: t.colors.borderSubtle }]} />
            </View>

            {/* ── Section 2a: UPI ID ── */}
            <Card tone="default" padding="md" radius="card" style={styles.cardGap}>
              <View style={styles.sectionHeader}>
                <Wallet size={16} strokeWidth={1.8} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>UPI ID</Text>
              </View>
              <View style={[styles.upiRow, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="yourname@upi"
                    value={upiId}
                    onChangeText={(v) => {
                      setUpiId(v);
                      setUpiVerified(false);
                      setUpiError(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={verifyUpiId}
                  />
                  {upiVerified && (
                    <View style={styles.inlineStatus}>
                      <CheckCircle2 size={14} strokeWidth={2} color={t.colors.successFg} />
                      <Text style={{ ...t.typography.caption, color: t.colors.successFg }}>Verified</Text>
                    </View>
                  )}
                  {upiError ? (
                    <Text style={{ ...t.typography.caption, color: t.colors.errorFg, marginTop: 4 }}>
                      {upiError}
                    </Text>
                  ) : null}
                </View>
                {!upiVerified ? (
                  <Button
                    label="Verify"
                    variant="secondary"
                    size="sm"
                    onPress={verifyUpiId}
                    disabled={!upiId}
                    style={styles.sideBtn}
                  />
                ) : (
                  <Button
                    label="Pay"
                    size="sm"
                    onPress={handleUpiIdPay}
                    disabled={!isReady}
                    loading={paying}
                    style={styles.sideBtn}
                  />
                )}
              </View>
            </Card>

            {/* ── Section 2b: UPI app tiles ── */}
            <Card tone="default" padding="md" radius="card">
              <View style={styles.sectionHeader}>
                <Smartphone size={16} strokeWidth={1.8} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>UPI APPS</Text>
              </View>
              <View style={[styles.tilesGrid, { marginTop: 12 }]}>
                {UPI_APPS.map((app) => (
                  <Pressable
                    key={app.id}
                    onPress={() => setSelectedApp(app.id === selectedApp ? null : app.id)}
                    style={[
                      styles.tile,
                      {
                        borderColor:     selectedApp === app.id ? t.colors.primary : t.colors.borderSubtle,
                        backgroundColor: selectedApp === app.id ? t.colors.surface2 : t.colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{app.emoji}</Text>
                    <Text
                      style={{
                        ...t.typography.bodySm,
                        color:      t.colors.textPrimary,
                        fontWeight: '600',
                        marginTop:  6,
                        textAlign:  'center',
                      }}
                    >
                      {app.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {selectedApp && (
                <Button
                  label={`Pay with ${UPI_APPS.find((a) => a.id === selectedApp)?.label}`}
                  onPress={handleAppTilePay}
                  disabled={!isReady}
                  loading={paying}
                  fullWidth
                  size="md"
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>

      {/* WebView Razorpay — primary button + UPI ID paths */}
      {webviewOpts && (
        <RazorpayCheckout
          visible
          options={webviewOpts}
          onSuccess={(data) => {
            setWebviewOpts(null);
            handleConfirm(data);
          }}
          onDismiss={handleWebviewDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  content:       { paddingHorizontal: 16, paddingTop: 16 },
  cardGap:       { marginBottom: 16 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  loadingRow:    { alignItems: 'center', paddingVertical: 32 },
  errorRow:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustRow:      { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  dividerRow:    { flexDirection: 'row', alignItems: 'center' },
  dividerLine:   { flex: 1, height: 1 },
  upiRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sideBtn:       { marginTop: 2, flexShrink: 0 },
  inlineStatus:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tilesGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
