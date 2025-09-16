import type { ExpoConfig } from 'expo/config';
import 'ts-node/register'; // Add this to import TypeScript files

// In SDK 46 and lower, use the following import instead:
// import { ExpoConfig } from '@expo/config-types';

const AppDisplayName = 'expo-native-template';

const AppSlug = AppDisplayName.toLowerCase().replace(/\s+/g, '-');

const config: ExpoConfig = {
  name: AppDisplayName,
  slug: AppSlug,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/ios/icon.png',
  scheme: AppSlug,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    associatedDomains: [
      'webcredentials:enmanuelmag.cardor.dev',
      'applinks:enmanuelmag.cardor.dev',
    ],
    usesAppleSignIn: true,
    icon: './assets/ios/icon.png',
    splash: {
      image: './assets/ios/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    supportsTablet: false,
    bundleIdentifier: 'enmanuelmag.cardor.expo-native-template',
    googleServicesFile:
      process.env.EXPO_PUBLIC_GOOGLE_SERVICES_IOS_PATH ||
      './keys/GoogleService-Info.plist',
    infoPlist: {
      NSFaceIDUsageDescription: `Allow ${AppDisplayName} to use Face ID`,
      NSCameraUsageDescription: `Allow ${AppDisplayName} to access your camera to take photos and attach them to debtor payments`,
      NSPhotoLibraryUsageDescription: `Allow ${AppDisplayName} to access your photos to attach images to debtor payments`,
      NSPhotoLibraryAddUsageDescription: `Allow ${AppDisplayName} to access your photos to attach images to debtor payments`,
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: `enmanuelmag.cardor.${AppSlug.replace(/-/g, '')}`,
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'enmanuelmag.cardor.dev',
          },
        ],
        category: ['DEFAULT', 'BROWSABLE'],
      },
    ],
    icon: './assets/android/icon.png',
    splash: {
      image: './assets/android/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    adaptiveIcon: {
      foregroundImage: './assets/android/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    backgroundColor: '#FFFFFF',
    googleServicesFile:
      process.env.EXPO_PUBLIC_GOOGLE_SERVICES_ANDROID_PATH ||
      './keys/google-services.json',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    '@react-native-firebase/auth',
    'expo-apple-authentication',
    [
      'expo-navigation-bar',
      {
        position: 'relative',
        visibility: 'hidden',
        behavior: 'inset-swipe',
      },
    ],
    // [
    //   'expo-maps',
    //   {
    //     requestLocationPermission: 'true',
    //     locationPermission: 'Allow Voyageia to use your location',
    //   },
    // ],
    // 'react-native-maps',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: `Allow ${AppDisplayName} to use your location.`,
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: `Allow ${AppDisplayName} to access your Face ID biometric data.`,
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: `Allow ${AppDisplayName} to use Face ID.`,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission: `Allow ${AppDisplayName} to access your camera to take photos`,
        photosPermission: `Allow ${AppDisplayName} to access your photos to attach images to debtor payments`,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#FFFFFF',
        icon: './assets/ios/icon.png',
        defaultChannel: 'default',
      },
    ],
  ],
  runtimeVersion: {
    policy: 'appVersion',
  },
  experiments: {
    typedRoutes: false,
  },
  // updates: {
  //   url: 'https://u.expo.dev/a69fd892-ab25-40b0-ad91-ecdd6c3e136f',
  // },
  extra: {
    eas: {
      projectId: 'a69fd892-ab25-40b0-ad91-ecdd6c3e136f', // replace with your project id 'a69fd892-ab25-40b0-ad91-ecdd6c3e136f'
    },
  },
};

export default config;
