// backend/controllers/stickerController.js
import Sticker from '../models/Sticker.js';

// -----------------------------------------------
// GET /api/stickers
// Returns user's full sticker library (newest first)
// -----------------------------------------------
export async function getStickers(req, res) {
  try {
    const stickers = await Sticker.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ stickers });
  } catch (err) {
    console.error('GET /api/stickers failed:', err);
    return res.status(500).json({ message: 'Could not load sticker library.' });
  }
}

// -----------------------------------------------
// POST /api/stickers
// Add a sticker to the user's library
// Body: { imageUrl, filename?, label?, tags? }
// -----------------------------------------------
export async function addSticker(req, res) {
  try {
    const { imageUrl, filename, label, tags } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required.' });
    }

    const sticker = await Sticker.create({
      user:     req.user.id,
      imageUrl,
      filename: filename || '',
      label:    label    || '',
      tags:     Array.isArray(tags) ? tags : [],
    });

    return res.status(201).json({ message: 'Sticker added.', sticker });
  } catch (err) {
    console.error('POST /api/stickers failed:', err);
    return res.status(500).json({ message: 'Could not add sticker.' });
  }
}

// -----------------------------------------------
// PATCH /api/stickers/:id
// Update a sticker's label or tags
// -----------------------------------------------
export async function updateSticker(req, res) {
  try {
    const sticker = await Sticker.findById(req.params.id);

    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found.' });
    }
    if (sticker.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const { label, tags } = req.body;
    if (label !== undefined) sticker.label = label;
    if (tags  !== undefined) sticker.tags  = Array.isArray(tags) ? tags : [];

    await sticker.save();

    return res.json({ message: 'Sticker updated.', sticker });
  } catch (err) {
    console.error('PATCH /api/stickers/:id failed:', err);
    return res.status(500).json({ message: 'Could not update sticker.' });
  }
}

// -----------------------------------------------
// DELETE /api/stickers/:id
// Remove a sticker from the library
// -----------------------------------------------
export async function deleteSticker(req, res) {
  try {
    const sticker = await Sticker.findById(req.params.id);

    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found.' });
    }
    if (sticker.user !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    await sticker.deleteOne();

    return res.json({ message: 'Sticker deleted.' });
  } catch (err) {
    console.error('DELETE /api/stickers/:id failed:', err);
    return res.status(500).json({ message: 'Could not delete sticker.' });
  }
}
