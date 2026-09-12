const db = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('🌱 Seeding Bitwise Learning Database...');

    // 1. Seed Admin Profile
    const adminEmail = 'bitwiselearning0@gmail.com';
    const adminExist = await db.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [adminEmail]);

    if (adminExist.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin@bitwise2026', salt);
      await db.query(
        `INSERT INTO profiles (id, name, email, phone, role, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin_bitwise', 'Bitwise Admin', adminEmail, '9999999999', 'admin', hash]
      );
      console.log('✅ Admin Profile Seeded: bitwiselearning0@gmail.com');
    }

    // 2. Purge dummy seed playlists (Admin has total control over playlists)
    await db.query(`DELETE FROM playlists WHERE id LIKE 'pl_%' OR thumbnail LIKE '%unsplash%'`).catch(() => {});
    console.log('✅ Dummy seed playlists purged successfully!');

    // 3. Seed Bundles
    const bundles = [
      {
        id: 'bundle_sem4_combo',
        title: 'B.TECH SEMESTER 4 COMPLETE COMBO BUNDLE',
        description: 'Complete Semester 4 combo including all subjects with syllabus-based notes and solved PYQs.',
        price: 299,
        original_price: 499,
        year: '2nd Year',
        subject: 'Semester 4 Combo',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'bundle_sem3_combo',
        title: 'B.TECH SEMESTER 3 COMPLETE COMBO BUNDLE',
        description: 'Complete Semester 3 combo including all subjects with syllabus-based notes and solved PYQs.',
        price: 299,
        original_price: 499,
        year: '2nd Year',
        subject: 'Semester 3 Combo',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'
      }
    ];

    for (const b of bundles) {
      await db.query(
        `INSERT INTO bundles (id, title, description, price, original_price, year, subject, thumbnail)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, price = EXCLUDED.price`,
        [b.id, b.title, b.description, b.price, b.original_price, b.year, b.subject, b.thumbnail]
      );
    }
    await db.query(`
      UPDATE bundles SET semester = 3 WHERE title ILIKE '%semester 3%' OR title ILIKE '%sem 3%' OR title ILIKE '%cobo 3%' OR title ILIKE '%combo 3%';
      UPDATE bundles SET semester = 4 WHERE title ILIKE '%semester 4%' OR title ILIKE '%sem 4%' OR title ILIKE '%cobo 4%' OR title ILIKE '%combo 4%';
      UPDATE bundles SET description = REPLACE(description, '<!--TYPE:subject-->', '') WHERE title ILIKE '%combo%' OR title ILIKE '%semester%';
    `);
    console.log('✅ Bundles Seeded & Types/Semesters Fixed');

    // 4. Purge dummy seed notes
    await db.query(`
      DELETE FROM purchases WHERE item_id IN ('note_py_unit1', 'note_coa_unit1', 'note_phy_unit1', 'note_math4_unit1', 'note_cyber_unit1', 'note_ds_unit1', 'note_java_unit1', 'note_os_unit1', 'note_dstl_unit1', 'note_tafl_unit1_dummy');
      DELETE FROM notes WHERE id IN ('note_py_unit1', 'note_coa_unit1', 'note_phy_unit1', 'note_math4_unit1', 'note_cyber_unit1', 'note_ds_unit1', 'note_java_unit1', 'note_os_unit1', 'note_dstl_unit1') 
         OR pdf_url IS NULL OR pdf_url = '' OR pdf_url ILIKE '%drive.google.com%' OR pdf_url ILIKE '%sample%';
    `).catch(() => {});
    console.log('✅ Dummy seed notes purged');

    console.log('🎉 DB Seeding Finished Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seed();
