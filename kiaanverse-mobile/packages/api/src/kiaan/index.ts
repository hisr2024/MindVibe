/**
 * Barrel for the unified KIAAN client. Re-exports the `kiaan` namespace
 * and all request/response types so consumers can import from
 * `@kiaanverse/api` without reaching into the sub-path.
 */

export {
  kiaan,
  type KiaanClient,
  type KiaanMessage,
  type KiaanGitaVerse,
  type KiaanChatRequest,
  type KiaanChatResponse,
  type KiaanToolRequest,
  type EmotionalResetInputs,
  type ArdhaInputs,
  type ViyogaInputs,
  type KarmaResetInputs,
  type RelationshipCompassInputs,
  type KarmaLytixMetadata,
} from './client';

export {
  useKiaanRoomChat,
  useKiaanVoice,
  type KiaanRoomChatMessage,
  type UseKiaanRoomChatResult,
  type UseKiaanVoiceResult,
} from './hooks';
