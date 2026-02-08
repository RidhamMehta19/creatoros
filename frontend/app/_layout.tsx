import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="dashboard" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="generate" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="history" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="profile" 
        options={{ headerShown: false }}
      />
    </Stack>
  );
}