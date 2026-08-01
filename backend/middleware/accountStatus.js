import User from '../models/User.js';

// Check account status for the authenticated user
export async function accountStatus(req, res, next) {
  try {
    if (!req.user || !req.user.id) return next();

    const user = await User.findOne({ firebaseUid: req.user.id }).lean();
    if (!user) return next();

    if (user.restricted) {
      return res.status(403).json({
        code: 'account_restricted',
        message: 'Your account has been restricted. Please email redreaster@gmail.com',
      });
    }

    // If warned, attach headers so frontend can show a banner
    if (user.warned) {
      res.setHeader('X-Account-Warned', 'true');
      res.setHeader('X-Account-Warned-Message', 'Your account is violating our rules. Please contact redreaster@gmail.com');
    }

    next();
  } catch (err) {
    console.error('accountStatus middleware error:', err);
    next();
  }
}

// Endpoint helper to return status for current user
export async function getAccountStatus(req, res) {
  try {
    if (!req.user || !req.user.id) return res.status(200).json({ restricted: false, warned: false });
    const user = await User.findOne({ firebaseUid: req.user.id }).lean();
    if (!user) return res.status(200).json({ restricted: false, warned: false });
    return res.json({ restricted: !!user.restricted, warned: !!user.warned });
  } catch (err) {
    console.error('getAccountStatus failed:', err);
    return res.status(500).json({ message: 'Could not determine account status.' });
  }
}

// Upsert a user record from the authenticated token
export async function upsertUser(req, res) {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });

    const uid = req.user.id;
    const email = req.user.email || '';
    const displayName = req.user.name || '';
    const photoUrl = req.user.picture || '';

    const updated = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { email, displayName, photoUrl }, $setOnInsert: { firebaseUid: uid } },
      { upsert: true, new: true }
    ).lean();

    return res.json({ message: 'OK', user: { firebaseUid: updated.firebaseUid, email: updated.email, displayName: updated.displayName, restricted: !!updated.restricted, warned: !!updated.warned } });
  } catch (err) {
    console.error('upsertUser failed:', err);
    return res.status(500).json({ message: 'Could not upsert user.' });
  }
}
