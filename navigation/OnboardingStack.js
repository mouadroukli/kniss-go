import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AccountTypeScreen from '../screens/AccountTypeScreen';
import RoleScreen from '../screens/RoleScreen';
import PhoneScreen from '../screens/PhoneScreen';
import OtpScreen from '../screens/OtpScreen';
import PasswordScreen from '../screens/PasswordScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import ConnectGoogleScreen from '../screens/ConnectGoogleScreen';

const Stack = createStackNavigator();

// The sign-up wizard. Buyer-vs-seller (SignupFork) comes first: a buyer skips
// straight to the phone step, while a seller continues to the unchanged
// Individual/Agency screen (SignupRole), which is why SignupRole gets a back
// chevron here instead of the "no header" it had as the old entry screen.
// Every step keeps the mockup's bare back chevron, except ConnectGoogle at
// the end, which can't be swiped back out of since that would re-submit the
// registration.
export default function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        title: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1c1c1c',
      }}
    >
      <Stack.Screen
        name="SignupFork"
        component={AccountTypeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="SignupRole" component={RoleScreen} />
      <Stack.Screen name="SignupPhone" component={PhoneScreen} />
      <Stack.Screen name="SignupOtp" component={OtpScreen} />
      <Stack.Screen name="SignupPassword" component={PasswordScreen} />
      <Stack.Screen name="SignupProfile" component={CompleteProfileScreen} />
      <Stack.Screen
        name="SignupGoogle"
        component={ConnectGoogleScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
