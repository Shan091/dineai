// Simple Sound Utility using reliable CDN assets
const SOUNDS = {
  // Kitchen Order (Bell Chime)
  order: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',

  // Waiter Ready (Polite Ping)
  ready: 'https://assets.mixkit.co/active_storage/sfx/2864/2864-preview.mp3',

  // Legacy/Other sounds can be kept or mapped if needed
  kitchen_alert: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3',
  success_chime: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  service_bell: 'https://assets.mixkit.co/active_storage/sfx/2861/2861-preview.mp3',
};

export type SoundType = 'order' | 'ready' | keyof typeof SOUNDS;

export const playNotificationSound = (type: SoundType) => {
  try {
    const audio = new Audio(SOUNDS[type] || SOUNDS['order']);

    // Adjust volumes
    if (type === 'order' || type === 'kitchen_alert') {
      audio.volume = 1.0;
    } else {
      audio.volume = 0.6;
    }

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Audio play prevented by browser policy:", error);
      });
    }
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

// Backwards compatibility alias if needed, or replace usages
export const playSound = playNotificationSound;