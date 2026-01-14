/**
 * QR Code Utility
 * Server-side QR code generation using qrcode package
 */

const QRCode = require('qrcode');

class QRCodeUtil {
  /**
   * Generate QR code as data URL (SVG format by default)
   * @param {string} data - Data to encode in QR code
   * @param {object} options - QR code options
   * @returns {Promise<string>} Data URL of QR code
   */
  static async generateDataURL(data, options = {}) {
    const {
      size = 200,
      margin = 2,
      errorCorrectionLevel = 'M', // L, M, Q, H
      type = 'svg', // 'svg' or 'png'
      color = {
        dark: '#000000',
        light: '#FFFFFF'
      }
    } = options;

    try {
      const qrOptions = {
        type: type === 'png' ? 'png' : 'svg',
        width: size,
        margin,
        errorCorrectionLevel,
        color
      };

      const dataURL = await QRCode.toDataURL(data, qrOptions);
      return dataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code as SVG string
   * @param {string} data - Data to encode in QR code
   * @param {object} options - QR code options
   * @returns {Promise<string>} SVG string
   */
  static async generateSVG(data, options = {}) {
    const {
      size = 200,
      margin = 2,
      errorCorrectionLevel = 'M',
      color = {
        dark: '#000000',
        light: '#FFFFFF'
      }
    } = options;

    try {
      const qrOptions = {
        width: size,
        margin,
        errorCorrectionLevel,
        color
      };

      const svg = await QRCode.toString(data, {
        type: 'svg',
        ...qrOptions
      });
      return svg;
    } catch (error) {
      throw new Error(`Failed to generate QR code SVG: ${error.message}`);
    }
  }

  /**
   * Generate QR code URL for payment links (returns data URL)
   * @param {string} url - URL to encode
   * @param {object} options - QR code options
   * @returns {Promise<string>} Data URL
   */
  static async generatePaymentQR(url, options = {}) {
    return this.generateDataURL(url, {
      size: 200,
      errorCorrectionLevel: 'M',
      ...options
    });
  }

  /**
   * Generate QR code for BCH payment URI
   * @param {string} paymentURI - BCH payment URI (bitcoincash:...)
   * @param {object} options - QR code options
   * @returns {Promise<string>} Data URL
   */
  static async generateBCHPaymentQR(paymentURI, options = {}) {
    return this.generateDataURL(paymentURI, {
      size: 256,
      errorCorrectionLevel: 'H', // High error correction for payment URIs
      ...options
    });
  }
}

module.exports = QRCodeUtil;

