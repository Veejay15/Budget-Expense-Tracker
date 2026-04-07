import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootStackParamList, MainTabParamList} from '../types';
import {LoginScreen} from '../screens/LoginScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {PayPeriodScreen} from '../screens/PayPeriodScreen';
import {AddExpenseScreen} from '../screens/AddExpenseScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {RecurringBillsScreen} from '../screens/RecurringBillsScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {AddPayPeriodScreen} from '../screens/AddPayPeriodScreen';
import {useAuth} from '../hooks/useAuth';
import {colors, fontSize} from '../theme';
import {ActivityIndicator} from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({icon, focused}: {icon: string; focused: boolean}) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {icon}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: fontSize.lg,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({focused}) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({focused}) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Bills"
        component={RecurringBillsScreen}
        options={{
          title: 'Bills',
          tabBarIcon: ({focused}) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({focused}) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {fontWeight: '700'},
        cardStyle: {backgroundColor: colors.background},
      }}>
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="PayPeriod"
            component={PayPeriodScreen}
            options={({route}) => ({
              title: route.params.label,
            })}
          />
          <Stack.Screen
            name="AddPayPeriod"
            component={AddPayPeriodScreen}
            options={{title: 'New Pay Period'}}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={({route}) => ({
              title: route.params.expense ? 'Edit Expense' : 'Add Expense',
            })}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
