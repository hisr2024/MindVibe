/**
 * Karma Reset — Static fallback reflection questions.
 *
 * Mirrors the static `FALLBACK_QUESTIONS` block in the web Next.js
 * route `app/api/karma-reset/reflect/route.ts`. The mobile app calls
 * the backend `/api/karma-reset/reflect` endpoint first; when the
 * backend hasn't implemented that endpoint yet (current state) or is
 * unreachable, the service falls back to these so the ritual always
 * has something thoughtful to ask.
 *
 * One entry per `KarmaCategory`, each with three sequential questions
 * (`questionIndex` 0, 1, 2). When a category is unknown we fall back
 * to `action`, matching the web behaviour exactly.
 */

import type {
  KarmaCategory,
  KarmaReflectionQuestion,
} from './types';

export const FALLBACK_QUESTIONS: Record<
  KarmaCategory,
  KarmaReflectionQuestion[]
> = {
  action: [
    {
      question: 'When you acted, what was the force moving through you?',
      subtext: 'Be honest — not all actions come from the same place.',
      options: [
        'I acted from fear rather than wisdom',
        'I acted from hurt or anger',
        'I acted out of habit, without thinking',
        'I acted from good intention but poor judgment',
      ],
    },
    {
      question: 'Who was most affected by what you did?',
      subtext: 'Sometimes we see the ripple only after the stone has been thrown.',
      options: [
        'The person or situation I acted toward',
        'My own inner peace and integrity',
        'I am not sure — that is why I am here',
        "Neither — I'm questioning whether it was even wrong",
      ],
    },
    {
      question: 'If you could stand at that moment again, what would you choose?',
      subtext: 'This is not about regret. It is about clarity.',
      options: [
        'I would choose compassion over reaction',
        'I would speak more clearly about my need',
        'I would do nothing — wait for clarity first',
        'I would seek guidance from someone wiser',
      ],
    },
  ],
  speech: [
    {
      question: 'What was the quality of your speech in that moment?',
      subtext: 'The Gita speaks of three kinds of speech — sattvic, rajasic, and tamasic.',
      options: [
        'My words were sharp — meant to wound or control',
        'My words were true but delivered without care',
        'My words were dishonest — I hid what I really felt',
        'My words were unnecessary — I spoke when silence was wiser',
      ],
    },
    {
      question: 'What was the silence that you did not give voice to?',
      subtext: 'Often, what we said replaced what we truly meant.',
      options: [
        'I was afraid and covered it with aggression',
        'I was hurt and wanted the other person to feel it too',
        'I was confused and spoke before I understood',
        'I was trying to be helpful but missed the mark',
      ],
    },
    {
      question: 'What would sattvic speech have sounded like in that moment?',
      subtext: 'Speech that is truthful, pleasing, beneficial, and causes no agitation.',
      options: [
        'Quiet honesty without blame',
        'A question instead of a statement',
        'No speech at all — simply presence',
        'An acknowledgment of my own feelings first',
      ],
    },
  ],
  thought: [
    {
      question: 'When this thought pattern arises, where does it take you?',
      subtext: 'The mind is either the best friend or worst enemy of the self.',
      options: [
        'Into anxiety about what might happen',
        'Into comparison with others',
        'Into self-criticism and unworthiness',
        'Into avoidance of something I need to face',
      ],
    },
    {
      question: 'How long has this thought pattern lived in you?',
      subtext: 'Some patterns are ancient — not all of them are yours.',
      options: [
        'It has been with me since childhood',
        'It arrived with a specific life event',
        'It comes and goes — this is a strong wave',
        'It is new and I do not yet understand it',
      ],
    },
    {
      question: 'If you could sit beside this thought without becoming it, what would you see?',
      subtext: 'The witness sees without being carried away.',
      options: [
        'A scared child trying to protect itself',
        'An old story that no longer serves me',
        'A genuine signal that something needs to change',
        'A habit of the mind, not a truth about reality',
      ],
    },
  ],
  reaction: [
    {
      question: 'In the moment of your reaction, what happened to your awareness?',
      subtext: 'Reaction is the gap between stimulus and choice collapsing to zero.',
      options: [
        'I lost awareness completely — it was automatic',
        "I saw myself reacting but couldn't stop",
        'I chose to react, believing it was justified',
        'I numbed out — my reaction was to shut down',
      ],
    },
    {
      question: 'What was the emotion beneath the reaction?',
      subtext: 'Reactions are the surface. The current runs deeper.',
      options: [
        'Fear of being hurt or abandoned',
        'Anger at being misunderstood or disrespected',
        'Grief for something I have not fully processed',
        'Frustration with myself more than with anyone else',
      ],
    },
    {
      question: 'What does equanimity look like for you in situations like this?',
      subtext: 'Samatva — the balance that Krishna calls yoga itself.',
      options: [
        'Pausing before I speak or act',
        'Accepting the situation without needing to fix it immediately',
        'Allowing the emotion to pass through without acting on it',
        'Seeking understanding before seeking to be understood',
      ],
    },
  ],
  avoidance: [
    {
      question: 'What is it that you have been avoiding?',
      subtext: 'Even Arjuna wanted to lay down his bow. Avoidance is human.',
      options: [
        'A difficult conversation I need to have',
        'A responsibility I know is mine',
        'A truth about myself I am not ready to face',
        'An action that feels too overwhelming to begin',
      ],
    },
    {
      question: 'What does this avoidance protect you from?',
      subtext: 'Every avoidance is a guardian. But what is it guarding?',
      options: [
        'Failure or judgment from others',
        'The pain of confronting something real',
        'The effort required to change',
        'I am not sure — it has become a habit',
      ],
    },
    {
      question: "If you were to take one small step toward what you've been avoiding, what would it be?",
      subtext: 'Svadharma begins with a single conscious step.',
      options: [
        'Speaking one honest sentence to the person involved',
        'Writing down what I have been avoiding and why',
        'Asking for help from someone I trust',
        'Simply sitting with the discomfort instead of running from it',
      ],
    },
  ],
  intention: [
    {
      question: 'When you examine the intention behind your action, what do you find?',
      subtext: 'The Gita says: you have a right to action, never to its fruits.',
      options: [
        'My intention was good but the outcome was not what I expected',
        'My intention was mixed — part selfless, part self-serving',
        'My intention was unclear even to me at the time',
        'My intention was pure but I doubt whether it matters',
      ],
    },
    {
      question: 'What fruit were you hoping for?',
      subtext: 'Attachment to outcome is the root of suffering in action.',
      options: [
        'I wanted to be seen as good or helpful',
        'I wanted a specific result and acted to get it',
        'I wanted to avoid a negative consequence',
        'I truly acted without attachment — but the result still hurts',
      ],
    },
    {
      question: 'If you release the fruit and look only at the action itself, was it dharmic?',
      subtext: 'Dharma is the action aligned with truth, regardless of outcome.',
      options: [
        'Yes — the action was right, even if the outcome was painful',
        'No — I see now that the action itself was misaligned',
        'Partially — some part was dharmic, some part was ego',
        'I cannot tell — and that is what troubles me most',
      ],
    },
  ],
};

export function getFallbackQuestion(
  category: KarmaCategory,
  questionIndex: 0 | 1 | 2,
): KarmaReflectionQuestion {
  const list = FALLBACK_QUESTIONS[category] ?? FALLBACK_QUESTIONS.action;
  const idx = Math.min(Math.max(questionIndex, 0), list.length - 1);
  return list[idx]!;
}
