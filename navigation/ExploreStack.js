import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RadiusPickerScreen from '../screens/RadiusPickerScreen';
import ScanningScreen from '../screens/ScanningScreen';
import ResultsScreen from '../screens/ResultsScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';

const Stack = createStackNavigator();

export default function ExploreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RadiusPicker"
        component={RadiusPickerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Scanning"
        component={ScanningScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: 'Nearby properties' }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
