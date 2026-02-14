/**
 * Whop Webhook Cloud Function
 *
 * Handles incoming Whop webhook events for marketplace purchases and
 * membership lifecycle changes.
 *
 * @module whop/onWhopWebhook
 */

import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import {
  verifyWhopSignature,
  findUserByEmail,
  mapWhopProductToId,
} from './whop-utils.js';

/**
 * Handle a `membership.went_valid` event (user purchased access).
 *
 * Writes to:
 *   - purchases/{purchaseId}
 *   - users/{userId}/library/{productId}  (when the user is known)
 */
async function handleMembershipValid(db, payload) {
  const membership = payload.data ?? payload;
  const email = (membership.email ?? membership.user?.email ?? '').toLowerCase();
  const whopMembershipId = membership.id;
  const whopProductId = membership.product_id ?? membership.plan_id ?? '';
  const amount = membership.amount ?? membership.final_amount ?? 0;

  const productId = await mapWhopProductToId(whopProductId);
  const user = email ? await findUserByEmail(email) : null;

  const purchaseData = {
    userId: user?.id ?? null,
    productId,
    whopMembershipId,
    whopProductId,
    amount,
    status: 'completed',
    email: email || null,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = db.batch();

  // 1. Write purchase record
  const purchaseRef = db.collection('purchases').doc();
  batch.set(purchaseRef, purchaseData);

  // 2. Grant library access if we know the user
  if (user) {
    const libraryRef = db
      .collection('users')
      .doc(user.id)
      .collection('library')
      .doc(productId);

    batch.set(libraryRef, {
      purchasedAt: FieldValue.serverTimestamp(),
      accessGranted: true,
      whopMembershipId,
      productId,
    });
  }

  await batch.commit();

  logger.info('membership.went_valid processed', {
    purchaseId: purchaseRef.id,
    userId: user?.id ?? 'unknown',
    productId,
    email,
  });
}

/**
 * Handle a `membership.went_invalid` event (access revoked / expired).
 *
 * Revokes the user's library access by setting `accessGranted: false`.
 */
async function handleMembershipInvalid(db, payload) {
  const membership = payload.data ?? payload;
  const whopMembershipId = membership.id;
  const email = (membership.email ?? membership.user?.email ?? '').toLowerCase();

  // Locate the purchase record via whopMembershipId
  const purchaseSnap = await db
    .collection('purchases')
    .where('whopMembershipId', '==', whopMembershipId)
    .limit(1)
    .get();

  if (purchaseSnap.empty) {
    logger.warn('membership.went_invalid: no matching purchase found', {
      whopMembershipId,
      email,
    });
    return;
  }

  const purchaseDoc = purchaseSnap.docs[0];
  const purchaseData = purchaseDoc.data();
  const userId = purchaseData.userId;
  const productId = purchaseData.productId;

  const batch = db.batch();

  // Update purchase status
  batch.update(purchaseDoc.ref, {
    status: 'revoked',
    revokedAt: FieldValue.serverTimestamp(),
  });

  // Revoke library access if user is known
  if (userId) {
    const libraryRef = db
      .collection('users')
      .doc(userId)
      .collection('library')
      .doc(productId);

    batch.update(libraryRef, {
      accessGranted: false,
      revokedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  logger.info('membership.went_invalid processed', {
    whopMembershipId,
    userId: userId ?? 'unknown',
    productId,
  });
}

// ──────────────────────────────────────────────────────────────────
// Cloud Function entry point
// ──────────────────────────────────────────────────────────────────

export const onWhopWebhook = onRequest(
  {
    // Keep the raw body so we can verify the HMAC signature
    rawBody: true,
    cors: false,
    maxInstances: 10,
  },
  async (req, res) => {
    // Only accept POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Verify signature
    const signature = req.headers['whop-signature'] ?? '';
    const secret = process.env.WHOP_WEBHOOK_SECRET ?? '';

    if (!verifyWhopSignature(req.rawBody, signature, secret)) {
      logger.warn('Webhook signature verification failed');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const body = req.body;
    const event = body.event ?? body.action;

    logger.info('Whop webhook received', { event });

    const db = getFirestore();

    try {
      switch (event) {
        case 'membership.went_valid':
          await handleMembershipValid(db, body);
          break;

        case 'membership.went_invalid':
          await handleMembershipInvalid(db, body);
          break;

        default:
          logger.info('Unhandled Whop event, acknowledging', { event });
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error processing Whop webhook', { event, error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);
