const logger = require('./logger');
const { TimeoutError } = require('./errors');

/**
 * Create a promise that rejects after a timeout
 */
function withTimeout(promise, timeoutMs, context = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`${context} timed out after ${timeoutMs}ms`, {
          timeout: timeoutMs,
          context
        }));
      }, timeoutMs);
    })
  ]);
}

/**
 * Retry utility with exponential backoff and timeout support
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 100)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 5000)
 * @param {number} options.timeout - Timeout per attempt in ms (default: 30000)
 * @param {Function} options.shouldRetry - Function to determine if error is retryable
 * @param {string} options.context - Context string for logging
 * @returns {Promise} - Result of the function
 */
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    timeout = 30000, // 30 seconds default timeout
    shouldRetry = (error) => {
      // Default: retry on network errors, timeouts, and 5xx status codes
      return error instanceof TimeoutError ||
             error.code === 'ECONNREFUSED' ||
             error.code === 'ETIMEDOUT' ||
             error.code === 'ENOTFOUND' ||
             (error.response && error.response.status >= 500);
    },
    context = 'operation'
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wrap function call with timeout
      return await withTimeout(fn(), timeout, context);
    } catch (error) {
      lastError = error;
      
      const isRetryable = shouldRetry(error);
      
      // Don't retry if error is not retryable or we've exhausted retries
      if (!isRetryable || attempt === maxRetries) {
        if (attempt > 1) {
          logger.warn(`${context} failed after ${attempt} attempts`, {
            attempt,
            maxRetries,
            error: {
              name: error.name,
              message: error.message,
              code: error.code
            }
          });
        }
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      
      logger.warn(`${context} failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
        attempt,
        maxRetries,
        delay,
        timeout,
        error: {
          name: error.name,
          message: error.message,
          code: error.code
        }
      });
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry with custom error transformation
 * Useful for wrapping errors in custom error classes
 */
async function retryWithErrorTransform(fn, errorTransform, options = {}) {
  try {
    return await retry(fn, options);
  } catch (error) {
    throw errorTransform(error);
  }
}

module.exports = {
  retry,
  retryWithErrorTransform
};

