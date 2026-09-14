import { createNavigationContainerRef } from '@react-navigation/native';

// Lets code outside the navigation tree trigger navigation, specifically
// FavoritesContext, which sits above NavigationContainer in App.js (it has
// to, since favourites need to work no matter which screen is focused) and
// so can't call useNavigation(). Standard React Navigation pattern for this:
// https://reactnavigation.org/docs/navigating-without-navigation-prop/
export const navigationRef = createNavigationContainerRef();
