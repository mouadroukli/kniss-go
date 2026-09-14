import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LanguagesScreen from '../screens/LanguagesScreen';
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

// The Profile tab. Sub-screens get the mockup's plain back-chevron header;
// the menu itself and the success screen are chrome-free. Header titles come
// from the shared sellerProfile.* dictionary; each screen's own body copy
// pulls from its own namespace in the same dictionary (see LanguageContext).
export default function ProfileStack() {
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        title: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1c1c1c',
        headerTitleStyle: { fontSize: 16, fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={SellerProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: t('sellerProfile.editTitle') }}
      />
      <Stack.Screen
        name="Languages"
        component={LanguagesScreen}
        options={{ title: t('sellerProfile.languages') }}
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
