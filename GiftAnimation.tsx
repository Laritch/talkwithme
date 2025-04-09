"use client";

import { useState, useEffect } from 'react';

interface GiftAnimationProps {
  giftIcon: string;
  animation: string;
  quantity?: number;
  onComplete?: () => void;
}

export default function GiftAnimation({
  giftIcon,
  animation,
  quantity = 5,
  onComplete
}: GiftAnimationProps) {
  const [animationElements, setAnimationElements] = useState<JSX.Element[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation when component mounts
    startAnimation();

    // Cleanup animation when component unmounts
    return () => {
      setAnimationElements([]);
      setIsAnimating(false);
    };
  }, []);

  const startAnimation = () => {
    setIsAnimating(true);

    // Create animation elements based on the animation type
    const elements: JSX.Element[] = [];

    for (let i = 0; i < quantity; i++) {
      const id = `gift-anim-${i}`;
      const delay = Math.random() * 0.5; // Random delay up to 0.5s
      const duration = 0.8 + Math.random() * 1.2; // Random duration between 0.8s and 2s
      const size = 32 + Math.floor(Math.random() * 32); // Random size between 32px and 64px

      // Randomize starting position
      const startX = 40 + Math.random() * 20; // 40-60% from left
      const startY = 60 + Math.random() * 20; // 60-80% from top

      let animationStyle = {};

      // Apply different animation styles based on the type
      switch (animation) {
        case 'sparkle':
          animationStyle = {
            animation: `sparkleAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'float':
          animationStyle = {
            animation: `floatAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            bottom: '0',
            opacity: 0,
          };
          break;

        case 'pulse':
          animationStyle = {
            animation: `pulseAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'glow':
          animationStyle = {
            animation: `glowAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'rotate':
          animationStyle = {
            animation: `rotateAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'rainbow':
          animationStyle = {
            animation: `rainbowAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'fly':
          animationStyle = {
            animation: `flyAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: '-10%',
            top: `${20 + Math.random() * 60}%`,
            opacity: 0,
          };
          break;

        case 'ring':
          animationStyle = {
            animation: `ringAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
            transform: 'rotate(0deg)',
          };
          break;

        case 'twinkle':
          animationStyle = {
            animation: `twinkleAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'shine':
          animationStyle = {
            animation: `shineAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0,
          };
          break;

        case 'elevate':
          animationStyle = {
            animation: `elevateAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            bottom: '-10%',
            opacity: 0,
          };
          break;

        case 'bridge':
          animationStyle = {
            animation: `bridgeAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: '-10%',
            top: `${40 + Math.random() * 20}%`,
            opacity: 0,
          };
          break;

        default:
          // Default fade-up animation
          animationStyle = {
            animation: `fadeUpAnimation ${duration}s ${delay}s ease-out forwards`,
            fontSize: `${size}px`,
            left: `${startX}%`,
            bottom: '10%',
            opacity: 0,
          };
      }

      elements.push(
        <div
          key={id}
          className="absolute"
          style={animationStyle}
        >
          {giftIcon}
        </div>
      );
    }

    setAnimationElements(elements);

    // Set a timeout to clean up after animations are complete
    const maxDuration = 2.5; // Max animation time in seconds
    setTimeout(() => {
      setIsAnimating(false);
      onComplete && onComplete();
    }, maxDuration * 1000); // Convert to milliseconds
  };

  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <style jsx global>{`
        @keyframes sparkleAnimation {
          0% { transform: scale(0.5); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(1.5) rotate(20deg); opacity: 0; }
        }

        @keyframes floatAnimation {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-300px); opacity: 0; }
        }

        @keyframes pulseAnimation {
          0% { transform: scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 0; }
        }

        @keyframes glowAnimation {
          0% { text-shadow: 0 0 0px transparent; opacity: 0; }
          20% { opacity: 1; }
          50% { text-shadow: 0 0 20px gold, 0 0 30px yellow; }
          100% { transform: scale(1.2); opacity: 0; text-shadow: 0 0 0px transparent; }
        }

        @keyframes rotateAnimation {
          0% { transform: rotate(0deg) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: rotate(360deg) scale(1.2); opacity: 0; }
        }

        @keyframes rainbowAnimation {
          0% { filter: hue-rotate(0deg); opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; }
          100% { filter: hue-rotate(360deg); transform: scale(1.2); opacity: 0; }
        }

        @keyframes flyAnimation {
          0% { transform: translateX(0) translateY(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(120vw) translateY(-100px); opacity: 0; }
        }

        @keyframes ringAnimation {
          0% { transform: rotate(-30deg); opacity: 0; }
          10% { opacity: 1; }
          30% { transform: rotate(30deg); }
          50% { transform: rotate(-15deg); }
          70% { transform: rotate(15deg); }
          85% { transform: rotate(-5deg); }
          95% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); opacity: 0; }
        }

        @keyframes twinkleAnimation {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; }
          40% { opacity: 0.6; }
          60% { opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes shineAnimation {
          0% { opacity: 0; text-shadow: 0 0 0 transparent; }
          20% { opacity: 1; }
          40% { text-shadow: 0 0 10px gold; }
          60% { text-shadow: 0 0 20px gold, 0 0 40px gold; }
          100% { transform: scale(1.3) rotate(20deg); opacity: 0; text-shadow: 0 0 0 transparent; }
        }

        @keyframes elevateAnimation {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-300px) scale(1.2) rotate(15deg); opacity: 0; }
        }

        @keyframes bridgeAnimation {
          0% { transform: translateX(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translateX(50vw) translateY(-50px) scale(1.3); }
          100% { transform: translateX(120vw) translateY(0) scale(0.8); opacity: 0; }
        }

        @keyframes fadeUpAnimation {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-200px) scale(1.1); opacity: 0; }
        }
      `}</style>

      {animationElements}
    </div>
  );
}
