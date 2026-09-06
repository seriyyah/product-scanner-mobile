import { useEffect } from 'react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updatePushToken } from '@/services/apiService';
import { productBarcodeFromNotification } from '@/utils/productReadyNotification';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Whether a push token can be obtained at all.
 *
 * expo-notifications resolves the Expo project from `extra.eas.projectId` and
 * throws ERR_NOTIFICATIONS_NO_EXPERIENCE_ID without one. This project has never
 * been linked to an Expo account, so that call has always thrown — swallowed by
 * the caller's try/catch, which is why push looked implemented but had never
 * once delivered anything. Checking first turns an invisible failure into a
 * legible one.
 */
export function pushProjectId(): string | null {
  // Environment first, manifest second. The id is deliberately not in app.json:
  // Expo Go resolves one there back to the account that owns the project and
  // checks the viewer against it, which stops anyone else opening the shared
  // dev link. Configuration reaches the push call without carrying that meaning.
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv;

  // Still honoured, so a real EAS build — where the id is in the manifest and
  // there is no ownership check to trip over — needs no extra configuration.
  const fromConfig =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId ?? Constants.easConfig?.projectId;
  return typeof fromConfig === 'string' && fromConfig.length > 0 ? fromConfig : null;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const projectId = pushProjectId();
  if (!projectId) {
    // Deliberately not thrown: a build with no project linked should still run,
    // it just cannot receive notifications. Said out loud so it is findable.
    console.warn(
      '[push] No Expo projectId configured — push notifications are disabled. ' +
        'Run `npx eas init` to link this app, then restart it.',
    );
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        updatePushToken(userId, token).catch(() => {});
      }
    });

    const subscription = Notifications.addNotificationReceivedListener(() => {});
    return () => subscription.remove();
  }, [userId]);
}

/**
 * Send a tapped "product ready" notification to that product.
 *
 * Two entry points, because a notification can be tapped in two situations and
 * only one of them fires a listener. A tap while the app is running or
 * backgrounded arrives through the subscription; a tap that launches the app
 * from cold has already happened by the time this mounts, and is only
 * retrievable by asking for the last response.
 */
export function useProductReadyNavigation(
  onOpenProduct: (barcode: string) => void,
): void {
  useEffect(() => {
    let cancelled = false;

    const open = (data: unknown): void => {
      const barcode = productBarcodeFromNotification(data);
      if (barcode) onOpenProduct(barcode);
    };

    // Cold start: the tap that opened the app.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!cancelled && response) {
          open(response.notification.request.content.data);
        }
      })
      .catch(() => {});

    // Running or backgrounded.
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => open(response.notification.request.content.data),
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [onOpenProduct]);
}
