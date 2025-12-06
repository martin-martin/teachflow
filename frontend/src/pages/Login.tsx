import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';

const Login = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const setTeacher = useAppStore((state) => state.setTeacher);

  const handleLogin = () => {
    if (name.trim()) {
      setTeacher({ id: 't1', name: name.trim() });
      navigate('/dashboard');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FeedbackAI</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered grading assistant for teachers
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your name to continue to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={!name.trim()}
              className="w-full h-12 text-base gap-2"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          This is a demo application. No real authentication required.
        </p>
      </div>
    </div>
  );
};

export default Login;
