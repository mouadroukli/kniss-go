import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ForgotPhoneScreen from '../screens/ForgotPhoneScreen';
import ForgotOtpScreen from '../screens/ForgotOtpScreen';
import ForgotPasswordFormScreen from '../screens/ForgotPasswordFormScreen';

const Stack = createStackNavigator();

// "Forgot password?" from the login screen: verify the phone by OTP (the
// same requestOtp/verifyOtp endpoints sign-up uses), then set a new
// password. No session exists yet, so this can't reuse the signed-in
// Update Password flow (UpdatePasswordScreen/-Form) — same shape, just
// unauthenticated, and it signs the user in on success instead of
// returning to a settings screen.
export default function ForgotPasswordStack() {
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
      <Stack.Screen name="ForgotPhone" component={ForgotPhoneScreen} />
      <Stack.Screen name="ForgotOtp" component={ForgotOtpScreen} />
      <Stack.Screen name="ForgotPasswordForm" component={ForgotPasswordFormScreen} />
    </Stack.Navigator>
  );
}
