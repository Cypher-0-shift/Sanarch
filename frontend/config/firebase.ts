import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const firebaseAuth = auth;
export const firebaseDb = firestore();

// No initializeApp needed — @react-native-firebase auto-initializes
// from google-services.json (Android) / GoogleService-Info.plist (iOS)
// These files must be placed at:
//   android/app/google-services.json
//   ios/GoogleService-Info.plist
