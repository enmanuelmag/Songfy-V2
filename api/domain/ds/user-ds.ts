import type { UserType } from '@customTypes/user';

abstract class UserDS {
  abstract signinWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserType>;

  abstract signinWithGoogle(): Promise<UserType>;

  abstract signinWithApple(): Promise<UserType | null>;

  abstract signinAnonymously(): Promise<UserType>;

  abstract signUpWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserType>;

  abstract signInWithLocalAuth(): Promise<UserType>;

  abstract checkBiometric(): Promise<boolean>;

  abstract setCheckBiometric(value: boolean): Promise<boolean>;

  abstract getCheckBiometric(): Promise<boolean>;

  abstract getUser(): Promise<UserType | null>;

  abstract logout(): Promise<void>;

  abstract deleteAccount(): Promise<void>;
}

export default UserDS;
