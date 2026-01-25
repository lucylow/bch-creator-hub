/**
 * Audit logging for security and compliance.
 * Logs all financial and sensitive actions to a dedicated audit stream for monitoring and forensics.
 */
const logger = require('../utils/logger');

const AUDIT_EVENTS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGIN_FAIL: 'auth.login_fail',
  PAYMENT_RECORDED: 'payment.recorded',
  PAYMENT_PROCESSED: 'payment.processed',
  WITHDRAWAL_CREATED: 'withdrawal.created',
  WITHDRAWAL_COMPLETED: 'withdrawal.completed',
  CONTRACT_WITHDRAW_SKELETON: 'contract.withdraw_skeleton',
  CONTRACT_WITHDRAW_BROADCAST: 'contract.withdraw_broadcast',
  WEBHOOK_TRIGGERED: 'webhook.triggered',
  SETTINGS_CHANGED: 'settings.changed',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked'
};

/**
 * Write an audit log entry. Use structured fields for searchability.
 * @param {string} event - One of AUDIT_EVENTS
 * @param {object} meta - Context: creatorId, ip, requestId, amounts, txid, etc. No secrets.
 */
function audit(event, meta = {}) {
  const entry = {
    audit: true,
    event,
    at: new Date().toISOString(),
    ...meta
  };
  logger.info('AUDIT', entry);
}

/**
 * Log payment recorded (API or scanner).
 */
function logPaymentRecorded({ creatorId, txid, amountSats, intentId, source = 'api', requestId }) {
  audit(AUDIT_EVENTS.PAYMENT_RECORDED, {
    creatorId,
    txid,
    amountSats: Number(amountSats),
    intentId: intentId || null,
    source,
    requestId
  });
}

/**
 * Log withdrawal creation.
 */
function logWithdrawalCreated({ creatorId, amountSats, toAddress, withdrawalId, requestId }) {
  audit(AUDIT_EVENTS.WITHDRAWAL_CREATED, {
    creatorId,
    amountSats: Number(amountSats),
    toAddress: toAddress ? `${toAddress.slice(0, 8)}...${toAddress.slice(-6)}` : null,
    withdrawalId,
    requestId
  });
}

/**
 * Log withdrawal completion.
 */
function logWithdrawalCompleted({ creatorId, withdrawalId, txid, amountSats, requestId }) {
  audit(AUDIT_EVENTS.WITHDRAWAL_COMPLETED, {
    creatorId,
    withdrawalId,
    txid,
    amountSats: Number(amountSats),
    requestId
  });
}

/**
 * Log contract withdraw skeleton created.
 */
function logContractWithdrawSkeleton({ creatorId, withdrawRequestId, totalSats, requestId }) {
  audit(AUDIT_EVENTS.CONTRACT_WITHDRAW_SKELETON, {
    creatorId,
    withdrawRequestId,
    totalSats: Number(totalSats),
    requestId
  });
}

/**
 * Log contract withdraw broadcast (money moved).
 */
function logContractWithdrawBroadcast({ creatorId, withdrawRequestId, txid, requestId }) {
  audit(AUDIT_EVENTS.CONTRACT_WITHDRAW_BROADCAST, {
    creatorId,
    withdrawRequestId,
    txid,
    requestId
  });
}

/**
 * Log successful auth (non-sensitive: no token/signature).
 */
function logAuthSuccess({ creatorId, addressHint }) {
  audit(AUDIT_EVENTS.AUTH_LOGIN, {
    creatorId,
    addressHint: addressHint ? `${addressHint.slice(0, 8)}...` : null
  });
}

/**
 * Log failed auth attempt (e.g. invalid signature).
 */
function logAuthFailure({ reason, addressHint, requestId }) {
  audit(AUDIT_EVENTS.AUTH_LOGIN_FAIL, {
    reason,
    addressHint: addressHint ? `${addressHint.slice(0, 8)}...` : null,
    requestId
  });
}

module.exports = {
  audit,
  AUDIT_EVENTS,
  logPaymentRecorded,
  logWithdrawalCreated,
  logWithdrawalCompleted,
  logContractWithdrawSkeleton,
  logContractWithdrawBroadcast,
  logAuthSuccess,
  logAuthFailure
};
