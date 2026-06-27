export const BarCodeScanner = {
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  Constants: {
    BarCodeType: {
      ean13: 'ean13',
      ean8: 'ean8',
      qr: 'qr',
    },
  },
};

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      BarCodeType: {
        ean13: 'ean13',
        ean8: 'ean8',
        qr: 'qr',
      },
    },
  },
}));
