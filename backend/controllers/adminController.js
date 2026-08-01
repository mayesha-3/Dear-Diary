import User from '../models/User.js';
import Entry from '../models/Entry.js';
import { admin } from '../config/firebase.js';

const ADMIN_EMAIL = 'redreaster@gmail.com';

function isAdmin(req) {
  return req.user && req.user.email === ADMIN_EMAIL;
}

export async function listUsers(req, res) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });

    // Get users and entry counts
    const users = await User.find({}, { firebaseUid: 1, email: 1, displayName: 1, restricted: 1, warned:1 }).lean();

    // Fetch counts in bulk
    const counts = await Entry.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});

    const rows = users.map(u => ({
      firebaseUid: u.firebaseUid,
      email: u.email,
      displayName: u.displayName,
      entryCount: countMap[u.firebaseUid] || 0,
      restricted: !!u.restricted,
      warned: !!u.warned,
    }));

    return res.json({ users: rows });
  } catch (err) {
    console.error('listUsers failed:', err);
    return res.status(500).json({ message: 'Could not list users.' });
  }
}

export async function setRestrict(req, res) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    const { uid } = req.params;
    const { restricted } = req.body;
    if (typeof restricted !== 'boolean') return res.status(400).json({ message: 'restricted must be boolean' });

    const user = await User.findOneAndUpdate({ firebaseUid: uid }, { $set: { restricted } }, { new: true, upsert: false }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'OK', restricted: !!user.restricted });
  } catch (err) {
    console.error('setRestrict failed:', err);
    return res.status(500).json({ message: 'Could not update restriction.' });
  }
}

export async function setWarn(req, res) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    const { uid } = req.params;
    const { warned } = req.body;
    if (typeof warned !== 'boolean') return res.status(400).json({ message: 'warned must be boolean' });

    const user = await User.findOneAndUpdate({ firebaseUid: uid }, { $set: { warned } }, { new: true, upsert: false }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'OK', warned: !!user.warned });
  } catch (err) {
    console.error('setWarn failed:', err);
    return res.status(500).json({ message: 'Could not update warning.' });
  }
}

// Import all Firebase-auth users into the local Users collection (admin-only)
export async function importFirebaseUsers(req, res) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });

    let nextPageToken = undefined;
    let imported = 0;

    do {
      const list = await admin.auth().listUsers(1000, nextPageToken);
      for (const u of list.users) {
        const uid = u.uid;
        const email = u.email || '';
        const displayName = u.displayName || '';
        const photoUrl = u.photoURL || '';

        const updated = await User.findOneAndUpdate(
          { firebaseUid: uid },
          { $set: { email, displayName, photoUrl }, $setOnInsert: { firebaseUid: uid } },
          { upsert: true, new: true }
        ).lean();

        if (updated) imported += 1;
      }
      nextPageToken = list.pageToken;
    } while (nextPageToken);

    return res.json({ message: 'Imported', imported });
  } catch (err) {
    console.error('importFirebaseUsers failed:', err);
    return res.status(500).json({ message: 'Could not import users.' });
  }
}
