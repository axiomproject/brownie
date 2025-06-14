import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from '@/config';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || verificationAttempted.current) return;
      
      verificationAttempted.current = true;
      
      try {
        const response = await fetch(`${API_URL}/api/users/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          toast.success(data.message);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setStatus('error');
          toast.error(data.message);
        }
      } catch (error) {
        setStatus('error');
        toast.error('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {status === 'loading' && 'Verifying your email...'}
              {status === 'success' && 'Your email has been verified!'}
              {status === 'error' && 'Failed to verify email.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(status === 'success' || status === 'error') && (
              <Link 
                to="/login" 
                className="text-primary hover:underline block text-center"
              >
                Return to login
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
