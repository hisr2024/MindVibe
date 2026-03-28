/**
 * Community Store — manages circles, posts, and social features.
 *
 * Handles:
 * - Circle membership and discovery
 * - Post feed for the active circle
 * - Reactions and engagement
 *
 * Circles cache is persisted for offline display.
 * Posts are transient — refetched from backend.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Circle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
}

interface Post {
  id: string;
  authorName: string;
  content: string;
  reactions: Record<string, number>;
  createdAt: string;
  circleId: string;
}

interface CommunityState {
  /** All available circles */
  circles: Circle[];
  /** Posts for the currently active circle */
  activePosts: Post[];
  /** Currently selected circle ID */
  activeCircleId: string | null;
}

interface CommunityActions {
  /** Replace the circles list (e.g. after fetch) */
  setCircles: (circles: Circle[]) => void;
  /** Replace the posts for the active circle */
  setPosts: (posts: Post[]) => void;
  /** Set the currently active circle */
  setActiveCircle: (circleId: string | null) => void;
  /** Add a new post to the active feed */
  addPost: (post: Post) => void;
  /** Increment a reaction count on a post */
  addReaction: (postId: string, reactionType: string) => void;
  /** Mark a circle as joined and increment member count */
  joinCircle: (circleId: string) => void;
  /** Mark a circle as left and decrement member count */
  leaveCircle: (circleId: string) => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: CommunityState = {
  circles: [],
  activePosts: [],
  activeCircleId: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCommunityStore = create<CommunityState & CommunityActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setCircles: (circles: Circle[]) => {
          set((state) => {
            state.circles = circles;
          });
        },

        setPosts: (posts: Post[]) => {
          set((state) => {
            state.activePosts = posts;
          });
        },

        setActiveCircle: (circleId: string | null) => {
          set((state) => {
            state.activeCircleId = circleId;
            // Clear posts when switching circles — will be refetched
            state.activePosts = [];
          });
        },

        addPost: (post: Post) => {
          set((state) => {
            state.activePosts.unshift(post);
          });
        },

        addReaction: (postId: string, reactionType: string) => {
          set((state) => {
            const post = state.activePosts.find((p) => p.id === postId);
            if (post) {
              post.reactions[reactionType] = (post.reactions[reactionType] ?? 0) + 1;
            }
          });
        },

        joinCircle: (circleId: string) => {
          set((state) => {
            const circle = state.circles.find((c) => c.id === circleId);
            if (circle && !circle.isJoined) {
              circle.isJoined = true;
              circle.memberCount += 1;
            }
          });
        },

        leaveCircle: (circleId: string) => {
          set((state) => {
            const circle = state.circles.find((c) => c.id === circleId);
            if (circle && circle.isJoined) {
              circle.isJoined = false;
              circle.memberCount = Math.max(0, circle.memberCount - 1);
            }
          });
        },
      })),
      {
        name: 'kiaanverse-community',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist circles cache — posts are transient
        partialize: (state) => ({
          circles: state.circles,
        }),
      },
    ),
    {
      name: 'CommunityStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
