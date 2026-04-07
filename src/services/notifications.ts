import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {updateFcmToken} from './firestore';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  return true;
}

export async function registerFcmToken(userId: string): Promise<void> {
  try {
    const token = await messaging().getToken();
    await updateFcmToken(userId, token);

    // Listen for token refresh
    messaging().onTokenRefresh(async newToken => {
      await updateFcmToken(userId, newToken);
    });
  } catch (error) {
    console.warn('Failed to register FCM token:', error);
  }
}

export function setupForegroundHandler(): () => void {
  return messaging().onMessage(async remoteMessage => {
    Alert.alert(
      remoteMessage.notification?.title ?? 'Notification',
      remoteMessage.notification?.body ?? '',
    );
  });
}

export function setupBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message:', remoteMessage);
  });
}
