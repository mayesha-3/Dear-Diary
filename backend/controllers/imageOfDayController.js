// backend/controllers/imageOfDayController.js
import ImageOfDay from '../models/ImageOfDay.js';

// Normalise any date string / Date object to midnight UTC for that calendar date
function toDateOnly(d) {
  const date = d ? new Date(d) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// -----------------------------------------------
// GET /api/image-of-day
// Returns the image for a specific date.
// Query param: ?date=YYYY-MM-DD (defaults to today)
// -----------------------------------------------
export async function getImageOfDay(req, res) {
  try {
    const date = toDateOnly(req.query.date);

    const record = await ImageOfDay.findOne({ user: req.user.id, date }).lean();

    if (!record) {
      return res.json({ imageOfDay: null });
    }

    return res.json({ imageOfDay: record });
  } catch (err) {
    console.error('GET /api/image-of-day failed:', err);
    return res.status(500).json({ message: 'Could not load image of the day.' });
  }
}

// -----------------------------------------------
// GET /api/image-of-day/all
// Returns all image-of-day entries for this user
// (sorted newest first, max 365 records)
// -----------------------------------------------
export async function getAllImagesOfDay(req, res) {
  try {
    const records = await ImageOfDay.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(365)
      .lean();

    return res.json({ images: records });
  } catch (err) {
    console.error('GET /api/image-of-day/all failed:', err);
    return res.status(500).json({ message: 'Could not load images.' });
  }
}

// -----------------------------------------------
// PUT /api/image-of-day
// Create or update the image for a given date.
// Body: { imageUrl, caption?, filename?, date? }
// -----------------------------------------------
export async function setImageOfDay(req, res) {
  try {
    const { imageUrl, caption, filename, date } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required.' });
    }

    const normalizedDate = toDateOnly(date);

    // upsert — one record per user per date
    const record = await ImageOfDay.findOneAndUpdate(
      { user: req.user.id, date: normalizedDate },
      {
        $set: {
          imageUrl,
          caption:  caption  || '',
          filename: filename || '',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({ message: 'Image of the day saved.', imageOfDay: record });
  } catch (err) {
    console.error('PUT /api/image-of-day failed:', err);
    return res.status(500).json({ message: 'Could not save image of the day.' });
  }
}

// -----------------------------------------------
// DELETE /api/image-of-day
// Remove the image for a specific date.
// Query param: ?date=YYYY-MM-DD (defaults to today)
// -----------------------------------------------
export async function deleteImageOfDay(req, res) {
  try {
    const date = toDateOnly(req.query.date);

    const result = await ImageOfDay.findOneAndDelete({ user: req.user.id, date });

    if (!result) {
      return res.status(404).json({ message: 'No image found for that date.' });
    }

    return res.json({ message: 'Image of the day removed.' });
  } catch (err) {
    console.error('DELETE /api/image-of-day failed:', err);
    return res.status(500).json({ message: 'Could not delete image of the day.' });
  }
}
