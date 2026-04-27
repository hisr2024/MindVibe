/**
 * Sakha — landing screen (Part 7 scaffold).
 *
 * The full Shankha-centered VoiceCompanionScreen lands in Part 10. Until
 * then this scaffold renders a placeholder so `expo start` boots cleanly
 * and Metro can resolve the entry without errors.
 */

import Constants from 'expo-constants';
import { Text, View } from 'react-native';

const { personaVersion, schemaVersion, subprotocol, apiBaseUrl } =
  (Constants.expoConfig?.extra ?? {}) as {
    personaVersion?: string;
    schemaVersion?: string;
    subprotocol?: string;
    apiBaseUrl?: string;
  };

export default function LandingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* DIVINE_GOLD heading */}
      <Text style={{ color: '#D4A017', fontSize: 28, marginBottom: 4 }}>
        सखा
      </Text>
      <Text style={{ color: '#E5E7EB', fontSize: 18, marginBottom: 24 }}>
        Sakha — Voice Companion
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 4 }}>
        Persona-version: {personaVersion ?? 'unknown'}
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 4 }}>
        Schema-version: {schemaVersion ?? 'unknown'}
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 4 }}>
        Subprotocol: {subprotocol ?? 'unknown'}
      </Text>
      <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 24 }}>
        API: {apiBaseUrl ?? '(not configured)'}
      </Text>
      <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 24 }}>
        Voice screens land in Part 10.
      </Text>
    </View>
  );
}
