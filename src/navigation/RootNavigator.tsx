import React from 'react';
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
import {useAuth} from '../hooks/useAuth';
import {colors} from '../theme';
import {ActivityIndicator, View} from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
        }}
      />
      <Tab.Screen
        name="Bills"
        component={RecurringBillsScreen}
        options={{
          title: 'Bills',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
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
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '700'},
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
