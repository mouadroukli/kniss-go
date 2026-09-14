import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import ListingPostedScreen from '../screens/ListingPostedScreen';

const Stack = createStackNavigator();

// Mirrors ExploreStack, FavoritesStack and SettingsStack: the Add tab was the
// only one with no stack of its own, which meant there was nowhere to push a
// real confirmation screen after posting a listing.
export default function AddStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddHome" component={AddPropertyScreen} />
      <Stack.Screen name="ListingPosted" component={ListingPostedScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
