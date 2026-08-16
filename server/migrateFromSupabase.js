const db = require('./db');

const SUPABASE_KEY = 'sb_publishable_T_NLVZYhGMxVuELQNEgtGQ_zBgeBMHl';
const SUPABASE_URL = 'https://zczomcghyktsaimwhwxp.supabase.co/rest/v1';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

const migrate = async () => {
  try {
    console.log('🚀 Starting Automatic Supabase to VPS Data Migration...');

    // 1. Migrate All Notes (34 Real PDF Notes)
    const notesRes = await fetch(`${SUPABASE_URL}/notes?select=*`, { headers });
    if (notesRes.ok) {
      const notes = await notesRes.json();
      console.log(`📦 Found ${notes.length} Real Notes on Supabase. Importing...`);

      for (const n of notes) {
        await db.query(`
          ALTER TABLE notes ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1;
          ALTER TABLE notes ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) DEFAULT 0;
          ALTER TABLE notes ADD COLUMN IF NOT EXISTS preview_url TEXT;
          ALTER TABLE notes ADD COLUMN IF NOT EXISTS pages_count INTEGER DEFAULT 0;
          ALTER TABLE notes ADD COLUMN IF NOT EXISTS topics TEXT;
          ALTER TABLE notes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'notes';
        `).catch(() => {});

        const pdfUrl = n.previewUrl || n.pdf_url || n.preview_url || '';
        const topicsStr = Array.isArray(n.topics) ? JSON.stringify(n.topics) : (n.topics || '');

        await db.query(
          `INSERT INTO notes (id, title, subject, branch, year, semester, price, original_price, description, pdf_url, preview_url, pages_count, topics, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET 
             title = EXCLUDED.title,
             subject = EXCLUDED.subject,
             branch = EXCLUDED.branch,
             year = EXCLUDED.year,
             semester = EXCLUDED.semester,
             price = EXCLUDED.price,
             original_price = EXCLUDED.original_price,
             description = EXCLUDED.description,
             pdf_url = EXCLUDED.pdf_url,
             preview_url = EXCLUDED.preview_url,
             pages_count = EXCLUDED.pages_count,
             topics = EXCLUDED.topics,
             type = EXCLUDED.type`,
          [
            n.id,
            n.title,
            n.subject,
            n.branch || 'CSE/IT',
            n.year || '1st Year',
            Number(n.semester || 1),
            Number(n.price || 19),
            Number(n.originalPrice || n.original_price || 21),
            n.description || '',
            pdfUrl,
            Number(n.pagesCount || n.pages_count || 50),
            topicsStr,
            n.type || 'notes'
          ]
        );
      }
      console.log(`✅ Successfully Migrated ${notes.length} Real Notes!`);
    }

    // 2. Migrate All Bundles
    const bundlesRes = await fetch(`${SUPABASE_URL}/bundles?select=*`, { headers });
    if (bundlesRes.ok) {
      const bundles = await bundlesRes.json();
      console.log(`📦 Found ${bundles.length} Bundles on Supabase. Importing...`);

      for (const b of bundles) {
        const nIds = b.notesIds || b.note_ids || [];
        await db.query(
          `INSERT INTO bundles (id, title, description, price, original_price, year, subject, note_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             original_price = EXCLUDED.original_price,
             year = EXCLUDED.year,
             subject = EXCLUDED.subject,
             note_ids = EXCLUDED.note_ids`,
          [
            b.id,
            b.title,
            b.description || '',
            Number(b.price || 299),
            Number(b.originalPrice || b.original_price || 499),
            b.year || '2nd Year',
            b.subject || '',
            nIds
          ]
        );
      }
      console.log(`✅ Successfully Migrated ${bundles.length} Bundles!`);
    }

    // 3. Migrate All Playlists
    const playlistsRes = await fetch(`${SUPABASE_URL}/playlists?select=*`, { headers });
    if (playlistsRes.ok) {
      const playlists = await playlistsRes.json();
      console.log(`📦 Found ${playlists.length} Playlists on Supabase. Importing...`);

      for (const pl of playlists) {
        const yUrl = pl.youtubeUrl || pl.youtube_url || pl.playlistId || '';
        const thumb = pl.thumbnailUrl || pl.thumbnail || '';
        await db.query(
          `INSERT INTO playlists (id, title, subject, year, video_count, youtube_url, thumbnail)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             subject = EXCLUDED.subject,
             year = EXCLUDED.year,
             youtube_url = EXCLUDED.youtube_url,
             thumbnail = EXCLUDED.thumbnail`,
          [
            pl.id,
            pl.title,
            pl.subject,
            pl.year || '1st Year',
            Number(pl.videoCount || pl.video_count || 0),
            yUrl,
            thumb
          ]
        );
      }
      console.log(`✅ Successfully Migrated ${playlists.length} Playlists!`);
    }

    console.log('🎉 ALL SUPABASE DATA MIGRATED TO VPS POSTGRESQL SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Migration Exception:', err);
    process.exit(1);
  }
};

migrate();
