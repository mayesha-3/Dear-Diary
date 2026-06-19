import express from 'express';
import { db } from '../config/firebase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Protect all entry routes with Firebase Authentication
router.use(requireAuth);

// Strip HTML tags down to plain text for list-page excerpts.
function htmlToExcerpt(html, maxLen = 180) {
  if (!html) return '';
  const text = String(html)
    .replace(/<[^>]*>/g, ' ') // remove tags
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text;
}

// Helper to convert Firestore dates to ISO strings
function formatFirestoreDoc(doc) {
  const data = doc.data();
  return {
    _id: doc.id,
    ...data,
    entryDate: data.entryDate?.toDate ? data.entryDate.toDate().toISOString() : data.entryDate,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  };
}

// -------------------------------------------
// GET /api/entries
// "Past Entries" page data: a paginated list
// -------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    // Fetch all entries for this user.
    // We sort/filter in JS to avoid requiring the user to set up composite indexes.
    const snapshot = await db.collection('entries')
      .where('user', '==', req.user.id)
      .get();

    let entries = [];
    snapshot.forEach(doc => {
      entries.push(formatFirestoreDoc(doc));
    });

    // Sort by entryDate descending
    entries.sort((a, b) => {
      const dateA = new Date(a.entryDate || 0);
      const dateB = new Date(b.entryDate || 0);
      return dateB - dateA;
    });

    // Apply search filter if present
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      entries = entries.filter(entry => 
        searchRegex.test(entry.title || '') || searchRegex.test(entry.excerpt || '')
      );
    }

    const total = entries.length;
    const paginatedEntries = entries.slice(skip, skip + limit);

    // Frontend expects only specific fields for the list view to reduce bandwidth
    const listEntries = paginatedEntries.map(e => ({
      _id: e._id,
      title: e.title,
      excerpt: e.excerpt,
      entryDate: e.entryDate,
      picOfTheDay: e.picOfTheDay,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return res.json({
      entries: listEntries,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('GET /api/entries failed:', err);
    return res.status(500).json({ message: 'Could not load entries.' });
  }
});

// -------------------------------------------
// GET /api/entries/pic-of-the-day
// Returns the most recent entry with
// "pic of the day" enabled
// -------------------------------------------
router.get('/pic-of-the-day', async (req, res) => {
  try {
    const snapshot = await db.collection('entries')
      .where('user', '==', req.user.id)
      .where('picOfTheDay.enabled', '==', true)
      .get();

    let entries = [];
    snapshot.forEach(doc => {
      const data = formatFirestoreDoc(doc);
      if (data.picOfTheDay?.imageUrl) {
        entries.push(data);
      }
    });

    if (entries.length === 0) {
      return res.json({ picOfTheDay: null });
    }

    // Sort by entryDate descending
    entries.sort((a, b) => {
      const dateA = new Date(a.entryDate || 0);
      const dateB = new Date(b.entryDate || 0);
      return dateB - dateA;
    });

    const entry = entries[0];

    return res.json({
      picOfTheDay: {
        imageUrl: entry.picOfTheDay.imageUrl,
        entryId: entry._id,
        entryTitle: entry.title,
        entryDate: entry.entryDate,
      },
    });
  } catch (err) {
    console.error('GET /api/entries/pic-of-the-day failed:', err);
    return res.status(500).json({ message: 'Could not load pic of the day.' });
  }
});

// -------------------------------------------
// GET /api/entries/:id
// Fetch a single entry by ID
// -------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('entries').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    const entry = formatFirestoreDoc(doc);

    if (entry.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this entry.' });
    }

    return res.json({ entry });
  } catch (err) {
    console.error('GET /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not load entry.' });
  }
});

// -------------------------------------------
// POST /api/entries
// Create a new entry
// -------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { title, content, excerpt, entryDate, stickers, picOfTheDay } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const parsedEntryDate = entryDate ? new Date(entryDate) : new Date();

    const entryData = {
      user: req.user.id,
      title,
      content,
      excerpt: excerpt || htmlToExcerpt(content),
      entryDate: parsedEntryDate,
      stickers: stickers || [],
      picOfTheDay: picOfTheDay || { imageUrl: null, enabled: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('entries').add(entryData);
    
    // Construct return object
    const createdEntry = {
      _id: docRef.id,
      ...entryData,
      entryDate: parsedEntryDate.toISOString(),
      createdAt: entryData.createdAt.toISOString(),
      updatedAt: entryData.updatedAt.toISOString(),
    };

    return res.status(201).json({
      message: 'Entry created successfully.',
      entryId: docRef.id,
      entry: createdEntry,
    });
  } catch (err) {
    console.error('POST /api/entries failed:', err);
    return res.status(500).json({ message: 'Could not create entry.' });
  }
});

// -------------------------------------------
// PUT /api/entries/:id
// Update an entry
// -------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { title, content, excerpt, entryDate, stickers, picOfTheDay } = req.body;

    const docRef = db.collection('entries').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    const entry = formatFirestoreDoc(doc);

    if (entry.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this entry.' });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) {
      updateData.content = content;
      updateData.excerpt = excerpt || htmlToExcerpt(content);
    }
    if (entryDate !== undefined) updateData.entryDate = new Date(entryDate);
    if (stickers !== undefined) updateData.stickers = stickers;
    if (picOfTheDay !== undefined) updateData.picOfTheDay = picOfTheDay;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();

    return res.json({ 
      message: 'Entry updated.', 
      entry: formatFirestoreDoc(updatedDoc) 
    });
  } catch (err) {
    console.error('PUT /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not update entry.' });
  }
});

// -------------------------------------------
// DELETE /api/entries/:id
// Delete an entry
// -------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('entries').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    const entry = formatFirestoreDoc(doc);

    if (entry.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this entry.' });
    }

    await docRef.delete();

    return res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('DELETE /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not delete entry.' });
  }
});

export default router;
