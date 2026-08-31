import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

export const getFirebaseApp = () => getApp();
export const firebaseAuth = getAuth();
export const firebaseDb = getFirestore();
