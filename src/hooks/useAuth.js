import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    loading,
    error,
  };
};
