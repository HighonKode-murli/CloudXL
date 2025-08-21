export default function errorHandler(err, _req, res, _next) {
  console.error('Unhandled Error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal Server Error' });
}
