/// <reference types="dom-speech-recognition" />

/**
 * Type declarations for Web Speech API
 * Extends the Window interface to include webkit-prefixed SpeechRecognition
 */

interface Window {
  webkitSpeechRecognition?: typeof SpeechRecognition;
  SpeechRecognition?: typeof SpeechRecognition;
}
