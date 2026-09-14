import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PropertyListScreen from '../screens/PropertyListScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';

const Stack = createStackNavigator();

// The Property tab: the seller's own listings, with search and filter. A
// stack so a row can open the same PropertyDetail screen the buyer side and
// the dashboard use.
export default function PropertyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PropertyList" component={PropertyListScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ headerShown: true, title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
