import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

export type AuthUser = FirebaseAuthTypes.User;

export async function signIn(
  email: string,
  password: string,
): Promise<AuthUser> {
  const credential = await auth().signInWithEmailAndPassword(email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await auth().signOut();
}

export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

export function getCurrentUser(): AuthUser | null {
  return auth().currentUser;
}
