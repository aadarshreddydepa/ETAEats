import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@eta/ui-components';
import { useTheme } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { authEndpoints } from '@eta/api-client';
import Logo from '../../assets/logo.svg';

function formatPhoneDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 10);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)} ${clean.slice(5)}`;
}

export default function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [hasHydrated, isAuthenticated]);

  const digits = phone.replace(/\D/g, '').slice(0, 10);
  const isValid = digits.length === 10;

  async function handleContinue() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await authEndpoints.requestOtp({ phone_number: `+91${digits}` });
      router.push({ pathname: '/(auth)/otp', params: { phone: digits } });
    } catch (e: any) {
      const errCode = e?.response?.data?.error?.code;
      if (errCode === 'user_not_found') {
        router.push({ pathname: '/(auth)/signup', params: { phone: digits } });
        return;
      }
      setError(
        e?.response?.data?.error?.message
          ?? e?.response?.data?.detail
          ?? 'User not Found. Please Register',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: t.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <Logo width={140} height={140} />
          </View>

          {/* Form card */}
          <Card tone="default" padding="lg" radius="card" border style={styles.card}>
            <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
              Sign in
            </Text>
            <Text style={[styles.mt3, { ...t.typography.h1, color: t.colors.textPrimary }]}>
              Welcome back
            </Text>
            <Text style={[styles.mt2, { ...t.typography.bodySm, color: t.colors.textTertiary }]}>
              Enter your mobile number — we'll send a secure OTP.
            </Text>

            <View style={styles.inputWrap}>
              <Input
                label="Mobile number"
                placeholder="99999 99999"
                keyboardType="number-pad"
                leading={
                  <Text style={{ ...t.typography.body, color: t.colors.textSecondary, fontWeight: '600' }}>
                    +91
                  </Text>
                }
                value={formatPhoneDisplay(digits)}
                onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
                error={error}
                autoFocus
                accessibilityLabel="Mobile number"
              />
            </View>

            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={!isValid || loading}
              loading={loading}
              fullWidth
              size="lg"
            />

            <Button
              label="New User? Create account"
              variant="secondary"
              onPress={() => router.push({ pathname: '/(auth)/signup', params: { phone: digits } })}
              disabled={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 12 }}
            />

            <Text style={[styles.footer, { ...t.typography.caption, color: t.colors.textMuted }]}>
              By continuing you agree to secure OTP verification for your ETAEats account.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  brand: { alignItems: 'center', marginBottom: 32 },
  card: {},
  mt3: { marginTop: 12 },
  mt2: { marginTop: 8 },
  inputWrap: { marginTop: 28, marginBottom: 24 },
  footer: { marginTop: 20, textAlign: 'center' },
});
