import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from "lucide-react"; // Add this import

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: {
            isDisplayed: () => boolean;
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getMomentType: () => string;
          }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface FormData {
  email: string;
  password: string;
  name?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleForgotPassword = async (email: string) => {
    if (!email || !validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (type: 'login' | 'register', data: FormData): boolean => {
    const newErrors: FormErrors = {};
    
    // Email validation
    if (!data.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Name validation (only for register)
    if (type === 'register') {
      if (!data.name) {
        newErrors.name = 'Name is required';
      } else if (data.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (type: 'login' | 'register') => {
    const currentFormData = type === 'login' ? loginData : registerData;
    if (!validateForm(type, currentFormData)) {
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = type === 'login' ? '/login' : '/register';
      const response = await fetch(`http://localhost:5000/api/users${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (type === 'register') {
        // Don't login after registration, just show success message
        toast.success('Registration successful! Please check your email to verify your account.');
        // Clear form data
        setRegisterData({ email: '', password: '', name: '' });
      } else {
        // Only login for login attempts
        login(data.token, data.user);
        toast.success('Logged in successfully!');
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function at the top of the component
  const getEyeButtonClasses = (hasText: boolean) => {
    return `absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${
      hasText ? 'opacity-100' : 'opacity-0'
    } text-foreground hover:text-foreground/80`;
  };

  const handleGoogleSignIn = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }

      login(data.token, data.user);
      toast.success('Logged in successfully!');
      
      if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });

        const buttonDiv = document.getElementById('googleButton');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: '400',
            text: 'continue_with',
            shape: 'rectangular',
            locale: 'en',
            style: {
              width: '100%',
              maxWidth: '100%',
              borderRadius: '0.5rem',
              padding: '8px',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }
          });

          // Force the inner button to be full width
          const googleButton = buttonDiv.querySelector('div[role="button"]');
          if (googleButton instanceof HTMLElement) {
            googleButton.style.width = '100%';
            googleButton.style.display = 'flex';
            googleButton.style.justifyContent = 'center';
          }
        }
      } else {
        setTimeout(initializeGoogleSignIn, 100);
      }
    };

    initializeGoogleSignIn();

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-4">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl">Login</CardTitle>
                <CardDescription className="text-lg">Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  id="googleButton" 
                  className="w-full flex justify-center items-center min-h-[42px] overflow-hidden rounded-md [&>div]:!w-full [&>div>div]:!w-full"
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({ ...loginData, email: e.target.value });
                      setErrors({ ...errors, email: undefined });
                    }}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({ ...loginData, password: e.target.value });
                        setErrors({ ...errors, password: undefined });
                      }}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={getEyeButtonClasses(loginData.password.length > 0)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="link" 
                      className="px-0 font-normal text-xs sm:text-sm text-muted-foreground hover:text-primary" 
                      onClick={() => handleForgotPassword(loginData.email)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <Button 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={() => handleSubmit('login')}
                >
                  {isLoading ? "Loading..." : "Sign In"}
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl">Create an account</CardTitle>
                <CardDescription className="text-lg">Enter your information to create your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
           
                  <div className="relative flex justify-center text-xs uppercase">
                   
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Name"
                    value={registerData.name}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, name: e.target.value });
                      setErrors({ ...errors, name: undefined });
                    }}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, email: e.target.value });
                      setErrors({ ...errors, email: undefined });
                    }}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={registerData.password}
                      onChange={(e) => {
                        setRegisterData({ ...registerData, password: e.target.value });
                        setErrors({ ...errors, password: undefined });
                      }}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={getEyeButtonClasses(registerData.password.length > 0)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <Button 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={() => handleSubmit('register')}
                >
                  {isLoading ? "Loading..." : "Create Account"}
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </>
  );
}
