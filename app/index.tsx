import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
