import { getLoginUrl } from "@/const";
import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const logout = useCallback(async () => {
    // Auth not implemented in warehouse app
    return;
  }, []);

  const state = useMemo(() => {
    // Auth not implemented - no user required
    return {
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    };
  }, []);

  return {
    ...state,
    refresh: () => Promise.resolve(),
    logout,
  };
}
