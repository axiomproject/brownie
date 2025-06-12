import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 bg-background">
        <div className="max-w-md mx-auto text-center space-y-6 px-4">
          <XCircle className="h-20 w-20 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Payment Failed</h1>
          <p className="text-muted-foreground">
            Something went wrong with your payment. Please try again or contact support if the problem persists.
          </p>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              size="lg"
              variant="destructive"
              onClick={() => navigate('/cart')}
            >
              Try Again
            </Button>
            <Button 
              className="w-full" 
              size="lg"
              variant="outline"
              onClick={() => navigate('/menu')}
            >
              Return to Menu
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
