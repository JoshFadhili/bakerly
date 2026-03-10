import { auth } from "./firebase";

/**
 * Get the current authenticated user's UID
 * @returns The user's UID or null if not authenticated
 */
export const getCurrentUserId = (): string | null => {
  if (!auth.currentUser) {
    console.warn("No authenticated user found. User may not be logged in.");
    return null;
  }
  return auth.currentUser.uid;
};

/**
 * Get the current authenticated user's UID (throws error if not authenticated)
 * @throws Error if no user is authenticated
 */
export const getCurrentUserIdOrThrow = (): string => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user found. Please log in.");
  }
  return auth.currentUser.uid;
};

/**
 * Check if a document belongs to the current user
 * @param ownerId The ownerId field of the document
 * @returns true if the document belongs to the current user
 */
export const isDocumentOwner = (ownerId: string): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  return ownerId === userId;
};

/**
 * Add ownerId to an object before saving to Firestore
 * @param data The data object to add ownerId to
 * @returns The data object with ownerId added (or original if not authenticated)
 */
export const addOwnerId = <T extends object>(data: T): T & { ownerId?: string } => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn("Cannot add ownerId: user not authenticated");
    return data;
  }
  return {
    ...data,
    ownerId: userId,
  };
};
