import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setAuthenticated(isAuthenticated: boolean): void {
      patchState(store, () => ({ isAuthenticated }));
    },
    setUser(user: User | null): void {
      patchState(store, () => ({ user }));
    },
  }))
); 