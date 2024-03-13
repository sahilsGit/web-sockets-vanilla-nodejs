// Custom error handler
const errorHandler = (
  res,
  statusCode = 500,
  message = "Internal Server Error"
) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, message }));
};

export default errorHandler;
