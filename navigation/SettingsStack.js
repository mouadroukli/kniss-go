import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/SettingsScreen';
import LanguagesScreen from '../screens/LanguagesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UpdatePhoneScreen from '../screens/UpdatePhoneScreen';
import UpdatePhoneCodeScreen from '../screens/UpdatePhoneCodeScreen';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';
import UpdatePasswordFormScreen from '../screens/UpdatePasswordFormScreen';
import UpdateSuccessScreen from '../screens/UpdateSuccessScreen';
import LinkedAccountsScreen from '../screens/LinkedAccountsScreen';
import HelpScreen from '../screens/HelpScreen';
import TermsScreen from '../screens/TermsScreen';
import { useLanguage } from '../context/LanguageContext';

const Stack = createStackNavigator();

// The buyer tab bar's Settings stack. Everything past "Profile" is the exact
// same screen the seller Profile tab uses (they only read useAuth(), nothing
// seller-specific), so a buyer account gets the same edit-profile, phone,
// password and linked-accounts machinery for free, no duplicate screens.
// Header titles reuse the sellerProfile.* strings for the same reason.
export default function SettingsStack() {
  const { t } = useLanguage();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
      <Stack.Screen
        name="Profile"
        component={EditProfileScreen}
        options={{ title: t('profile.title') }}
      />
      <Stack.Screen
        name="Languages"
        component={LanguagesScreen}
        options={{ title: t('languages.title') }}
      />
      <Stack.Screen
        name="UpdatePhone"
        component={UpdatePhoneScreen}
        options={{ title: t('sellerProfile.updatePhoneTitle') }}
      />
      <Stack.Screen
        name="UpdatePhoneCode"
        component={UpdatePhoneCodeScreen}
        options={{ title: t('sellerProfile.updatePhoneTitle') }}
      />
      <Stack.Screen
        name="UpdatePassword"
        component={UpdatePasswordScreen}
        options={{ title: t('sellerProfile.updatePasswordTitle') }}
      />
      <Stack.Screen
        name="UpdatePasswordForm"
        component={UpdatePasswordFormScreen}
        options={{ title: t('sellerProfile.updatePasswordTitle') }}
      />
      <Stack.Screen
        name="UpdateSuccess"
        component={UpdateSuccessScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="LinkedAccounts"
        component={LinkedAccountsScreen}
        options={{ title: t('sellerProfile.linkedAccountsTitle') }}
      />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: t('sellerProfile.helpTitle') }} />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: t('sellerProfile.termsTitle') }}
      />
    </Stack.Navigator>
  );
}
