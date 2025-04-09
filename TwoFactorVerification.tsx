'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, Laptop, Mail, Smartphone, Video, FileCheck } from 'lucide-react';
import type { VerificationMethod } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorVerificationProps {
  preferredMethod: VerificationMethod;
  availableMethods: VerificationMethod[];
  onVerify: (code: string, method: VerificationMethod) => Promise<boolean>;
  onChangeMethod: (method: VerificationMethod) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function TwoFactorVerification({
  preferredMethod,
  availableMethods,
  onVerify,
  onChangeMethod,
  onCancel,
  isLoading
}: TwoFactorVerificationProps) {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(preferredMethod);
  const [countdown, setCountdown] = useState(0);

  // Handle method change
  const handleMethodChange = (value: string) => {
    const method = value as VerificationMethod;
    setVerificationMethod(method);
    onChangeMethod(method);
    // Start countdown when changing method
    setCountdown(30);
  };

  // Handle verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      toast({
        title: 'Code Required',
        description: 'Please enter the verification code.',
        variant: 'destructive',
      });
      return;
    }

    const result = await onVerify(verificationCode, verificationMethod);
    if (!result) {
      setVerificationCode('');
    }
  };

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Resend code handler
  const handleResendCode = () => {
    onChangeMethod(verificationMethod);
    setCountdown(30);
    toast({
      title: 'Code Sent',
      description: `A new verification code has been sent via ${verificationMethod}.`,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Identity</CardTitle>
        <CardDescription>
          Enter the verification code sent to your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium" htmlFor="verification-method">
              Verification Method
            </label>
            <Tabs value={verificationMethod} onValueChange={handleMethodChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                {availableMethods.includes('email') && (
                  <TabsTrigger value="email" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </TabsTrigger>
                )}
                {availableMethods.includes('sms') && (
                  <TabsTrigger value="sms" className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> SMS
                  </TabsTrigger>
                )}
                {availableMethods.includes('authenticator') && (
                  <TabsTrigger value="authenticator" className="flex items-center gap-1">
                    <Fingerprint className="h-3 w-3" /> Authenticator
                  </TabsTrigger>
                )}
              </TabsList>

              {availableMethods.includes('video') && (
                <TabsTrigger value="video" className="flex items-center gap-1 mb-4">
                  <Video className="h-3 w-3" /> Video Verification
                </TabsTrigger>
              )}

              {availableMethods.includes('document') && (
                <TabsTrigger value="document" className="flex items-center gap-1 mb-4">
                  <FileCheck className="h-3 w-3" /> Document Upload
                </TabsTrigger>
              )}

              <TabsContent value="email">
                <div className="text-sm text-muted-foreground mb-4 p-3 bg-secondary rounded-md">
                  <p>A verification code has been sent to your registered email address.</p>
                </div>
              </TabsContent>

              <TabsContent value="sms">
                <div className="text-sm text-muted-foreground mb-4 p-3 bg-secondary rounded-md">
                  <p>A verification code has been sent to your registered phone number.</p>
                </div>
              </TabsContent>

              <TabsContent value="authenticator">
                <div className="text-sm text-muted-foreground mb-4 p-3 bg-secondary rounded-md">
                  <p>Open your authenticator app and enter the 6-digit code.</p>
                </div>
              </TabsContent>

              <TabsContent value="video">
                <div className="text-sm text-muted-foreground mb-4 p-3 bg-secondary rounded-md">
                  <p>Video verification allows you to quickly verify your identity through a short secure video call.</p>
                  <Button className="w-full mt-2" onClick={() => window.open('/video-verification', '_blank')}>
                    Start Video Verification
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="document">
                <div className="text-sm text-muted-foreground mb-4 p-3 bg-secondary rounded-md">
                  <p>Upload an official identification document (ID card, passport, driver's license) to verify your identity.</p>
                  <div className="mt-3">
                    <label htmlFor="document-upload" className="block text-sm font-medium mb-1">Upload ID Document</label>
                    <Input
                      id="document-upload"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="w-full"
                    />
                  </div>
                  <Button className="w-full mt-3" onClick={() => toast({
                    title: 'Document Submitted',
                    description: 'Your document has been submitted for verification. This usually takes 1-2 minutes.',
                  })}>
                    Submit Document
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {['email', 'sms', 'authenticator'].includes(verificationMethod) && (
              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium" htmlFor="verification-code">
                  Verification Code
                </label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-xl tracking-widest"
                  autoComplete="one-time-code"
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                  <span>Enter the 6-digit code</span>
                  {countdown > 0 ? (
                    <span>Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={handleResendCode}
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Identity'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <div className="pt-4">
            <div className="flex justify-center">
              <div className="text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Laptop className="h-3 w-3 mr-1" />
                  Trusted device? You won't need to verify next time.
                </span>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
