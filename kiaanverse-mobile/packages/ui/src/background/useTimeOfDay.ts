/**
 * useTimeOfDay — resolve the current Vedic muhurta from the device clock.
 *
 * Returns one of 'brahma' | 'pratah' | 'madhyanha' | 'sandhya' | 'ratri' |
 * 'standard' and refreshes every 60 seconds so the atmosphere shifts
 * seamlessly as the day progresses.
 *
 * Muhurta windows:
 *   3:30am – 5:30am  → brahma    (pre-dawn — most sacred)
 *   5:30am – 8:00am  → pratah    (morning warmth)
 *   8:00am – 6:00pm  → madhyanha (daytime, dominant blue sky)
 *   6:00pm – 8:00pm  → sandhya   (dusk — amber shimmer)
 *   9:00pm – 3:00am  → ratri     (deep night — reduced particles)
 *   otherwise        → standard
 */

import { useEffect, useState } from 'react';
import {
  TIME_OF_DAY_POLL_INTERVAL,
  type TimeOfDay,
} from './tokens/background';

export function resolveTimeOfDay(now: Date = new Date()): TimeOfDay {
  // Work in minutes-since-midnight for clean range compares
  const minutes = now.getHours() * 60 + now.getMinutes();

  // brahma muhurta: 3:30am – 5:30am
  if (minutes >= 3 * 60 + 30 && minutes < 5 * 60 + 30) return 'brahma';
  // pratah: 5:30am – 8:00am
  if (minutes >= 5 * 60 + 30 && minutes < 8 * 60) return 'pratah';
  // madhyanha: 8:00am – 6:00pm
  if (minutes >= 8 * 60 && minutes < 18 * 60) return 'madhyanha';
  // sandhya: 6:00pm – 8:00pm
  if (minutes >= 18 * 60 && minutes < 20 * 60) return 'sandhya';
  // ratri: 9:00pm – 3:00am (wraps around midnight)
  if (minutes >= 21 * 60 || minutes < 3 * 60) return 'ratri';

  return 'standard';
}

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => resolveTimeOfDay());

  useEffect(() => {
    const tick = () => {
      const next = resolveTimeOfDay();
      setTimeOfDay((prev) => (prev === next ? prev : next));
    };

    const id = setInterval(tick, TIME_OF_DAY_POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return timeOfDay;
}
