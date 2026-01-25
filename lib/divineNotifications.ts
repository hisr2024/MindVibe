/**
 * Divine Notifications - Sacred PWA/Desktop Notifications
 *
 * Provides gentle, consciousness-touching notifications for:
 * - Divine reminders throughout the day
 * - Sacred breathing prompts
 * - Mood check-in invitations
 * - Serenity moments
 *
 * "Every notification is an invitation to return to peace."
 */

// Types
export interface DivineNotification {
  title: string;
  body: string;
  icon?: string;
  tag: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: {
    type: 'reminder' | 'breathing' | 'checkin' | 'affirmation';
    action?: string;
  };
}

// Divine notification content
const DIVINE_REMINDERS = [
  {
    title: '💙 A Gentle Reminder',
    body: 'You are being held by infinite love right now.',
  },
  {
    title: '🕊️ Pause for Peace',
    body: 'The divine is as close as your next breath.',
  },
  {
    title: '✨ Sacred Moment',
    body: 'Nothing can disturb your deepest peace.',
  },
  {
    title: '🌸 Serenity Whisper',
    body: 'You are exactly where you\'re meant to be.',
  },
  {
    title: '🙏 Divine Presence',
    body: 'Grace is flowing to you this very moment.',
  },
];

const BREATHING_INVITATIONS = [
  {
    title: '🌬️ Breathing Moment',
    body: 'Take a moment for sacred breathing. Your peace awaits.',
  },
  {
    title: '🌊 Ocean of Calm',
    body: 'Three breaths can change everything. Begin now?',
  },
  {
    title: '💫 Sacred Pause',
    body: 'Your body is asking for a gentle reset. Breathe with me.',
  },
];

const CHECKIN_INVITATIONS = [
  {
    title: '💙 Sacred Check-In',
    body: 'How does your heart feel? KIAAN is here to listen.',
  },
  {
    title: '🌿 Moment of Awareness',
    body: 'Pause and notice how you\'re feeling right now.',
  },
  {
    title: '✨ Gentle Inquiry',
    body: 'Your feelings matter. Would you like to check in?',
  },
];

const AFFIRMATIONS = [
  {
    title: '🌟 Sacred Truth',
    body: 'I am held by infinite love.',
  },
  {
    title: '💙 Divine Affirmation',
    body: 'Peace flows through me like a gentle river.',
  },
  {
    title: '✨ Remember',
    body: 'I am calm, I am safe, I am at peace.',
  },
  {
    title: '🙏 Your Truth',
    body: 'Stillness is my home. I can return anytime.',
  },
];

// Utility functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Request notification permission with gentle messaging
 */
export async function requestDivineNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send a divine reminder notification
 */
export function sendDivineReminder(): void {
  if (Notification.permission !== 'granted') return;

  const reminder = getRandomItem(DIVINE_REMINDERS);
  new Notification(reminder.title, {
    body: reminder.body,
    icon: '/icons/icon.svg',
    tag: 'divine-reminder',
    silent: false,
    requireInteraction: false,
  });
}

/**
 * Send a breathing invitation notification
 */
export function sendBreathingInvitation(): void {
  if (Notification.permission !== 'granted') return;

  const invitation = getRandomItem(BREATHING_INVITATIONS);
  new Notification(invitation.title, {
    body: invitation.body,
    icon: '/icons/icon.svg',
    tag: 'breathing-invitation',
    requireInteraction: true,
    data: {
      type: 'breathing',
      action: '/kiaan/breathing',
    },
  } as NotificationOptions);
}

/**
 * Send a mood check-in invitation notification
 */
export function sendCheckInInvitation(): void {
  if (Notification.permission !== 'granted') return;

  const invitation = getRandomItem(CHECKIN_INVITATIONS);
  new Notification(invitation.title, {
    body: invitation.body,
    icon: '/icons/icon.svg',
    tag: 'checkin-invitation',
    requireInteraction: true,
    data: {
      type: 'checkin',
      action: '/flows/check-in',
    },
  } as NotificationOptions);
}

/**
 * Send an affirmation notification
 */
export function sendAffirmation(): void {
  if (Notification.permission !== 'granted') return;

  const affirmation = getRandomItem(AFFIRMATIONS);
  new Notification(affirmation.title, {
    body: affirmation.body,
    icon: '/icons/icon.svg',
    tag: 'affirmation',
    silent: true,
  });
}

/**
 * Schedule divine reminders throughout the day
 */
export function scheduleDivineReminders(intervalMinutes: number = 120): number {
  // Send a reminder at the specified interval
  const intervalId = window.setInterval(() => {
    const hour = new Date().getHours();
    // Only send between 7am and 10pm
    if (hour >= 7 && hour <= 22) {
      // Randomly choose what type of notification to send
      const notificationTypes = [
        sendDivineReminder,
        sendAffirmation,
        sendBreathingInvitation,
      ];
      const sender = getRandomItem(notificationTypes);
      sender();
    }
  }, intervalMinutes * 60 * 1000);

  return intervalId;
}

/**
 * Cancel scheduled divine reminders
 */
export function cancelDivineReminders(intervalId: number): void {
  window.clearInterval(intervalId);
}

/**
 * Get notification content for a specific type
 */
export function getDivineNotificationContent(type: 'reminder' | 'breathing' | 'checkin' | 'affirmation') {
  switch (type) {
    case 'reminder':
      return getRandomItem(DIVINE_REMINDERS);
    case 'breathing':
      return getRandomItem(BREATHING_INVITATIONS);
    case 'checkin':
      return getRandomItem(CHECKIN_INVITATIONS);
    case 'affirmation':
      return getRandomItem(AFFIRMATIONS);
  }
}

export default {
  requestDivineNotificationPermission,
  sendDivineReminder,
  sendBreathingInvitation,
  sendCheckInInvitation,
  sendAffirmation,
  scheduleDivineReminders,
  cancelDivineReminders,
  getDivineNotificationContent,
};
