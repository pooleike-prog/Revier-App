import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.revierpilot.app',
  appName: 'Revierpilot',
  webDir: 'dist',
  android: {
    // Der Rotlichtmodus soll auch die Systemleisten erreichen; die Farbe
    // setzt die App zur Laufzeit über theme-color.
    backgroundColor: '#f2eee2',
  },
};

export default config;
