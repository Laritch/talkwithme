// Sound Generator for Testing
// This script generates simple notification sounds and can be used for testing
// Run this script in browser console to generate sounds

// Create Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to create a simple notification sound
const createSound = (type) => {
  // Create an oscillator with different sounds for different notifications
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Connect the oscillator to gain node and gain node to destination
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Configure sound based on type
  switch (type) {
    case 'message':
      // Simple ascending tone for message notifications
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.2); // A5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      break;

    case 'group':
      // Two-tone notification for group messages
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.linearRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);
      break;

    case 'status':
      // Simple descending tone for status notifications
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
      oscillator.frequency.linearRampToValueAtTime(329.63, audioContext.currentTime + 0.3); // E4
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);
      break;

    case 'error':
      // Error sound with dissonance
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
      oscillator.frequency.linearRampToValueAtTime(233.08, audioContext.currentTime + 0.1); // A#3
      oscillator.frequency.linearRampToValueAtTime(220, audioContext.currentTime + 0.2); // A3
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
  }

  // Return a promise that resolves when the sound is done playing
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 500); // A bit longer than the sound to ensure it's complete
  });
};

// Play all sounds for testing
const testAllSounds = async () => {
  console.log('Playing message notification sound...');
  await createSound('message');

  setTimeout(async () => {
    console.log('Playing group message notification sound...');
    await createSound('group');

    setTimeout(async () => {
      console.log('Playing status change notification sound...');
      await createSound('status');

      setTimeout(async () => {
        console.log('Playing error notification sound...');
        await createSound('error');
      }, 800);
    }, 800);
  }, 800);
};

// Run the test function
testAllSounds();
