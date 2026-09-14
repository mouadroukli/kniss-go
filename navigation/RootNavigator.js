import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingStack from './OnboardingStack';
import ForgotPasswordStack from './ForgotPasswordStack';
import RootTabs from './RootTabs';
import SellerTabs from './SellerTabs';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

// The app has three worlds: signed out, which lands on Welcome and then
// either the buyer tabs (Main, no login needed) or the sign-up wizard and
// Login; signed in as a seller, which goes straight to the seller tab bar
// (Dashboard); and signed in as a buyer, which goes to the same buyer tabs
// (Main) an anonymous visitor already sees, since an account is an upgrade
// for a buyer, not a requirement to browse.
//
// id="root" lets screens nested deep inside a wizard or a tab reset the whole
// app to one of these worlds (see navigation/nav.js). initialRouteName is
// read once on mount, and AuthProvider only renders its children after the
// stored session has loaded, so it's already correct by then.
export default function RootNavigator() {
  const { isAuthenticated, user } = useAuth();

  let initialRouteName = 'Welcome';
  if (isAuthenticated) {
    initialRouteName = user?.role === 'seller' ? 'Dashboard' : 'Main';
  }

  return (
    <Stack.Navigator
      id="root"
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordStack} />
      <Stack.Screen name="Main" component={RootTabs} />
      <Stack.Screen name="Dashboard" component={SellerTabs} />
    </Stack.Navigator>
  );
}
