/**
 * Whop Webhook Utility Functions
 *
 * Helpers for signature verification, user lookup, and product mapping.
 *
 * @module whop/whop-utils
 */

import { createHmac } from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Verify the HMAC SHA-256 signature sent by Whop on each webhook request.
 *
 * @param {string|Buffer} rawBody  - The raw request body (must NOT be parsed JSON).
 * @param {string}        signature - The value of the `whop-signature` header.
 * @param {string}        secret    - The Whop webhook secret.
 * @returns {boolean} True when the signature is valid.
 */
export function verifyWhopSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Look up a user document by their email address.
 *
 * @param {string} email - The email to search for.
 * @returns {Promise<{id: string, data: Object}|null>} The user doc or null.
 */
export async function findUserByEmail(email) {
  if (!email) return null;

  const db = getFirestore();
  const snapshot = await db
    .collection('users')
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, data: doc.data() };
}

/**
 * Map a Whop product/plan ID to our internal product ID.
 *
 * In production the mapping would live in Firestore or Remote Config.
 * For now we fall back to using the Whop ID directly so that purchases
 * are never silently dropped.
 *
 * @param {string} whopProductId - The product or plan ID from Whop.
 * @returns {Promise<string>} Our internal product ID.
 */
export async function mapWhopProductToId(whopProductId) {
  const db = getFirestore();
  const mappingDoc = await db
    .collection('productMappings')
    .doc(whopProductId)
    .get();

  if (mappingDoc.exists) {
    return mappingDoc.data().productId;
  }

  // Fallback: use the Whop ID as-is so we never lose a purchase
  return whopProductId;
}
