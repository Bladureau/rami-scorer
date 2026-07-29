// Imports par graisse : la racine du paquet embarquerait les 18 fichiers Inter.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import Header from './src/components/Header';
import { GameProvider, useGame } from './src/game/GameContext';
import EndScreen from './src/screens/EndScreen';
import GameScreen from './src/screens/GameScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SetupScreen from './src/screens/SetupScreen';
import EntryScreen from './src/screens/entry/EntryScreen';
import { C } from './src/theme';

/** Aiguillage d'écran : l'app est un seul flux piloté par `state.screen`. */
function Router() {
  const { state, hydrated } = useGame();

  // Évite un flash de l'écran de configuration avant la reprise de partie.
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <Header />
      {state.screen === 'setup' ? <SetupScreen /> : null}
      {state.screen === 'game' ? <GameScreen /> : null}
      {state.screen === 'entry' ? <EntryScreen /> : null}
      {state.screen === 'end' ? <EndScreen /> : null}
      {state.screen === 'history' ? <HistoryScreen /> : null}
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GameProvider>
        <Router />
      </GameProvider>
    </SafeAreaProvider>
  );
}
