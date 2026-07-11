import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@eta/ui-components';
import { passengerTheme, passengerNightTheme } from '../theme/passengerTheme';
import { useTimeOfDay } from '../hooks/useTimeOfDay';
import { useVersionCheck } from '../hooks/useVersionCheck';
import ForceUpdateScreen from '../components/ForceUpdateScreen';
import AnimatedSplash from '../components/AnimatedSplash';
import CrashScreen from '../components/CrashScreen';
import { useAuthStore, setAppPrefix, tokenStore } from '@eta/auth';
import { initEnv, getEnv } from '@eta/utils';
import {
  setBaseURL,
  setupInterceptors,
  configureRefresh,
  authEndpoints,
} from '@eta/api-client';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_400Regular_Italic,
} from '@expo-google-fonts/lora';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const hydrate = useAuthStore((s) => s.hydrate);
  const { isNight } = useTimeOfDay();
  const activeTheme = isNight ? passengerNightTheme : passengerTheme;
  const { isLoading: versionCheckLoading, forceUpdate, updateMessage, androidStoreUrl, iosStoreUrl } = useVersionCheck();

  const [fontsLoaded] = useFonts({
    Lora: Lora_400Regular,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        setAppPrefix('passenger');
        if (Constants.expoConfig?.extra) {
          initEnv(Constants.expoConfig.extra);
        }

        const env = getEnv();
        let apiBase = env.apiBaseUrl;
        if (__DEV__ && apiBase.includes('localhost')) {
          const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0]
            ?? Constants.experienceUrl?.match(/\/\/([\d.]+)/)?.[1];
          if (debuggerHost) {
            apiBase = apiBase.replace('localhost', debuggerHost);
          }
        }
        const fullBase = apiBase.replace(/\/$/, '') + '/api/v1';
        console.log('[ETA Eats] API base:', fullBase);
        setBaseURL(fullBase);
        setupInterceptors();
        configureRefresh({
          getTokens: () => tokenStore.get(),
          setTokens: (a, r) => tokenStore.set(a, r),
          clearTokens: () => tokenStore.clear(),
          refreshCall: async (refresh) => {
            const res = await authEndpoints.refreshToken(refresh);
            return res.data;
          },
          onLogout: () => {
            useAuthStore.getState().clearAuth();
          },
        });

        await hydrate();

        const state = useAuthStore.getState();
        if (state.isAuthenticated && !state.user) {
          try {
            const { data: me } = await authEndpoints.me();
            useAuthStore.getState().setUser(me as any);
          } catch {
            await useAuthStore.getState().clearAuth();
          }
        }
      } catch (e) {
        console.warn('Bootstrap error:', e);
      } finally {
        setReady(true);
        // Hide the native splash immediately — our AnimatedSplash takes over
        SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, [hydrate]);

  const bootstrapReady = ready && fontsLoaded && !versionCheckLoading;

  if (forceUpdate && bootstrapReady) return <ForceUpdateScreen message={updateMessage} androidStoreUrl={androidStoreUrl} iosStoreUrl={iosStoreUrl} />;

  const stackBg = isNight ? '#0F172A' : '#F5F5F2';

  return (
    <CrashScreen>
    <SafeAreaProvider style={styles.flex}>
      <ThemeProvider theme={activeTheme}>
        <QueryClientProvider client={queryClient}>
          <View style={styles.flex}>
            {/* Mount navigation as soon as bootstrap + version check are done so the first
                real screen paints *under* the splash. Keeping splash-only-then-stack caused
                one frame with no navigator → black flash before onboarding. */}
            {bootstrapReady && (
              <>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: stackBg },
                    animation: 'slide_from_right',
                  }}
                />
                <StatusBar style={isNight ? 'light' : 'dark'} />
              </>
            )}
            {(!bootstrapReady || !splashDone) && (
              <AnimatedSplash
                ready={bootstrapReady}
                onDone={() => setSplashDone(true)}
              />
            )}
          </View>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </CrashScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
