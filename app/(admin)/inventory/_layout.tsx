import { Stack } from "expo-router";

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="run-plans" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="consumption" />
    </Stack>
  );
}
