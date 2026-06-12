import express from 'express';
import Entry from '../models/Entry.js';

const router = express.Router();

// FOR DEVELOPMENT: Mock user middleware (since no auth yet)
// In production, replace this with your real auth middleware
router.use((req, res, next) => {
  // Use a fixed user ID for now, or get it from auth token
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock user ID
  next();
});

// Strip HTML tags down to plain text for list-page excerpts.
function htmlToExcerpt(html, maxLen = 180) {
  const text = String(html)
    .replace(/<[^>]*>/g, ' ') // remove tags
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text;
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

    const filter = { user: req.user.id };
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { excerpt: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [entries, total] = await Promise.all([
      Entry.find(filter)
        .sort({ entryDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('title excerpt entryDate picOfTheDay createdAt updatedAt')
        .lean(),
      Entry.countDocuments(filter),
    ]);

    return res.json({
      entries,
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
    const entry = await Entry.findOne({
      user: req.user.id,
      'picOfTheDay.enabled': true,
      'picOfTheDay.imageUrl': { $ne: null },
    })
      .sort({ entryDate: -1 })
      .select('title entryDate picOfTheDay _id')
      .lean();

    if (!entry) {
      return res.json({ picOfTheDay: null });
    }

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
    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
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

    const entry = new Entry({
      user: req.user.id,
      title,
      content,
      excerpt: excerpt || htmlToExcerpt(content),
      entryDate: entryDate || new Date(),
      stickers: stickers || [],
      picOfTheDay: picOfTheDay || { imageUrl: null, enabled: false },
    });

    await entry.save();

    return res.status(201).json({
      message: 'Entry created successfully.',
      entryId: entry._id,
      entry,
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

    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    if (title) entry.title = title;
    if (content) entry.content = content;
    if (excerpt) entry.excerpt = excerpt;
    if (entryDate) entry.entryDate = entryDate;
    if (stickers) entry.stickers = stickers;
    if (picOfTheDay) entry.picOfTheDay = picOfTheDay;

    await entry.save();

    return res.json({ message: 'Entry updated.', entry });
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
    const entry = await Entry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    return res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('DELETE /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not delete entry.' });
  }
});

export default router;
