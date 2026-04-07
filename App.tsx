import React, {useEffect, useState} from 'react';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigator} from './src/navigation/RootNavigator';
import {initializeData} from './src/services/mockData';
import {setupNotificationChannel} from './src/services/localNotifications';
import {colors} from './src/theme';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await initializeData();
      await setupNotificationChannel();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
