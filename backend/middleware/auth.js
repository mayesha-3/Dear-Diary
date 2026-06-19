import { auth } from '../config/firebase.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Unauthorized. Missing or invalid Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    // Attach user details to the request object
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };
    next();
  } catch (err) {
    console.error('Firebase Auth Verification Error:', err.message);
    return res.status(401).json({
      message: 'Unauthorized. Invalid or expired authentication token.',
      code: 'auth/invalid-token',
    });
  }
};
