// Stub for expo-location — used in Expo Go which lacks native location module.
// Real GPS requires expo run:ios / EAS Build.
const PermissionStatus = { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' };
const Accuracy = { Balanced: 3, High: 4, Highest: 5, Low: 1, Lowest: 0, BestForNavigation: 6 };

const requestForegroundPermissionsAsync = async () => ({ status: PermissionStatus.DENIED, granted: false });
const getCurrentPositionAsync = async () => {
  throw new Error('Location not available in Expo Go');
};
const reverseGeocodeAsync = async () => [{ city: null, country: null }];

module.exports = { PermissionStatus, Accuracy, requestForegroundPermissionsAsync, getCurrentPositionAsync, reverseGeocodeAsync };
