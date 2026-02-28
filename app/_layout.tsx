import { useAuthStore } from "@/store/authStore";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // // ✅ STEP 1: Configure Google Sign-In ONCE (VERY IMPORTANT)
  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  //     offlineAccess: false,
  //   });
  // }, []);

  // ✅ STEP 2: Check auth BEFORE hiding splash
  useEffect(() => {
    if (!fontsLoaded) return;

    const init = async () => {
      await checkAuth(); // restores JWT + user
      await SplashScreen.hideAsync();
    };

    init();
  }, [fontsLoaded]);

  // ✅ STEP 3: Deep link handling (password reset)
  useEffect(() => {
    const handleUrl = (url: string) => {
      console.log("📱 Deep link received:", url);

      const parsed = Linking.parse(url);

      // labmanagementfrontend://reset-password?token=xxx
      if (parsed.path === "reset-password" && parsed.queryParams?.token) {
        const token = parsed.queryParams.token as string;

        // small delay to ensure router is ready
        setTimeout(() => {
          router.push(`/(auth)/reset-password?token=${token}` as any);
        }, 300);
      }
    };

    // App opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // App already running
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    return () => sub.remove();
  }, []);

  // ✅ STEP 4: Centralized auth-based routing
  useEffect(() => {
    if (!fontsLoaded) return;

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else if (user?.role === "admin") {
      router.replace("/(admin)");
    } else {
      router.replace("/(tabs)");
    }
  }, [fontsLoaded, isAuthenticated, user]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen
          name="equipment/[id]"
          options={{ presentation: "card" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
