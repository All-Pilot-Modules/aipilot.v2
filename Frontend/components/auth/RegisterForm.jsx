'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'teacher',
    profile_image: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, login } = useAuth();
  const router = useRouter();

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id || !formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = formData;
      console.log('Registering user:', registerData);
      await register(registerData);

      // Redirect to email verification page instead of auto-login
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      console.error('Registration failed:', error);

      // Parse error message for better user experience
      let errorMessage = error.message;

      if (errorMessage.includes('User with this ID, email, or username already exists')) {
        errorMessage = 'An account with this User ID, email, or username already exists. Please use different credentials or sign in instead.';
      } else if (errorMessage.includes('already exists')) {
        errorMessage = 'This account already exists. Please try signing in or use different credentials.';
      } else if (errorMessage.includes('Unable to connect') || errorMessage.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (errorMessage.includes('400')) {
        errorMessage = 'Invalid registration data. Please check all fields and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (!errorMessage || errorMessage === 'Registration failed') {
        errorMessage = 'Registration failed. Please check your information and try again.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teacher Sign Up</CardTitle>
          <CardDescription>
            Create a teacher account to manage modules and students
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">User ID *</Label>
              <Input
                id="id"
                type="text"
                placeholder="Enter unique user ID"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_image">Profile Image URL</Label>
              <Input
                id="profile_image"
                type="url"
                placeholder="Enter profile image URL (optional)"
                value={formData.profile_image}
                onChange={(e) => handleChange('profile_image', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>
            {error && (
              <div
                id="register-error"
                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}