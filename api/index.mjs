import { createServer } from "http";
import ApiError from "./utils/ApiError.mjs";
import errorHandler from "./utils/errorHandler.mjs";
import { createHash } from "crypto";

// Length Markers
const SEVEN_BITS_MARKER = 125;
const SIXTEEN_BITS_MARKER = 126;
const SIXTYFOUR_BITS_MARKER = 127;

const MASK_KEY_BYTES_LEN = 4; // Convention

const server = createServer((req, res) => {
  try {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end();
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("Server is listening to", port);
});

server.on("upgrade", (req, socket, head) => {
  // Get client socket key
  const { "sec-websocket-key": clientSocketKey } = req.headers;

  // Magic string
  const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

  // Prepare headers for handshake
  const headers = prepareHeader(MAGIC_STRING, clientSocketKey);

  // Initiate handshake
  socket.write(headers);

  // handles sent data
  socket.on("readable", () => {
    onSocketReadable(socket);
  });
});

const onSocketReadable = (socket) => {
  //consume 1 byte for now because it's not needed
  const firstByte = socket.read(1);

  // consume another byte
  const [markerAndPayloadLength] = socket.read(1);

  // Create a mask for bitwise AND
  const mask = 127; // 01111111

  // Doing a bitwise AND with 127 removes the first bit
  const lengthIndicator = markerAndPayloadLength & mask;

  /**
   * Since the most significant bit will be 1
   * so the number we would receive will always be greater then
   * or equals to 128, because 128 is the first number with
   * most significant bit as 1.
   *
   * So to remove the first bit what we could instead do is
   * subtract 10000000 | 128 from the numbers, this would remove
   * first bit 1 - 1 = 0, and let other 7 bits live
   *
   * So, 'lengthIndicator = markerAndPayloadLength - 128' would also give the same value
   *
   */

  let messageLength;

  /*
   * Since a signed byte or 7 bits can represent till 127
   * of which 126 & 127 are reserved by the protocol
   * At most the length a byte can represent is 125
   *
   * If it were to hold anymore then that, then it would
   * need additional bytes.
   *
   * A 126 means following 16 bits represent the actual payload length
   * not these.
   *
   * And 127 means the payload length is
   * very large and requires the following 64 bits to represent it
   */

  if (lengthIndicator <= SEVEN_BITS_MARKER) {
    messageLength = lengthIndicator;
  } else {
    throw new ApiError(400, "Your message is too long!");
  }

  // Will handle these cases later

  // else if (lengthIndicator === SIXTEEN_BITS_MARKER) {
  // } else {
  // }

  // Reading the next 4 bytes to get the that was key used to carry out XOR cipher
  const maskKey = socket.read(MASK_KEY_BYTES_LEN);

  // All the remaining bytes are encoded data payload
  const encodedDataPayload = socket.read(messageLength);

  /*
   * Decrypting the XOR cipher
   *
   * The key that encoded the payload also decodes the payload
   * the same way it encoded, i.e., A XOR operation
   */
};

const prepareHeader = (MAGIC_STRING, clientSocketKey) => {
  // Create key hash digest
  const keyHash = createDigest(MAGIC_STRING, clientSocketKey);

  // prepare headers in a specific format
  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${keyHash}`,
    "",
  ]
    .map((line) => line.concat("\r\n"))
    .join("");

  // Return headers
  return headers;
};

const createDigest = (MAGIC_STRING, clientSocketKey) =>
  // Use crypto sha1 base64 encoded hash
  createHash("sha1")
    .update(clientSocketKey + MAGIC_STRING)
    .digest("base64");
