// Customer response handler

const responseHandler = (
  res,
  statusCode = 200,
  data = null,
  message = "Success!"
) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, message, data }));
};

export default responseHandler;
