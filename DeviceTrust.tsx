'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';

export function DeviceTrust() {
  const { toast } = useToast();
  const { user, registerTrustedDevice, isLoading } = useAuth();
  const [step, setStep] = useState<'intro' | 'checking' | 'success' | 'failed'>('intro');

  // Check if this device is already trusted
  const isTrusted = user?.deviceTrusted || false;

  // Get device information for display
  const deviceInfo = {
    browser: typeof navigator !== 'undefined' ? getBrowserName() : 'Unknown',
    os: typeof navigator !== 'undefined' ? getOperatingSystem() : 'Unknown',
    deviceType: typeof navigator !== 'undefined' ? getDeviceType() : 'Unknown',
    location: 'Current location' // In a real app, would be determined via geolocation API
  };

  // Handle trust this device
  const handleTrustDevice = async () => {
    setStep('checking');

    try {
      // Simulate device verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Register the device as trusted
      await registerTrustedDevice();

      setStep('success');
      toast({
        title: 'Device Trusted',
        description: 'This device has been added to your trusted devices. You won\'t need to verify your identity on future logins from this device.',
      });
    } catch (error) {
      setStep('failed');
      toast({
        title: 'Trust Failed',
        description: 'We couldn\'t register this device. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {isTrusted ? 'Trusted Device' : 'Device Trust'}
        </CardTitle>
        <CardDescription>
          {isTrusted
            ? 'This device is trusted for your remote consulting sessions.'
            : 'Secure your remote consulting sessions on this device'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Device Information</h3>
            <ul className="text-sm space-y-1">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Browser:</span>
                <span>{deviceInfo.browser}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Operating System:</span>
                <span>{deviceInfo.os}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Device Type:</span>
                <span>{deviceInfo.deviceType}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span>{deviceInfo.location}</span>
              </li>
              <li className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Trust Status:</span>
                <span className="flex items-center">
                  {isTrusted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                      Trusted
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                      Not Trusted
                    </>
                  )}
                </span>
              </li>
            </ul>
          </div>

          {step === 'intro' && !isTrusted && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p>Trusting this device will:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Skip verification codes on future logins</li>
                  <li>Make session connections faster and more reliable</li>
                  <li>Improve the remote consulting experience</li>
                </ul>
              </div>
              <Button onClick={handleTrustDevice} className="w-full">
                Trust This Device
              </Button>
            </div>
          )}

          {step === 'checking' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
              <p className="text-sm">Verifying device security...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div className="space-y-1">
                <p className="font-medium">Device Trusted Successfully</p>
                <p className="text-sm text-muted-foreground">
                  This device is now trusted for your remote consulting sessions.
                </p>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <div className="space-y-1">
                <p className="font-medium">Trust Process Failed</p>
                <p className="text-sm text-muted-foreground">
                  We couldn't verify this device. Please try again later.
                </p>
              </div>
              <Button onClick={() => setStep('intro')} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <div className="text-xs text-muted-foreground flex items-center">
          <Laptop className="h-3 w-3 mr-1" />
          Trusted devices help maintain secure remote sessions
        </div>
      </CardFooter>
    </Card>
  );
}

// Utility functions to get device information
function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';

  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  }

  return browserName;
}

function getOperatingSystem(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const userAgent = navigator.userAgent;
  let os = 'Unknown';

  if (userAgent.indexOf('Win') !== -1) {
    os = 'Windows';
  } else if (userAgent.indexOf('Mac') !== -1) {
    os = 'MacOS';
  } else if (userAgent.indexOf('Linux') !== -1) {
    os = 'Linux';
  } else if (userAgent.indexOf('Android') !== -1) {
    os = 'Android';
  } else if (userAgent.indexOf('iOS') !== -1 || userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) {
    os = 'iOS';
  }

  return os;
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const userAgent = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'Mobile';
  }

  return 'Desktop';
}
