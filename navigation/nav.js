// Resets the whole app to a single root screen. Used at the hand-off points
// between the signed-out world (Welcome) and the signed-in world (Dashboard),
// so there's no stale wizard or login screen left underneath to swipe back
// to. getParent('root') reaches RootNavigator however many navigators deep
// the caller is, and falls back to the caller's own navigator when that
// screen is already on the root stack.
export function resetTo(navigation, routeName) {
  const root = navigation.getParent('root') ?? navigation;
  root.reset({ index: 0, routes: [{ name: routeName }] });
}
