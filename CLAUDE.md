# FitTracNative — Project Rules

## Stack
- React Native 0.81 / Expo 54 / React 19
- React Navigation v7: native-stack (RootStack) wrapping bottom-tabs (Main)
- State: React Context only — no Redux, no Zustand
- Storage: AsyncStorage (via AppContext, debounced 400ms)
- Styling: StyleSheet.create() via makeStyles(theme) — no styled-components

## File Structure
```
src/
  screens/   — one file per screen, <Name>Screen.js
  context/   — AppContext.js, ThemeContext.js
  data/      — static data (programs.js, exercises.js, foodDatabase.js)
  components/— shared components (currently empty)
```

## Naming Conventions
- Screen files: `<Name>Screen.js` (PascalCase)
- Screen component: `export default function <Name>Screen({ navigation })`
- Route name: strip "Screen" suffix → `"LogWeight"` not `"LogWeightScreen"`
- Booleans: `is` prefix (isLoading, isPremium)
- Handlers: `handle` prefix (handlePress, handleClearDay)
- Callbacks: `on` prefix (onAdd, onRemove)
- State setters: `set<Name>` (setQuery, setPanel)

## Screen Structure (always this order)
1. Imports
2. Component function
3. Context hooks: `const { userData, ... } = useApp()` / `const { theme } = useTheme()`
4. Local useState
5. Derived values (no hooks)
6. Event handlers
7. Return JSX
8. Inline sub-components
9. Helper functions
10. `makeStyles(theme)` at bottom → called as `const s = makeStyles(theme)`

## Styling Rules
- Always use `makeStyles(theme)` at the bottom of the file
- Access theme colors: `theme.bgPage`, `theme.bgCard`, `theme.accent`, `theme.textPri`, `theme.textSec`, `theme.textMuted`, `theme.border`, `theme.cardRadius`
- Dynamic colors via array: `[s.base, { color: condition ? theme.accent : '#f87171' }]`
- Standard spacing: 16px page padding, 12px card gap, 8px margins
- Cards: `{ backgroundColor: theme.bgCard, borderRadius: theme.cardRadius }`
- Never hardcode colors that exist in the theme object

## Navigation
- Modal screens registered on RootStack above the tab navigator in App.js
- Navigate: `navigation.navigate('RouteName')` / `navigation.goBack()`
- Tab refresh: use `useFocusEffect` to reload data when a tab becomes active
- New modal screens need both: registration in App.js + a way to reach them (navigate call)

## State & Data
- All user data lives in AppContext (`useApp()`) — never duplicate to local state
- Use context helpers: `addFoodEntry`, `logWeight`, `finishWorkout`, `getTodayKey`, etc.
- For critical saves: call `saveNow()` — don't rely on the debounce
- Theme access: `useTheme()` → `{ theme, themeName, toggleTheme }`

## What NOT to Do
- Don't create a Redux store or Zustand store
- Don't add a component to src/components/ without discussing it first
- Don't use inline styles for colors that exist in the theme
- Don't add a new screen without registering it in App.js
- Don't bypass AsyncStorage — all persistence goes through AppContext
