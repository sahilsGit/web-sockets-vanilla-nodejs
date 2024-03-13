/**
 * @description All-Purpose Error class that handles all sorts of errors
 */
class ApiError extends Error {
  /**
   *
   * @param {number} statusCode
   * @param {string} message
   */
  constructor(statusCode = 500, message = "Something went wrong!") {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
  }
}

export default ApiError;
