import { useState, useEffect } from "react";
import { useSearchParams, useNavigate} from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from "lucide-react"; // Add this import
import { ModeToggle } from "@/components/mode-toggle";
import { useAppSettings } from '@/context/AppSettingsContext';
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from '@/config';

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

// Add this Google logo SVG component at the top level of your file, before the Login component
const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path
    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    fill="currentColor"
  />
</svg>
);

export default function Login() {
  const { login } = useAuth();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
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
  const [] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [, setAppName] = useState('');
  const [, setLoading] = useState(true);
  const [isAppNameLoading, setIsAppNameLoading] = useState(true); // Add this line

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/content/home-content`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAppName(data?.appSettings?.appName || 'Brownie');
      } catch (error) {
        setAppName('Brownie'); // Fallback value
      } finally {
        setIsAppNameLoading(false);
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

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
      const response = await fetch(`${API_URL}/api/users/forgot-password`, {
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
      const response = await fetch(`${API_URL}/api/users${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
      const res = await fetch(`${API_URL}/api/users/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Google sign-in failed');
      }

      const data = await res.json();
      login(data.token, data.user);
      toast.success('Logged in successfully!');
      
      navigate(data.user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'login' | 'register') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(type);
    }
  };

  const triggerGoogleSignIn = () => {
    if (!window.google?.accounts?.id) {
      toast.error('Google Sign-In is not available');
      return;
    }

    try {
      // Initialize with FedCM settings
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        use_fedcm_for_prompt: true
      });

      // Create a temporary container for the button
      const buttonContainer = document.createElement('div');
      document.body.appendChild(buttonContainer);

      // Render and click the button
      window.google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: settings.theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        width: 400
      });

      // Find and click the button
      const button = buttonContainer.querySelector('[role="button"]');
      if (button) {
        (button as HTMLElement).click();
        // Clean up
        setTimeout(() => document.body.removeChild(buttonContainer), 1000);
      } else {
        throw new Error('Could not create sign-in button');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      toast.error('Unable to open Google Sign-In. Please try again.');
    }
  };

  // Add this function to reinitialize Google button
  const initializeGoogleSignIn = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      return;
    }

    const initGoogle = () => {
      try {
        const google = window.google;
        if (!google?.accounts?.id) {
          throw new Error('Google API not loaded');
        }

        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true // Add FedCM support
        });
      } catch (error) {
        toast.error('Failed to initialize Google Sign-In');
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const checkGoogleInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogleInterval);
          initGoogle();
        }
      }, 100);

      // Clear interval after 5 seconds if Google doesn't load
      setTimeout(() => clearInterval(checkGoogleInterval), 5000);
    }
  };

  // Modify useEffect to use the new function
  useEffect(() => {
    initializeGoogleSignIn();
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [isRegisterView]); // Add isRegisterView as dependency

  // Modify the sign in button click handler
  const handleSignInClick = () => {
    setIsRegisterView(false);
    // Small delay to ensure DOM is updated before reinitializing
    setTimeout(initializeGoogleSignIn, 0);
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
        <div className="flex justify-between items-center">
          <motion.div 
            onClick={() => navigate('/')} 
            className="flex items-center text-foreground gap-2 font-medium cursor-pointer min-w-[100px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isAppNameLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            ) : (
              settings.appName
            )}
          </motion.div>
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-lg p-4 border-0 shadow-none bg-background dark:bg-background/95">
            <AnimatePresence mode="wait">
              {!isRegisterView ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="space-y-3 px-0">
                    <CardTitle className="text-3xl">Welcome back</CardTitle>
                    <CardDescription className="text-lg">
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0">
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={triggerGoogleSignIn}
                      >
                        <GoogleLogo />
                        Continue with Google
                      </Button>
                    </div>

                    <div className="relative my-4">
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
                        onKeyDown={(e) => handleKeyDown(e, 'login')}
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
                          onKeyDown={(e) => handleKeyDown(e, 'login')}
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

                    <div className="mt-4 text-center text-sm">
                      Don't have an account?{" "}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-block"
                      >
                        <Button 
                          variant="link" 
                          className="px-2 py-0"
                          onClick={() => setIsRegisterView(true)}
                        >
                          Sign up
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <CardHeader className="space-y-3 px-0">
                      <CardTitle className="text-3xl">Create an account</CardTitle>
                      <CardDescription className="text-lg">
                        Enter your information to create your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                      <div className="relative z-50">  {/* Increased z-index */}
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={registerData.name}
                          onChange={(e) => {
                            setRegisterData({ ...registerData, name: e.target.value });
                            setErrors({ ...errors, name: undefined });
                          }}
                          className={`${errors.name ? "border-red-500" : ""}`}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                        )}
                      </div>

                      <div className="relative z-40">  {/* Decreased z-index for subsequent fields */}
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
                          <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div className="relative z-30">  {/* Decreased z-index for subsequent fields */}
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
                          <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                        )}
                      </div>

                      <Button 
                        className="w-full mt-6" 
                        disabled={isLoading}
                        onClick={() => handleSubmit('register')}
                      >
                        {isLoading ? "Loading..." : "Create Account"}
                      </Button>

                      <div className="text-center text-sm">
                        Already have an account?{" "}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-block"
                        >
                          <Button 
                            variant="link" 
                            className="px-2 py-0"
                            onClick={handleSignInClick}  // Change this line in the register view
                          >
                            Sign in
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <motion.img
          src="/login-thumbnail.jpg"
          alt="Login background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          loading="eager"
        />
      </div>
    </div>
  );
}
