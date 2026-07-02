// backend/controllers/entryController.js
import Entry from '../models/Entry.js';

// Strip HTML to plain text for list previews
function htmlToExcerpt(html, maxLen = 180) {
  if (!html) return '';
  const text = String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text;
}

// -----------------------------------------------
// GET /api/entries
// Paginated list with optional search query
// -----------------------------------------------
export async function getEntries(req, res) {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 500);
    const skip  = (page - 1) * limit;

    const filter = { user: req.user.id };

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [entries, total] = await Promise.all([
      Entry.find(filter, {
        // Return only list-view fields to reduce payload
        title: 1,
        excerpt: 1,
        entryDate: 1,
        picOfTheDay: 1,
        createdAt: 1,
        updatedAt: 1,
      })
        .sort({ entryDate: -1 })
        .skip(skip)
        .limit(limit)
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
}

// -----------------------------------------------
// GET /api/entries/pic-of-the-day
// Most recent entry that has picOfTheDay enabled
// -----------------------------------------------
export async function getPicOfTheDay(req, res) {
  try {
    const entry = await Entry.findOne(
      { user: req.user.id, 'picOfTheDay.enabled': true, 'picOfTheDay.imageUrl': { $ne: null } },
      { title: 1, entryDate: 1, picOfTheDay: 1 }
    )
      .sort({ entryDate: -1 })
      .lean();

    if (!entry) {
      return res.json({ picOfTheDay: null });
    }

    return res.json({
      picOfTheDay: {
        imageUrl:   entry.picOfTheDay.imageUrl,
        entryId:    entry._id,
        entryTitle: entry.title,
        entryDate:  entry.entryDate,
      },
    });
  } catch (err) {
    console.error('GET /api/entries/pic-of-the-day failed:', err);
    return res.status(500).json({ message: 'Could not load pic of the day.' });
  }
}

// -----------------------------------------------
// GET /api/entries/:id
// -----------------------------------------------
export async function getEntry(req, res) {
  try {
    const entry = await Entry.findById(req.params.id).lean();

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }
    if (entry.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    return res.json({ entry });
  } catch (err) {
    console.error('GET /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not load entry.' });
  }
}

// -----------------------------------------------
// POST /api/entries
// -----------------------------------------------
export async function createEntry(req, res) {
  try {
    const { title, content, excerpt, entryDate, stickers, picOfTheDay } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const entry = await Entry.create({
      user:       req.user.id,
      title,
      content,
      excerpt:    excerpt || htmlToExcerpt(content),
      entryDate:  entryDate ? new Date(entryDate) : new Date(),
      stickers:   stickers   || [],
      picOfTheDay: picOfTheDay || { imageUrl: null, enabled: false },
    });

    return res.status(201).json({
      message: 'Entry created successfully.',
      entryId: entry._id,
      entry,
    });
  } catch (err) {
    console.error('POST /api/entries failed:', err);
    return res.status(500).json({ message: 'Could not create entry.' });
  }
}

// -----------------------------------------------
// PUT /api/entries/:id
// -----------------------------------------------
export async function updateEntry(req, res) {
  try {
    const entry = await Entry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }
    if (entry.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const { title, content, excerpt, entryDate, stickers, picOfTheDay } = req.body;

    if (title      !== undefined) entry.title      = title;
    if (entryDate  !== undefined) entry.entryDate  = new Date(entryDate);
    if (stickers   !== undefined) entry.stickers   = stickers;
    if (picOfTheDay !== undefined) entry.picOfTheDay = picOfTheDay;
    if (content !== undefined) {
      entry.content = content;
      entry.excerpt = excerpt || htmlToExcerpt(content);
    }

    await entry.save();

    return res.json({ message: 'Entry updated.', entry });
  } catch (err) {
    console.error('PUT /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not update entry.' });
  }
}

// -----------------------------------------------
// DELETE /api/entries/:id
// -----------------------------------------------
export async function deleteEntry(req, res) {
  try {
    const entry = await Entry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }
    if (entry.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    await entry.deleteOne();

    return res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('DELETE /api/entries/:id failed:', err);
    return res.status(500).json({ message: 'Could not delete entry.' });
  }
}
