import { useAuthContext } from './AuthProvider';

export function useAuth() {
  return useAuthContext();
}

export default useAuth;
