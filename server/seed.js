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

    // 2. Seed Playlists
    const playlists = [
      { id: 'pl_os_1', title: 'Operating System Full Course - Concepts & Solutions', subject: 'Operating System', year: '2nd Year', video_count: 45, youtube_url: 'PLxCzCOWd7aiGz9donHRrE9I3Mwn6X58XM', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_tafl_1', title: 'Theory of Automata & Formal Languages (TAFL) Full Course', subject: 'TAFL', year: '2nd Year', video_count: 50, youtube_url: 'PLxCzCOWd7aiFM9MoE5283EMx9A57gCZ-u', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_java_1', title: 'JAVA Programming & OOP Concepts (AKTU Syllabus)', subject: 'JAVA', year: '2nd Year', video_count: 38, youtube_url: 'PLBlnK6fEyqRjKA_NuK9mHmlk0dZzuP1P5', thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_dstl_1', title: 'Discrete Structures & Theory of Logic (DSTL) AKTU', subject: 'DSTL', year: '2nd Year', video_count: 42, youtube_url: 'PLxCzCOWd7aiH2wduVbmM0L81i-Z755f1a', thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_ds_1', title: 'Data Structures & Algorithms (DS) AKTU Complete Course', subject: 'Data Structure', year: '2nd Year', video_count: 60, youtube_url: 'PLxCzCOWd7aiEep5E2Cg-Z7E78eHw9C78L', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_phy_1', title: 'Engineering Physics Full Course - AKTU 1st Year', subject: 'Engineering Physics', year: '1st Year', video_count: 35, youtube_url: 'PLxCzCOWd7aiF8HkYJk_5qQ10h3lZ9y0W4', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_math4_1', title: 'Maths IV (Engineering Mathematics 4) AKTU Full Course', subject: 'Math IV', year: '2nd Year', video_count: 40, youtube_url: 'PLxCzCOWd7aiEca6I1g69xTng91_knhL-d', thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
      { id: 'pl_coa_1', title: 'Computer Organization & Architecture (COA) AKTU Full Course', subject: 'Computer Organization & Architecture', year: '2nd Year', video_count: 48, youtube_url: 'PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80' }
    ];

    for (const pl of playlists) {
      await db.query(
        `INSERT INTO playlists (id, title, subject, year, video_count, youtube_url, thumbnail)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, youtube_url = EXCLUDED.youtube_url`,
        [pl.id, pl.title, pl.subject, pl.year, pl.video_count, pl.youtube_url, pl.thumbnail]
      );
    }
    console.log('✅ Playlists Seeded');

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
    console.log('✅ Bundles Seeded');

    // 4. Seed Notes
    const notes = [
      {
        id: 'note_os_unit1',
        title: 'Operating System Complete Handwritten Master Notes & Solved PYQs',
        subject: 'Operating System',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_OS_Sample_Preview/preview',
        description: 'Complete syllabus handwritten notes covering Process Scheduling, Deadlocks, Memory Management, Paging, and Solved AKTU PYQs.'
      },
      {
        id: 'note_tafl_unit1',
        title: 'Theory of Automata & Formal Languages (TAFL) Exam Notes',
        subject: 'TAFL',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_TAFL_Sample_Preview/preview',
        description: 'DFA, NFA, Regular Expressions, Context Free Grammars, Pushdown Automata, Turing Machine & AKTU Solved Questions.'
      },
      {
        id: 'note_java_unit1',
        title: 'JAVA Programming & OOPs Concepts Master Notes',
        subject: 'JAVA',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_JAVA_Sample_Preview/preview',
        description: 'Complete Java Fundamentals, Inheritance, Polymorphism, Exception Handling, Multithreading, Collection Framework & Code Examples.'
      },
      {
        id: 'note_dstl_unit1',
        title: 'Discrete Structures & Theory of Logic (DSTL) Master Notes',
        subject: 'DSTL',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_DSTL_Sample_Preview/preview',
        description: 'Set Theory, Relations, Functions, Propositional Logic, Algebraic Structures, Lattices, Boolean Algebra & Graph Theory.'
      },
      {
        id: 'note_ds_unit1',
        title: 'Data Structures & Algorithms (DS) AKTU Complete Notes',
        subject: 'Data Structure',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_DS_Sample_Preview/preview',
        description: 'Arrays, Stacks, Queues, Linked Lists, Trees (AVL, B-Tree), Graphs, Sorting & Searching Algorithms with C Code.'
      },
      {
        id: 'note_phy_unit1',
        title: 'Engineering Physics 1st Year Complete Syllabus Notes',
        subject: 'Engineering Physics',
        branch: 'Common (All Branches)',
        year: '1st Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_PHY_Sample_Preview/preview',
        description: 'Relativistic Mechanics, Electromagnetic Field Theory, Quantum Mechanics, Wave Optics & Fiber Optics Complete Syllabus Notes.'
      },
      {
        id: 'note_math4_unit1',
        title: 'Maths IV (Engineering Mathematics 4) Solved PYQs & Notes',
        subject: 'Math IV',
        branch: 'CSE/IT/ECE',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_MATH4_Sample_Preview/preview',
        description: 'Partial Differential Equations, Complex Analysis, Probability & Statistics, Numerical Techniques with Solved Numerical Problems.'
      },
      {
        id: 'note_coa_unit1',
        title: 'Computer Organization & Architecture (COA) Master Notes',
        subject: 'Computer Organization & Architecture',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_COA_Sample_Preview/preview',
        description: 'Functional Units, Register Transfer Language, Microprogrammed Control, Memory Hierarchy, Pipelining & Cache Memory.'
      },
      {
        id: 'note_cyber_unit1',
        title: 'Cyber Security & Information Assurance Complete Notes',
        subject: 'Cyber Security',
        branch: 'CSE/IT',
        year: '2nd Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_CYBER_Sample_Preview/preview',
        description: 'Cyber Attacks, Cryptography, IT Act 2000, Network Security, Digital Forensics & Web Vulnerability Assessment Notes.'
      },
      {
        id: 'note_py_unit1',
        title: 'Python Programming Complete Handwritten Notes',
        subject: 'Python Programming',
        branch: 'Common (All Branches)',
        year: '1st Year',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80',
        pdf_url: 'https://drive.google.com/file/d/1_PY_Sample_Preview/preview',
        description: 'Python Basics, Control Flow, Functions, Modules, File I/O, OOP in Python, NumPy & Pandas Basics with Hands-on Examples.'
      }
    ];

    for (const n of notes) {
      await db.query(
        `INSERT INTO notes (id, title, subject, branch, year, price, thumbnail, pdf_url, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, pdf_url = EXCLUDED.pdf_url`,
        [n.id, n.title, n.subject, n.branch, n.year, n.price, n.thumbnail, n.pdf_url, n.description]
      );
    }
    console.log('✅ Subject Notes Seeded');

    console.log('🎉 DB Seeding Finished Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seed();
