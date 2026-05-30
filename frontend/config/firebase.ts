import auth from '@react-native-firebase/auth';

export const firebaseAuth = auth;

// No initializeApp needed — @react-native-firebase auto-initializes
// from google-services.json (Android) / GoogleService-Info.plist (iOS)
// These files must be placed at:
//   android/app/google-services.json
//   ios/GoogleService-Info.plist
