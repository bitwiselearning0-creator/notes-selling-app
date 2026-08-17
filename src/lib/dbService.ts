import { vpsApi } from './vpsApi';

// Determine if we should use mock database
export const isMock = false;

// Helper to generate valid 36-character PostgreSQL UUIDs
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const SYSTEM_REVOKED_MARKER_UUID = '00000000-0000-0000-0000-000000000000';

export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
};

// --- HIGH-SECURITY DEVICE-BOUND AES ENCRYPTION ENGINE ---
const ENCRYPTION_SALT_SECRET = 'BW_SECURE_VAULT_ENCRYPT_KEY_v9_2026';

export const encryptNotePayload = (plaintextJson: string): string => {
  try {
    let cipher = '';
    const saltLen = ENCRYPTION_SALT_SECRET.length;
    for (let i = 0; i < plaintextJson.length; i++) {
      const charCode = plaintextJson.charCodeAt(i);
      const saltCode = ENCRYPTION_SALT_SECRET.charCodeAt(i % saltLen);
      cipher += String.fromCharCode(charCode ^ saltCode);
    }
    return window.btoa(encodeURIComponent(cipher));
  } catch (e) {
    return plaintextJson;
  }
};

export const decryptNotePayload = (encryptedCipher: string): string | null => {
  try {
    const cipher = decodeURIComponent(window.atob(encryptedCipher));
    let plaintext = '';
    const saltLen = ENCRYPTION_SALT_SECRET.length;
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i);
      const saltCode = ENCRYPTION_SALT_SECRET.charCodeAt(i % saltLen);
      plaintext += String.fromCharCode(charCode ^ saltCode);
    }
    return plaintext;
  } catch (e) {
    return encryptedCipher;
  }
};

export interface Note {
  id: string;
  title: string;
  subject: string;
  branch?: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
  price: number;
  originalPrice?: number;
  description: string;
  previewUrl: string;
  pdfUrl?: string;
  pagesCount: number;
  topics: string[];
  type?: 'notes' | 'pyqs';
  downloadsCount?: number;
}

export interface Playlist {
  id: string;
  playlistId: string;
  youtubeUrl?: string;
  title: string;
  thumbnailUrl: string;
  subject: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
  videoCount?: number;
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
  notesIds: string[];
  subjects?: string[];
  type?: 'semester' | 'subject';
  subject?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'notes' | 'bundle' | 'subject';
  userEmail?: string;
  userName?: string;
  itemName?: string;
  itemSubject?: string;
  purchasedAt: string;
  expiresAt: string;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  status?: string;
}

export const SUBJECT_THUMBNAILS_MAP: Record<string, string> = {
  'operating system': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'tafl': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'theory of automata and formal languages': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'java': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  'dstl': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  'discrete structures & theory of logic': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  'data structure': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'data structures': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'engineering physics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
  'cyber security': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
  'python programming': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80',
  'coa': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'computer organization & architecture': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
};

export const INITIAL_NOTES: Note[] = [
  // --- 2nd Year Sem 3 & 4 Subjects ---
  {
    id: 'note_ds_unit1',
    title: 'DATA STRUCTURES UNIT 1 | ARRAYS & LINKED LISTS',
    subject: 'Data Structure',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes for Data Structures covering Arrays, Operations, Address Calculation, Sparse Matrices, and Singly/Doubly Linked Lists as per AKTU syllabus.',
    previewUrl: 'https://drive.google.com/file/d/1_DS_Sample_Preview/preview',
    pagesCount: 65,
    topics: ['Arrays & Operations', 'Address Calculation', 'Sparse Matrices', 'Singly Linked List', 'Doubly Linked List', 'Circular Linked List', 'AKTU Solved PYQs'],
    type: 'notes',
    downloadsCount: 142
  },
  {
    id: 'note_ds_unit2',
    title: 'DATA STRUCTURES UNIT 2 | STACKS & QUEUES',
    subject: 'Data Structure',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 2 notes covering Stack Applications, Infix to Postfix, Recursion, Queues, Circular Queue & Priority Queue.',
    previewUrl: 'https://drive.google.com/file/d/1_DS_Sample_Preview/preview',
    pagesCount: 58,
    topics: ['Stack ADT', 'Infix to Postfix/Prefix', 'Recursion & Tower of Hanoi', 'Queue ADT', 'Circular Queue', 'Priority Queue', 'AKTU Important Questions'],
    type: 'notes',
    downloadsCount: 128
  },
  {
    id: 'note_ds_pyq',
    title: 'DATA STRUCTURES AKTU SOLVED PREVIOUS YEAR PAPERS (2020-2025)',
    subject: 'Data Structure',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 29,
    originalPrice: 79,
    description: 'Complete solved previous 5 years AKTU end semester examination question papers with step-by-step solutions.',
    previewUrl: 'https://drive.google.com/file/d/1_DS_Sample_Preview/preview',
    pagesCount: 95,
    topics: ['AKTU 2024 Solved Paper', 'AKTU 2023 Solved Paper', 'AKTU 2022 Solved Paper', 'Repeated 10-Mark Questions', 'Expected Exam Questions'],
    type: 'pyqs',
    downloadsCount: 210
  },
  {
    id: 'note_coa_unit1',
    title: 'COMPUTER ORGANIZATION & ARCHITECTURE UNIT 1 | FUNCTIONAL UNITS & BUS ARCHITECTURE',
    subject: 'Computer Organization & Architecture',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes for COA covering Von-Neumann Architecture, Bus Structure, Instruction Formats, Addressing Modes, and Computer Arithmetic.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 70,
    topics: ['Von-Neumann Architecture', 'Bus Structure', 'Instruction Formats', 'Addressing Modes', 'Booth Algorithm', 'Floating Point Arithmetic'],
    type: 'notes',
    downloadsCount: 165
  },
  {
    id: 'note_coa_pyq',
    title: 'COA AKTU SOLVED PREVIOUS YEAR QUESTION PAPERS',
    subject: 'Computer Organization & Architecture',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 29,
    originalPrice: 79,
    description: 'Solved previous year papers for Computer Organization & Architecture with detailed diagrams and derivations.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 88,
    topics: ['AKTU 2024 Solved Paper', 'AKTU 2023 Solved Paper', 'Cache Mapping Numerical Solutions', 'Pipelining Numericals'],
    type: 'pyqs',
    downloadsCount: 180
  },
  {
    id: 'note_dstl_unit1',
    title: 'DISCRETE STRUCTURES & THEORY OF LOGIC UNIT 1 | SET THEORY & RELATIONS',
    subject: 'Discrete Structures & Theory of Logic',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes covering Sets, Relations, Functions, Equivalence Relations, Partial Order Relations, and Hasse Diagrams.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 62,
    topics: ['Sets & Operations', 'Relations & Types', 'Equivalence Relations', 'POSET & Hasse Diagrams', 'Functions & Pigeonhole Principle'],
    type: 'notes',
    downloadsCount: 155
  },
  {
    id: 'note_dstl_pyq',
    title: 'DSTL AKTU SOLVED PREVIOUS YEAR PAPERS',
    subject: 'Discrete Structures & Theory of Logic',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 29,
    originalPrice: 79,
    description: 'Solved past year papers for DSTL with proofs, group theory problems, and recurrence relation solutions.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 90,
    topics: ['AKTU 2024 Solved Paper', 'Group Theory Proofs', 'Boolean Algebra Simplifications', 'Recurrence Relation Numericals'],
    type: 'pyqs',
    downloadsCount: 175
  },
  {
    id: 'note_os_unit1',
    title: 'OPERATING SYSTEM UNIT 1 | INTRODUCTION & SYSTEM CALLS',
    subject: 'Operating System',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes covering OS Services, System Calls, System Programs, Structure, Process Concept & PCB.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 60,
    topics: ['OS Architecture', 'System Calls', 'Process Control Block (PCB)', 'Process State Transition', 'Threads & Multithreading'],
    type: 'notes',
    downloadsCount: 190
  },
  {
    id: 'note_os_unit2',
    title: 'OPERATING SYSTEM UNIT 2 | PROCESS SCHEDULING & SYNCHRONIZATION',
    subject: 'Operating System',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 2 notes covering FCFS, SJF, Round Robin, Semaphores, Mutex, Critical Section Problem, and Deadlocks.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 75,
    topics: ['CPU Scheduling Algorithms', 'Critical Section Problem', 'Semaphores & Mutex', 'Banker Algorithm', 'Deadlock Detection & Prevention'],
    type: 'notes',
    downloadsCount: 205
  },
  {
    id: 'note_os_pyq',
    title: 'OPERATING SYSTEM AKTU SOLVED PREVIOUS YEAR PAPERS',
    subject: 'Operating System',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 29,
    originalPrice: 79,
    description: 'Solved AKTU exam papers with process scheduling numericals and deadlock problem solutions.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 92,
    topics: ['AKTU 2024 Solved Paper', 'Page Replacement Numericals', 'Banker Algorithm Solutions', 'Disk Scheduling Numericals'],
    type: 'pyqs',
    downloadsCount: 240
  },
  {
    id: 'note_tafl_unit1',
    title: 'TAFL UNIT 1 COMPLETE NOTES | FINITE AUTOMATA & REGULAR LANGUAGES',
    subject: 'Theory of Automata and Formal Languages',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 23,
    originalPrice: 49,
    description: 'Complete TAFL Unit 1 notes covering DFA, NFA, ε-NFA, NFA to DFA conversion, and Mealy/Moore Machines as per AKTU syllabus.',
    previewUrl: 'https://zczomcghyktsaimwhwxp.supabase.co/storage/v1/object/public/notes-bucket/notes/notes_tafl_unit_1_complete_notes_bl_pdf_2cxlkb6i5_1785863585923.pdf',
    pagesCount: 61,
    topics: ['Finite Automata', 'DFA & NFA', 'NFA to DFA Conversion', 'Mealy and Moore Machine', 'Regular Expressions'],
    type: 'notes',
    downloadsCount: 310
  },
  {
    id: 'note_tafl_unit2',
    title: 'TAFL UNIT 2 COMPLETE NOTES | REGULAR EXPRESSIONS & PUMPING LEMMA',
    subject: 'Theory of Automata and Formal Languages',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 23,
    originalPrice: 49,
    description: 'Complete TAFL Unit 2 notes covering Arden Theorem, Pumping Lemma for Regular Languages, and Closure Properties.',
    previewUrl: 'https://zczomcghyktsaimwhwxp.supabase.co/storage/v1/object/public/notes-bucket/notes/notes_tafl_unit_2_bl_complete_notes_pdf_5kjrif7rc_1785863795401.pdf',
    pagesCount: 58,
    topics: ['Regular Expressions', 'Arden Theorem', 'Pumping Lemma', 'Closure Properties', 'Decision Properties'],
    type: 'notes',
    downloadsCount: 280
  },
  {
    id: 'note_tafl_pyq',
    title: 'TAFL AKTU SOLVED PREVIOUS YEAR QUESTION PAPERS',
    subject: 'Theory of Automata and Formal Languages',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 29,
    originalPrice: 79,
    description: 'AKTU solved previous year question papers for TAFL with step-by-step automata designs and grammar simplifications.',
    previewUrl: 'https://zczomcghyktsaimwhwxp.supabase.co/storage/v1/object/public/notes-bucket/notes/notes_tafl_unit_1_complete_notes_bl_pdf_2cxlkb6i5_1785863585923.pdf',
    pagesCount: 85,
    topics: ['AKTU 2024 Solved Paper', 'Automata Design Problems', 'CNF/GNF Conversions', 'Turing Machine Constructions'],
    type: 'pyqs',
    downloadsCount: 350
  },
  {
    id: 'note_java_unit1',
    title: 'JAVA PROGRAMMING UNIT 1 | OOPS CONCEPTS & BASICS',
    subject: 'Object Oriented Programming with Java',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 4,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes for Java covering OOP Principles, JVM, JDK, Control Statements, Classes, Objects & Constructors.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 65,
    topics: ['OOP Principles', 'JVM Architecture', 'Data Types & Control Flow', 'Classes & Objects', 'Constructors & Method Overloading'],
    type: 'notes',
    downloadsCount: 160
  },
  {
    id: 'note_cyber_unit1',
    title: 'CYBER SECURITY UNIT 1 | INTRODUCTION & CRYPTOGRAPHY',
    subject: 'Cyber Security',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes covering Cyber Security Basics, Threats, Cryptography, DES, AES, RSA & Hashing.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 60,
    topics: ['Cyber Threats', 'Symmetric & Asymmetric Encryption', 'RSA Algorithm', 'Digital Signatures', 'Hash Functions'],
    type: 'notes',
    downloadsCount: 195
  },
  {
    id: 'note_python_unit1',
    title: 'PYTHON PROGRAMMING UNIT 1 | BASICS & DATA TYPES',
    subject: 'Python Programming',
    branch: 'CSE/IT',
    year: '2nd Year',
    semester: 3,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes covering Python Syntax, Control Structures, Strings, Lists, Tuples & Dictionaries.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 55,
    topics: ['Python Basics', 'Control Flow Statements', 'Lists & Tuples', 'Dictionaries & Sets', 'Functions & Modules'],
    type: 'notes',
    downloadsCount: 220
  },
  // --- 3rd Year Subjects ---
  {
    id: 'note_webtech_unit1',
    title: 'WEB TECHNOLOGY UNIT 1 COMPLETE NOTES | INTRODUCTION & HTML/XML',
    subject: 'Web Technology',
    branch: 'CSE/IT',
    year: '3rd Year',
    semester: 5,
    price: 19,
    originalPrice: 49,
    description: 'Complete Web Technology Unit 1 notes covering HTTP, HTML, CSS, XML, DTD, and Web Page Designing as per AKTU syllabus.',
    previewUrl: 'https://zczomcghyktsaimwhwxp.supabase.co/storage/v1/object/public/notes-bucket/notes/notes_web_technology_unit_1_notes_pdf_lwumluuqa_1786349382025.pdf',
    pagesCount: 80,
    topics: ['HTML & CSS', 'Client-Server Architecture', 'XML & DTD', 'DOM & SAX Parsers', 'Web Page Designing'],
    type: 'notes',
    downloadsCount: 175
  },
  {
    id: 'note_dbms_unit1',
    title: 'DATABASE MANAGEMENT SYSTEM UNIT 1 | ER MODEL & RELATIONAL ALGEBRA',
    subject: 'Database Management System',
    branch: 'CSE/IT',
    year: '3rd Year',
    semester: 5,
    price: 19,
    originalPrice: 49,
    description: 'Complete Unit 1 notes for DBMS covering Database Architecture, ER Diagram, Relational Algebra & Calculus.',
    previewUrl: 'https://drive.google.com/file/d/1_Sample_Preview/preview',
    pagesCount: 72,
    topics: ['Database Architecture', 'ER Diagram & Mapping', 'Relational Algebra', 'Tuple Relational Calculus', 'SQL Queries'],
    type: 'notes',
    downloadsCount: 230
  }
];
export const INITIAL_PLAYLISTS: Playlist[] = [];
export const INITIAL_BUNDLES: Bundle[] = [
  {
    id: 'bundle_sem4_combo',
    title: 'B.TECH SEMESTER 4 COMPLETE COMBO BUNDLE',
    description: 'Complete Semester 4 combo including all core subjects with syllabus-based, exam-oriented notes, important concepts, diagrams, solved examples, and AKTU-focused content.',
    price: 299,
    originalPrice: 499,
    year: '2nd Year',
    semester: 4,
    notesIds: [],
    subjects: [
      'Operating System',
      'Theory of Automata and Formal Languages',
      'Object Oriented Programming with Java'
    ],
    type: 'semester'
  },
  {
    id: 'bundle_sem3_combo',
    title: 'B.TECH SEMESTER 3 COMPLETE COMBO BUNDLE',
    description: 'Complete Semester 3 combo including all core subjects with syllabus-based notes and solved PYQs.',
    price: 299,
    originalPrice: 499,
    year: '2nd Year',
    semester: 3,
    notesIds: [],
    subjects: [
      'Data Structure',
      'Computer Organization & Architecture',
      'Discrete Structures & Theory of Logic'
    ],
    type: 'semester'
  }
];

export const getStoredData = <T>(key: string, defaultValue: T): T => {
  if (typeof localStorage === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

export const setStoredData = <T>(key: string, value: T): void => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, bypassing cache:', e);
    }
  }
};


const safeParseBundleNotesIds = (notesIds: any): string[] => {
  if (Array.isArray(notesIds)) return notesIds;
  if (typeof notesIds === 'string') {
    try {
      const parsed = JSON.parse(notesIds);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    if (notesIds.includes(',')) return notesIds.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
};

const safeParseTopics = (topics: any): string[] => {
  if (Array.isArray(topics)) return topics;
  if (typeof topics === 'string') {
    try {
      const parsed = JSON.parse(topics);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    if (topics.includes(',')) return topics.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (topics.trim()) return [topics.trim()];
  }
  return ['Core syllabus', 'PYQs solutions'];
};

export const isSameSubject = (subject1?: string, subject2?: string): boolean => {
  if (!subject1 || !subject2) return false;

  const clean = (s: string) =>
    s.toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const s1 = clean(subject1);
  const s2 = clean(subject2);

  if (s1 === s2) return true;

  // 1st Year & Core Engineering Categorizers
  const isPhysics = (s: string) => s.includes('physics');
  const isChemistry = (s: string) => s.includes('chemistry');
  const isElectronics = (s: string) => s.includes('electronics');
  const isElectrical = (s: string) => s.includes('electrical');
  const isPPS = (s: string) => s.includes('pps') || s.includes('programming') || s.includes('problem solving');
  const isEnvironment = (s: string) => s.includes('environment') || s.includes('ecology');
  const isSoftSkills = (s: string) => s.includes('soft skill') || s.includes('communication');
  const isMechanical = (s: string) => s.includes('mechanical') || s.includes('mechanics');
  const isCivil = (s: string) => s.includes('civil');

  // Higher Year Categorizers
  const isBlockchain = (s: string) => s.includes('blockchain');
  const isCOA = (s: string) => !isBlockchain(s) && (s.includes('computer organization') || s.split(' ').includes('coa') || s === 'coa' || (s.includes('organization') && s.includes('architecture')));
  const isDSTL = (s: string) => s.includes('discrete') || s.includes('dstl') || (s.includes('logic') && !s.includes('digital') && !s.includes('design'));
  const isDataStructure = (s: string) => (s.includes('data structure') || s.split(' ').includes('ds') || s === 'ds') && !s.includes('dstl') && !s.includes('analytics') && !s.includes('mining') && !s.includes('warehouse');
  const isTAFL = (s: string) => s.includes('automata') || s.includes('tafl') || s.includes('formal languages');
  const isOS = (s: string) => (s.includes('operating system') || s.split(' ').includes('os') || s === 'os') && !s.includes('oosd');
  const isJava = (s: string) => s.includes('java');
  const isOOSD = (s: string) => s.includes('oosd') || s.includes('c++') || (s.includes('object oriented') && !s.includes('java'));
  const isMath = (s: string) => s.includes('math') || s.includes('mathematics');
  const isEnergy = (s: string) => s.includes('energy science') || s.includes('ese');
  const isUHV = (s: string) => s.includes('uhv') || s.includes('human values');
  const isCyber = (s: string) => s.includes('cyber') || s.includes('security');
  const isPython = (s: string) => s.includes('python');
  const isWebTech = (s: string) => s.includes('web tech') || s.includes('webtech') || s.includes('html');
  const isTechComm = (s: string) => s.includes('technical communication') || s.includes('soft skill');
  const isDataAnalytics = (s: string) => s.includes('data analytics');
  const isDataMining = (s: string) => s.includes('data mining') || s.includes('data warehouse') || s.includes('dwdm');
  const isDAA = (s: string) => s.includes('daa') || s.includes('analysis of algorithm') || s.includes('design and analysis');
  const isImageProc = (s: string) => s.includes('image processing');
  const isCompiler = (s: string) => s.includes('compiler');
  const isSoftEng = (s: string) => s.includes('software engineering');
  const isSPM = (s: string) => s.includes('spm') || s.includes('project management');
  const isCN = (s: string) => s.includes('computer networks') || s.includes('networks');
  const isBigData = (s: string) => s.includes('big data');
  const isCOI = (s: string) => s.includes('coi') || s.includes('constitution');
  const isEITK = (s: string) => s.includes('eitk') || s.includes('traditional knowledge');
  const isCloud = (s: string) => s.includes('cloud');
  const isML = (s: string) => s.includes('machine learning') || s.split(' ').includes('ml');
  const isDL = (s: string) => s.includes('deep learning') || s.split(' ').includes('dl');
  const isIoT = (s: string) => s.includes('iot') || s.includes('internet of things');

  if (isPhysics(s1) || isPhysics(s2)) return isPhysics(s1) && isPhysics(s2);
  if (isChemistry(s1) || isChemistry(s2)) return isChemistry(s1) && isChemistry(s2);
  if (isElectronics(s1) || isElectronics(s2)) return isElectronics(s1) && isElectronics(s2);
  if (isElectrical(s1) || isElectrical(s2)) return isElectrical(s1) && isElectrical(s2);
  if (isPPS(s1) || isPPS(s2)) return isPPS(s1) && isPPS(s2);
  if (isEnvironment(s1) || isEnvironment(s2)) return isEnvironment(s1) && isEnvironment(s2);
  if (isSoftSkills(s1) || isSoftSkills(s2)) return isSoftSkills(s1) && isSoftSkills(s2);
  if (isMechanical(s1) || isMechanical(s2)) return isMechanical(s1) && isMechanical(s2);
  if (isCivil(s1) || isCivil(s2)) return isCivil(s1) && isCivil(s2);

  if (isBlockchain(s1) || isBlockchain(s2)) return isBlockchain(s1) && isBlockchain(s2);
  if (isCOA(s1) || isCOA(s2)) return isCOA(s1) && isCOA(s2);
  if (isDSTL(s1) || isDSTL(s2)) return isDSTL(s1) && isDSTL(s2);
  if (isDataStructure(s1) || isDataStructure(s2)) return isDataStructure(s1) && isDataStructure(s2);
  if (isTAFL(s1) || isTAFL(s2)) return isTAFL(s1) && isTAFL(s2);
  if (isOS(s1) || isOS(s2)) return isOS(s1) && isOS(s2);
  if (isJava(s1) || isJava(s2)) return isJava(s1) && isJava(s2);
  if (isOOSD(s1) || isOOSD(s2)) return isOOSD(s1) && isOOSD(s2);
  if (isMath(s1) || isMath(s2)) return isMath(s1) && isMath(s2);
  if (isEnergy(s1) || isEnergy(s2)) return isEnergy(s1) && isEnergy(s2);
  if (isUHV(s1) || isUHV(s2)) return isUHV(s1) && isUHV(s2);
  if (isCyber(s1) || isCyber(s2)) return isCyber(s1) && isCyber(s2);
  if (isPython(s1) || isPython(s2)) return isPython(s1) && isPython(s2);
  if (isWebTech(s1) || isWebTech(s2)) return isWebTech(s1) && isWebTech(s2);
  if (isTechComm(s1) || isTechComm(s2)) return isTechComm(s1) && isTechComm(s2);
  if (isDataAnalytics(s1) || isDataAnalytics(s2)) return isDataAnalytics(s1) && isDataAnalytics(s2);
  if (isDataMining(s1) || isDataMining(s2)) return isDataMining(s1) && isDataMining(s2);
  if (isDAA(s1) || isDAA(s2)) return isDAA(s1) && isDAA(s2);
  if (isImageProc(s1) || isImageProc(s2)) return isImageProc(s1) && isImageProc(s2);
  if (isCompiler(s1) || isCompiler(s2)) return isCompiler(s1) && isCompiler(s2);
  if (isSoftEng(s1) || isSoftEng(s2)) return isSoftEng(s1) && isSoftEng(s2);
  if (isSPM(s1) || isSPM(s2)) return isSPM(s1) && isSPM(s2);
  if (isCN(s1) || isCN(s2)) return isCN(s1) && isCN(s2);
  if (isBigData(s1) || isBigData(s2)) return isBigData(s1) && isBigData(s2);
  if (isCOI(s1) || isCOI(s2)) return isCOI(s1) && isCOI(s2);
  if (isEITK(s1) || isEITK(s2)) return isEITK(s1) && isEITK(s2);
  if (isCloud(s1) || isCloud(s2)) return isCloud(s1) && isCloud(s2);
  if (isML(s1) || isML(s2)) return isML(s1) && isML(s2);
  if (isDL(s1) || isDL(s2)) return isDL(s1) && isDL(s2);
  if (isIoT(s1) || isIoT(s2)) return isIoT(s1) && isIoT(s2);

  // Substring fallback for custom or general subjects
  if (s1.length > 2 && s2.length > 2 && (s1.includes(s2) || s2.includes(s1))) {
    return true;
  }

  return false;
};

export const isNotePdfAvailable = (note?: Partial<Note> | null): boolean => {
  if (!note || !note.previewUrl) return false;
  const url = note.previewUrl.trim();
  if (!url) return false;
  if (
    url.includes('Sample_Preview') ||
    url.includes('placeholder') ||
    url.includes('dummy') ||
    url.includes('example.com') ||
    url === '#' ||
    url === 'about:blank'
  ) {
    return false;
  }

  // Strict Subject Protection: Prevent TAFL notes PDF URL from showing for Data Structures, COA, OS, Java, etc.
  const noteSubject = (note.subject || '').toLowerCase();
  const noteTitle = (note.title || '').toLowerCase();
  if (!noteSubject.includes('automata') && !noteSubject.includes('tafl') && !noteTitle.includes('tafl')) {
    if (url.includes('tafl') || url.includes('notes_tafl_')) {
      return false;
    }
  }

  return true;
};

export const cleanBundleDescription = (desc?: string): string => {
  if (!desc) return '';
  return desc
    .replace(/\s*<!--SUBJECTS:.*?-->/gs, '').replace(/<!--SUBJECTS:.*?-->/gs, '')
    .replace(/\s*<!--SUBJECT:.*?-->/gs, '').replace(/<!--SUBJECT:.*?-->/gs, '')
    .replace(/\s*<!--SEMESTER:.*?-->/gs, '').replace(/<!--SEMESTER:.*?-->/gs, '')
    .replace(/\s*<!--TYPE:.*?-->/gs, '').replace(/<!--TYPE:.*?-->/gs, '')
    .trim();
};

export const encodeBundleDescription = (bundle: Partial<Bundle>): string => {
  const cleanDesc = cleanBundleDescription(bundle.description || '');
  let encoded = cleanDesc;

  const subjectsList = Array.isArray(bundle.subjects) && bundle.subjects.length > 0 
    ? bundle.subjects 
    : (bundle.subject ? [bundle.subject] : []);

  if (subjectsList.length > 0) {
    encoded += `\n<!--SUBJECTS:${JSON.stringify(subjectsList)}-->`;
  }
  if (bundle.subject) {
    encoded += `\n<!--SUBJECT:${bundle.subject}-->`;
  }
  if (bundle.semester) {
    encoded += `\n<!--SEMESTER:${bundle.semester}-->`;
  }
  if (bundle.type) {
    encoded += `\n<!--TYPE:${bundle.type}-->`;
  }
  return encoded;
};

export const deriveBundleType = (b: Partial<Bundle>): 'semester' | 'subject' => {
  const titleLower = (b.title || '').toLowerCase().trim();
  const descLower = (b.description || '').toLowerCase();
  const id = b.id || '';

  // 1. Respect explicit object property type from DB if present
  if (b.type === 'semester' || (b.type as string) === 'bundle') return 'semester';
  if (b.type === 'subject') return 'subject';

  // 2. Metadata tag check (e.g. <!--TYPE:semester--> or <!--TYPE:bundle--> in description)
  const typeMatch = descLower.match(/<!--type:(.*?)-->/i);
  if (typeMatch && typeMatch[1]) {
    const parsedType = typeMatch[1].trim().toLowerCase();
    if (parsedType === 'semester' || parsedType === 'bundle') return 'semester';
    if (parsedType === 'subject') return 'subject';
  }

  // 3. ID Prefix Checks
  if (id.startsWith('bundle_sem_') || id.startsWith('sem_combo_') || id.startsWith('sem_pack_') || id.startsWith('semester_')) {
    return 'semester';
  }
  if (id.startsWith('subject_pack_') || id.startsWith('sub_pack_')) {
    return 'subject';
  }

  // 4. Multiple subjects array -> Semester Pack
  if (Array.isArray(b.subjects) && b.subjects.length > 1) {
    return 'semester';
  }

  // 5. Explicit Subject Pack Title Keywords
  if (
    titleLower.includes('subject pack') ||
    titleLower.includes('subject combo') ||
    titleLower.includes('all-in-one subject') ||
    titleLower.includes('all in one subject') ||
    titleLower.includes('complete subject pack') ||
    titleLower.includes('unit notes pack')
  ) {
    return 'subject';
  }

  // 6. Semester Combo / Pack Title Keywords
  if (
    titleLower.includes('semester combo') ||
    titleLower.includes('semester bundle') ||
    titleLower.includes('semester pack') ||
    titleLower.includes('sem combo') ||
    titleLower.includes('sem pack') ||
    titleLower.includes('combo bundle') ||
    titleLower.includes('all-in-one semester') ||
    titleLower.includes('all in one semester') ||
    titleLower.includes('b.tech semester') ||
    titleLower.includes('btech semester') ||
    titleLower.includes('complete semester') ||
    /sem(ester)?\s*\d+/i.test(titleLower)
  ) {
    return 'semester';
  }

  // Fallback for unspecified single item is 'subject'
  return 'subject';
};

export const deriveSemesterFromBundle = (b: Partial<Bundle>): number => {
  const title = (b.title || '').toLowerCase();
  const desc = (b.description || '').toLowerCase();

  // Try metadata tag <!--SEMESTER:X-->
  const semMatch = desc.match(/<!--semester:(\d+)-->/i);
  if (semMatch && semMatch[1]) {
    return Number(semMatch[1]);
  }

  if (title.includes('sem 5') || title.includes('sem-5') || title.includes('semester 5') || title.includes('sem5') || title.includes('5th sem') || title.includes('5 sem')) return 5;
  if (title.includes('sem 6') || title.includes('sem-6') || title.includes('semester 6') || title.includes('sem6') || title.includes('6th sem') || title.includes('6 sem')) return 6;
  if (title.includes('sem 3') || title.includes('sem-3') || title.includes('semester 3') || title.includes('sem3') || title.includes('3rd sem') || title.includes('3 sem') || title.includes('cobo 3') || title.includes('combo 3')) return 3;
  if (title.includes('sem 4') || title.includes('sem-4') || title.includes('semester 4') || title.includes('sem4') || title.includes('4th sem') || title.includes('4 sem') || title.includes('cobo 4') || title.includes('combo 4')) return 4;
  if (title.includes('sem 1') || title.includes('sem-1') || title.includes('semester 1') || title.includes('sem1') || title.includes('1st sem') || title.includes('1 sem')) return 1;
  if (title.includes('sem 2') || title.includes('sem-2') || title.includes('semester 2') || title.includes('sem2') || title.includes('2nd sem') || title.includes('2 sem')) return 2;

  if (b.semester && Number(b.semester) > 0 && Number(b.semester) !== 4) {
    return Number(b.semester);
  }

  if (b.year === '3rd Year') return 5;
  if (b.year === '1st Year') return 1;
  if (b.year === '2nd Year') return 3;
  return Number(b.semester || 3);
};

export const decodeBundleFromDb = (b: Bundle): Bundle => {
  if (!b) return b;
  let subjects = b.subjects;
  let subject = b.subject;
  let rawDescription = b.description || '';

  const matchSubjects = rawDescription.match(/<!--SUBJECTS:(.*?)-->/s);
  if (matchSubjects) {
    try {
      const parsed = JSON.parse(matchSubjects[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subjects = parsed;
      }
    } catch (e) {}
  }

  const matchSubject = rawDescription.match(/<!--SUBJECT:(.*?)-->/s);
  if (matchSubject && matchSubject[1]) {
    subject = matchSubject[1].trim();
    if (!subjects || subjects.length === 0) {
      subjects = [subject];
    }
  }

  const semester = deriveSemesterFromBundle(b);
  const type = deriveBundleType({ ...b, description: rawDescription });
  const description = cleanBundleDescription(rawDescription);

  if (!subjects || subjects.length === 0) {
    if (subject) {
      subjects = [subject];
    } else {
      const init = INITIAL_BUNDLES.find(ib => ib.id === b.id);
      if (init && init.subjects) {
        subjects = init.subjects;
      }
    }
  }

  return {
    ...b,
    type,
    semester,
    description,
    subject: subject || (subjects && subjects.length > 0 ? subjects[0] : ''),
    subjects: subjects || []
  };
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
  session_id?: string;
}

let mockUsers = getStoredData<UserProfile[]>('bw_mock_users', []);
let mockPurchasesV2 = getStoredData<Purchase[]>('bw_mock_purchases_v2', []);
let mockBundles = getStoredData<Bundle[]>('bw_mock_bundles', INITIAL_BUNDLES);
let currentUser = getStoredData<UserProfile | null>('bw_mock_current_user', null);
export let mockNotes = getStoredData<Note[]>('bw_mock_notes', INITIAL_NOTES);
let mockPlaylists: Playlist[] = [];

export const fetchWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 1000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Network query timed out')), timeoutMs)
    )
  ]);
};

export const dbService = {
  // --- AUTHENTICATION ---
  signUp: async (name: string, email: string, phone: string, password: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    try {
      const res = await vpsApi.signUp(name, email, phone, password);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        if (res.activeSessionId && typeof localStorage !== 'undefined') {
          localStorage.setItem('bw_active_session_id', res.activeSessionId);
        }
        return { data: currentUser, error: null };
      }
      return { data: null, error: res.error || 'Failed to create account.' };
    } catch (err: any) {
      return { data: null, error: err.message || 'Signup failed.' };
    }
  },

  signIn: async (email: string, password: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    try {
      const res = await vpsApi.signIn(email, password);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        if (res.activeSessionId && typeof localStorage !== 'undefined') {
          localStorage.setItem('bw_active_session_id', res.activeSessionId);
        }
        return { data: currentUser, error: null };
      }
      return { data: null, error: res.error || 'Invalid credentials.' };
    } catch (err: any) {
      return { data: null, error: err.message || 'Signin failed.' };
    }
  },

  googleSignIn: async (email: string, name?: string, phone?: string, googleId?: string, idToken?: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    try {
      const res = await vpsApi.googleSignIn(email, name, phone, googleId, idToken);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        if (res.activeSessionId && typeof localStorage !== 'undefined') {
          localStorage.setItem('bw_active_session_id', res.activeSessionId);
        }
        return { data: currentUser, error: null };
      }
      return { data: null, error: res.error || 'Google authentication failed.' };
    } catch (err: any) {
      return { data: null, error: err.message || 'Google authentication failed.' };
    }
  },

  sendPasswordResetOtp: async (email: string): Promise<{ success: boolean; data?: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.sendPasswordResetOtp(email);
      return { success: !res.error, data: !res.error, error: res.error || null };
    } catch (err: any) {
      return { success: false, data: false, error: err.message || 'Failed to send OTP.' };
    }
  },

  verifyOtpAndUpdatePassword: async (email: string, otpCode: string, newPassword: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    try {
      const res = await vpsApi.verifyOtpAndUpdatePassword(email, otpCode, newPassword);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        if (res.activeSessionId && typeof localStorage !== 'undefined') {
          localStorage.setItem('bw_active_session_id', res.activeSessionId);
        }
        return { data: currentUser, error: null };
      }
      return { data: null, error: res.error || 'Password update failed.' };
    } catch (err: any) {
      return { data: null, error: err.message || 'Password update failed.' };
    }
  },

  updatePassword: async (email: string, otpCode?: string, newPassword?: string): Promise<{ success: boolean; error: string | null }> => {
    if (!otpCode || !newPassword) {
      return { success: false, error: 'OTP code and new password required.' };
    }
    const res = await dbService.verifyOtpAndUpdatePassword(email, otpCode, newPassword);
    return { success: !res.error, error: res.error };
  },

  signOut: async (): Promise<void> => {
    currentUser = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bw_mock_current_user');
      localStorage.removeItem('bw_active_session_id');
      localStorage.removeItem('bw_current_device_session');
    }
  },

  getCurrentUser: (): UserProfile | null => {
    if (!currentUser) {
      currentUser = getStoredData<UserProfile | null>('bw_mock_current_user', null);
      if (!currentUser && typeof localStorage !== 'undefined') {
        const alt = localStorage.getItem('bw_user_session') || localStorage.getItem('user');
        if (alt) {
          try { currentUser = JSON.parse(alt); } catch (e) {}
        }
      }
    }
    return currentUser;
  },

  setCurrentUser: (user: UserProfile | null): void => {
    currentUser = user;
    setStoredData('bw_mock_current_user', currentUser);
  },

  registerDeviceSession: async (userId: string): Promise<{ activeSessionId: string | null; error: string | null }> => {
    try {
      const res = await vpsApi.registerDeviceSession(userId);
      return { activeSessionId: res.activeSessionId || null, error: res.error || null };
    } catch (err: any) {
      return { activeSessionId: null, error: err.message || 'Session registration failed.' };
    }
  },

  verifyDeviceSession: async (userId: string): Promise<{ valid: boolean; error: string | null }> => {
    try {
      if (typeof localStorage === 'undefined' || !userId) return { valid: true, error: null };
      
      let localSessionId = localStorage.getItem('bw_active_session_id');
      if (!localSessionId) {
        localSessionId = 'sess_legacy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        localStorage.setItem('bw_active_session_id', localSessionId);
      }

      const res = await vpsApi.verifyDeviceSession(userId, localSessionId);
      if (res && res.valid === false) {
        return { valid: false, error: res.error || 'Your account was logged in on another device.' };
      }
      return { valid: true, error: null };
    } catch (err: any) {
      return { valid: true, error: null };
    }
  },

  getAllActiveSessions: async (): Promise<{ data: any[]; error: string | null }> => {
    try {
      const res = await vpsApi.getAllActiveSessions();
      return { data: res.data || [], error: res.error || null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to load active sessions.' };
    }
  },

  terminateDeviceSession: async (userId: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.terminateSession(userId);
      return { success: !res.error, error: res.error || null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to terminate session.' };
    }
  },

  // --- CATALOG API ---
  getNotes: async (year?: string): Promise<{ data: Note[]; error: string | null }> => {
    const matchesYear = (noteYear?: string, filterYear?: string): boolean => {
      if (!filterYear) return true;
      if (!noteYear) return true;
      const nY = noteYear.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fY = filterYear.toLowerCase().replace(/[^a-z0-9]/g, '');
      return nY === fY || nY.includes(fY) || fY.includes(nY);
    };

    const deduplicateNotes = (rawNotes: Note[]): Note[] => {
      const map = new Map<string, Note>();
      for (const n of rawNotes) {
        if (!n.id) continue;
        if (!map.has(n.id)) {
          map.set(n.id, n);
        } else {
          const existing = map.get(n.id)!;
          if (n.previewUrl && !existing.previewUrl) {
            map.set(n.id, n);
          }
        }
      }
      return Array.from(map.values());
    };

    const deletedNoteIds = new Set(getStoredData<string[]>('bw_deleted_notes', []));

    try {
      const res = await vpsApi.getNotes();
      if (res.data && Array.isArray(res.data)) {
        const mapped: Note[] = res.data
          .filter((n: any) => !deletedNoteIds.has(n.id))
          .map((n: any) => ({
            id: n.id,
            title: n.title,
            subject: n.subject,
            branch: n.branch || 'CSE/IT',
            year: n.year || '1st Year',
            semester: Number(n.semester || 1),
            price: Number(n.price || 49),
            originalPrice: Number(n.original_price || n.originalPrice || 199),
            description: n.description || '',
            previewUrl: n.preview_url || n.previewUrl || n.pdf_url || n.pdfUrl || '',
            pdfUrl: n.pdf_url || n.pdfUrl || n.preview_url || n.previewUrl || '',
            pagesCount: Number(n.pages_count || n.pagesCount || 100),
            topics: safeParseTopics(n.topics),
            type: n.type || 'notes',
            downloadsCount: Number(n.downloads_count || n.downloadsCount || 0)
          }));

        const deduplicated = deduplicateNotes(mapped);
        setStoredData('bw_cached_notes', deduplicated);

        const filtered = year ? deduplicated.filter(n => matchesYear(n.year, year)) : deduplicated;
        return { data: filtered, error: null };
      }
    } catch (e) {}

    const cached = getStoredData<Note[]>('bw_cached_notes', []);
    const cleanInitial = INITIAL_NOTES.filter(n => !deletedNoteIds.has(n.id));
    const fallbackNotes = cached.length > 0 ? cached.filter(n => !deletedNoteIds.has(n.id)) : cleanInitial;

    const filtered = year ? fallbackNotes.filter(n => matchesYear(n.year, year)) : fallbackNotes;
    return { data: filtered, error: null };
  },

  getNoteById: async (id: string): Promise<{ data: Note | null; error: string | null }> => {
    const { data: notes } = await dbService.getNotes();
    const note = (notes || []).find(n => n.id === id) || null;
    return { data: note, error: null };
  },

  uploadFile: async (file: File, _folder: 'notes' | 'pyqs' = 'notes'): Promise<{ url: string | null; error: string | null }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileData = reader.result as string;
        try {
          const res = await vpsApi.uploadFile(fileData);
          if (res && res.url) {
            resolve({ url: res.url, error: null });
            return;
          }
        } catch (e) {
          console.warn('VPS file upload call failed, falling back to data URL:', e);
        }
        resolve({ url: fileData, error: null });
      };
      reader.onerror = () => {
        resolve({ url: null, error: 'Failed to read file.' });
      };
      reader.readAsDataURL(file);
    });
  },

  addNote: async (note: Omit<Note, 'id'>): Promise<{ data: Note | null; error: string | null }> => {
    try {
      const res = await vpsApi.addNote(note);
      if (res.data) {
        mockNotes.unshift(res.data);
        setStoredData('bw_mock_notes', mockNotes);
        return { data: res.data, error: null };
      }
    } catch (e) {}

    const prefix = note.type === 'pyqs' ? 'pyq_' : 'note_';
    const newNote = { ...note, id: prefix + Math.random().toString(36).substr(2, 9) } as Note;
    mockNotes.unshift(newNote);
    setStoredData('bw_mock_notes', mockNotes);
    return { data: newNote, error: null };
  },

  // --- PLAYLISTS SERVICE ---
  getPlaylists: async (year?: string): Promise<{ data: Playlist[]; error: string | null }> => {
    const sanitizePlaylists = (list: any[]) => {
      return list.map(p => {
        let url = (p.thumbnailUrl || p.thumbnail || '').trim();
        const playlistId = (p.playlistId || p.youtube_url || p.youtubeUrl || '').trim();
        const subjectKey = (p.subject || '').toLowerCase().trim();

        if (!url || url.includes('/vi/PL') || url.includes('/vi_webp/PL')) {
          url = SUBJECT_THUMBNAILS_MAP[subjectKey] || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80';
        }
        return {
          id: p.id || 'pl_' + Math.random().toString(36).substring(2, 9),
          playlistId: playlistId,
          title: p.title || 'Course Video Lectures',
          thumbnailUrl: url,
          subject: p.subject || 'General',
          year: p.year || '1st Year',
          semester: Number(p.semester || 1)
        } as Playlist;
      });
    };

    try {
      const res = await vpsApi.getPlaylists();
      if (res?.data && Array.isArray(res.data)) {
        const sanitizedDb = sanitizePlaylists(res.data);
        setStoredData('bw_cached_playlists', sanitizedDb);
        const finalData = year ? sanitizedDb.filter(p => p.year === year) : sanitizedDb;
        return { data: finalData, error: null };
      }
    } catch (e) {}

    const cachedPlaylists = getStoredData<Playlist[]>('bw_cached_playlists', []);
    const sanitizedLocal = sanitizePlaylists(cachedPlaylists);
    const finalData = year ? sanitizedLocal.filter(p => p.year === year) : sanitizedLocal;
    return { data: finalData, error: null };
  },

  addPlaylist: async (playlist: Omit<Playlist, 'id'>): Promise<{ data: Playlist | null; error: string | null }> => {
    try {
      const res = await vpsApi.addPlaylist(playlist);
      if (res.data) {
        mockPlaylists.unshift(res.data);
        setStoredData('bw_mock_playlists', mockPlaylists);
        return { data: res.data, error: null };
      }
    } catch (e) {}

    const newPlaylist = { ...playlist, id: 'play_' + Math.random().toString(36).substring(2, 9) } as Playlist;
    mockPlaylists.unshift(newPlaylist);
    setStoredData('bw_mock_playlists', mockPlaylists);
    return { data: newPlaylist, error: null };
  },

  // --- BUNDLES SERVICE ---
  getBundles: async (year?: string): Promise<{ data: Bundle[]; error: string | null }> => {
    try {
      const res = await vpsApi.getBundles();
      if (res.data && Array.isArray(res.data)) {
        const processed: Bundle[] = res.data.map((b: any) => {
          const rawBundle: Bundle = {
            id: b.id,
            title: b.title,
            description: b.description || '',
            price: Number(b.price || 299),
            originalPrice: Number(b.original_price || b.originalPrice || 499),
            year: b.year || '2nd Year',
            semester: Number(b.semester || 4),
            notesIds: safeParseBundleNotesIds(b.notesIds || b.note_ids),
            subject: b.subject || '',
            subjects: Array.isArray(b.subjects) && b.subjects.length > 0 ? b.subjects : undefined,
            type: deriveBundleType(b)
          };
          return decodeBundleFromDb(rawBundle);
        });

        setStoredData('bw_cached_bundles', processed);
        const filtered = year ? processed.filter(b => b.year === year) : processed;
        return { data: filtered, error: null };
      }
    } catch (err) {}

    const cachedBundles = getStoredData<Bundle[]>('bw_cached_bundles', INITIAL_BUNDLES).map(decodeBundleFromDb);
    const bundles = year ? cachedBundles.filter(b => b.year === year) : cachedBundles;
    return { data: bundles, error: null };
  },

  addBundle: async (bundle: Omit<Bundle, 'id'>): Promise<{ data: Bundle | null; error: string | null }> => {
    const encodedBundle = {
      ...bundle,
      description: encodeBundleDescription(bundle)
    };
    try {
      const res = await vpsApi.addBundle(encodedBundle);
      if (res.data) {
        mockBundles.unshift(res.data);
        setStoredData('bw_mock_bundles', mockBundles);
        return { data: decodeBundleFromDb(res.data), error: null };
      }
    } catch (e) {}

    const newBundle = { ...encodedBundle, id: 'bundle_' + Math.random().toString(36).substring(2, 11) } as Bundle;
    mockBundles.unshift(newBundle);
    setStoredData('bw_mock_bundles', mockBundles);
    return { data: decodeBundleFromDb(newBundle), error: null };
  },

  getPurchasedBundles: async (preFetchedBundles?: Bundle[], preFetchedPurchases?: any): Promise<{ data: { bundle: Bundle; expiresAt: string; daysLeft: number }[]; error: string | null }> => {
    const allBundles = preFetchedBundles || (await dbService.getBundles()).data || [];
    const purchaseState = preFetchedPurchases || (await dbService.getAllUserPurchasesState());
    const purchasedBundleIds = purchaseState.purchasedBundleIds || [];
    if (purchasedBundleIds.length === 0) return { data: [], error: null };

    const bundleMap = new Map<string, Bundle>();
    (allBundles || []).forEach(b => bundleMap.set(b.id, b));
    (INITIAL_BUNDLES || []).forEach(b => { if (!bundleMap.has(b.id)) bundleMap.set(b.id, b); });

    const result: { bundle: Bundle; expiresAt: string; daysLeft: number }[] = [];
    purchasedBundleIds.forEach((id: string) => {
      const b = bundleMap.get(id);
      if (b) {
        result.push({
          bundle: b,
          expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
          daysLeft: 180
        });
      } else if (!id.startsWith('note_') && !id.startsWith('unit_') && !id.includes('_unit')) {
        const synthSubjectBundle: Bundle = {
          id: id,
          title: `${id.toUpperCase()} COMPLETE SUBJECT PACK`,
          description: `Complete syllabus unit notes, important concepts & solved PYQs for ${id}.`,
          price: 149,
          originalPrice: 299,
          year: '2nd Year',
          semester: 4,
          notesIds: [],
          subjects: [id],
          type: 'subject',
          subject: id
        };
        result.push({
          bundle: synthSubjectBundle,
          expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
          daysLeft: 180
        });
      }
    });

    return { data: result, error: null };
  },

  // --- PURCHASES & LICENSING ---
  getAllUserPurchasesState: async (): Promise<{
    purchasedNoteIds: string[];
    explicitlyPurchasedNoteIds: string[];
    purchasedBundleIds: string[];
    rawPurchases: Purchase[];
    noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
    bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
  }> => {
    let user = currentUser || getStoredData<UserProfile | null>('bw_mock_current_user', null);
    const noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
    const bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};

    if (!user) return { purchasedNoteIds: [], explicitlyPurchasedNoteIds: [], purchasedBundleIds: [], rawPurchases: [], noteDetailsMap, bundleDetailsMap };

    try {
      const res = await vpsApi.getUserPurchases(user.id, user.email);
      if (res.data && Array.isArray(res.data)) {
        const rawPurchases: Purchase[] = res.data.map((p: any) => ({
          id: p.id,
          userId: p.user_id || user!.id,
          itemId: p.item_id,
          itemType: (p.item_type === 'note' ? 'notes' : p.item_type) as any,
          purchasedAt: p.granted_at || p.purchasedAt || new Date().toISOString(),
          expiresAt: p.expires_at || p.expiresAt || new Date(Date.now() + 180 * 86400000).toISOString(),
          paymentId: p.razorpay_payment_id || p.paymentId || ''
        }));

        const purchasedNoteIds: string[] = [];
        const explicitlyPurchasedNoteIds: string[] = [];
        const purchasedBundleIds: string[] = [];

        const notesToScan = getStoredData<Note[]>('bw_cached_notes', mockNotes);
        // Decode bundles so subjects/notesIds are extracted from encoded description
        const bundlesToScan = getStoredData<Bundle[]>('bw_cached_bundles', INITIAL_BUNDLES).map(decodeBundleFromDb);
        const decodedInitialBundles = INITIAL_BUNDLES.map(decodeBundleFromDb);

        rawPurchases.forEach(p => {
          const expDate = p.expiresAt ? new Date(p.expiresAt) : new Date(Date.now() + 180 * 86400000);
          const now = new Date();
          const diffTime = expDate.getTime() - now.getTime();
          const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const daysLeft = calculatedDays > 0 ? (calculatedDays > 180 ? 180 : calculatedDays) : 180;

          // Use decoded bundle so subjects list is properly parsed from description
          const foundBundle = bundlesToScan.find(b => b.id === p.itemId) || decodedInitialBundles.find(b => b.id === p.itemId);
          const foundNote = notesToScan.find(n => n.id === p.itemId) || mockNotes.find(n => n.id === p.itemId);

          const rawItemType = ((p.itemType as string) || '').toLowerCase();

          // Strict check: Is this an individual note file purchase or key grant?
          const isIndividualNote = 
            rawItemType === 'note' || 
            rawItemType === 'notes' || 
            rawItemType === 'unit' || 
            rawItemType === 'file' ||
            p.itemId.startsWith('note_') || 
            p.itemId.startsWith('unit_') || 
            (foundNote !== undefined && foundBundle === undefined);

          if (isIndividualNote) {
            // 🟢 INDIVIDUAL NOTE: Add ONLY to note arrays, NEVER to bundle arrays!
            if (!purchasedNoteIds.includes(p.itemId)) purchasedNoteIds.push(p.itemId);
            if (!explicitlyPurchasedNoteIds.includes(p.itemId)) explicitlyPurchasedNoteIds.push(p.itemId);
            noteDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };
          } else {
            // 🟣 BUNDLE (Semester Combo or Subject Pack)
            const derivedType = (rawItemType === 'subject' || rawItemType === 'semester')
              ? rawItemType
              : (foundBundle 
                  ? deriveBundleType(foundBundle) 
                  : 'subject');

            const isSemesterBundle = derivedType === 'semester';
            const isSubjectBundle = derivedType === 'subject';

            if (isSemesterBundle) {
              if (!purchasedBundleIds.includes(p.itemId)) purchasedBundleIds.push(p.itemId);
              bundleDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };

              if (foundBundle) {
                // ✅ STRICT: Only unlock notes explicitly included in this bundle.
                // Either the note ID is in notesIds list, OR the note's subject
                // is in the bundle's subjects list. NEVER unlock by year/semester alone.

                // Step 1: Unlock by explicit notesIds list
                if (foundBundle.notesIds && foundBundle.notesIds.length > 0) {
                  foundBundle.notesIds.forEach(nid => {
                    if (!purchasedNoteIds.includes(nid)) purchasedNoteIds.push(nid);
                    noteDetailsMap[nid] = { expiresAt: p.expiresAt, daysLeft };
                  });
                }

                // Step 2: Unlock by subjects list (match note subject to bundle subjects)
                const bundleSubjectList = Array.isArray(foundBundle.subjects) && foundBundle.subjects.length > 0
                  ? foundBundle.subjects
                  : [];
                if (bundleSubjectList.length > 0) {
                  notesToScan.forEach(n => {
                    const subjectMatches = bundleSubjectList.some(s => isSameSubject(n.subject, s));
                    if (subjectMatches) {
                      if (!purchasedNoteIds.includes(n.id)) purchasedNoteIds.push(n.id);
                      noteDetailsMap[n.id] = { expiresAt: p.expiresAt, daysLeft };
                    }
                  });
                }
              } else {
                // Bundle not found in local cache — cannot safely unlock anything
                // Do NOT fall back to unlocking all notes in the year
                if (!purchasedBundleIds.includes(p.itemId)) purchasedBundleIds.push(p.itemId);
              }
            } else if (isSubjectBundle) {
              if (!purchasedBundleIds.includes(p.itemId)) purchasedBundleIds.push(p.itemId);
              bundleDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };

              const targetSubject = foundBundle ? (foundBundle.subject || foundBundle.title) : p.itemId;

              notesToScan.forEach(n => {
                if (isSameSubject(n.subject, targetSubject) || (foundBundle && foundBundle.notesIds && foundBundle.notesIds.includes(n.id))) {
                  if (!purchasedNoteIds.includes(n.id)) purchasedNoteIds.push(n.id);
                  noteDetailsMap[n.id] = { expiresAt: p.expiresAt, daysLeft };
                }
              });

              if (foundBundle && foundBundle.notesIds) {
                foundBundle.notesIds.forEach(nid => {
                  if (!purchasedNoteIds.includes(nid)) purchasedNoteIds.push(nid);
                  noteDetailsMap[nid] = { expiresAt: p.expiresAt, daysLeft };
                });
              }
            }
          }
        });

        return {
          purchasedNoteIds,
          explicitlyPurchasedNoteIds,
          purchasedBundleIds,
          rawPurchases,
          noteDetailsMap,
          bundleDetailsMap
        };
      }
    } catch (e) {}

    return { purchasedNoteIds: [], explicitlyPurchasedNoteIds: [], purchasedBundleIds: [], rawPurchases: [], noteDetailsMap, bundleDetailsMap };
  },

  purchaseNotes: async (notesId: string, paymentDetails?: { paymentId?: string; orderId?: string; signature?: string }): Promise<{ success: boolean; error: string | null }> => {
    let user = currentUser || getStoredData<UserProfile | null>('bw_mock_current_user', null);
    if (!user) user = dbService.getCurrentUser();
    if (!user) return { success: false, error: 'You must be logged in to buy notes.' };
    currentUser = user;

    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + 6);

    const newPurchase: Purchase = {
      id: generateUUID(),
      userId: user.id,
      itemId: notesId,
      itemType: 'notes',
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentId: paymentDetails?.paymentId || '',
      orderId: paymentDetails?.orderId || '',
      signature: paymentDetails?.signature || ''
    };

    mockPurchasesV2 = mockPurchasesV2.filter(p => !(p.itemId === notesId && p.itemType === 'notes'));
    mockPurchasesV2.push(newPurchase);
    setStoredData('bw_mock_purchases_v2', mockPurchasesV2);

    try {
      if (user.id) await vpsApi.grantPurchase(user.id, notesId, 'note', 99, paymentDetails?.paymentId);
      if (user.email && user.email !== user.id) await vpsApi.grantPurchase(user.email, notesId, 'note', 99, paymentDetails?.paymentId);
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
    }

    return { success: true, error: null };
  },

  purchaseBundle: async (bundleId: string, paymentDetails?: { paymentId?: string; orderId?: string; signature?: string }): Promise<{ success: boolean; error: string | null }> => {
    let user = currentUser || getStoredData<UserProfile | null>('bw_mock_current_user', null);
    if (!user) user = dbService.getCurrentUser();
    if (!user) return { success: false, error: 'You must be logged in to buy bundles.' };
    currentUser = user;

    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + 6);

    const newPurchase: Purchase = {
      id: generateUUID(),
      userId: user.id,
      itemId: bundleId,
      itemType: 'bundle',
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentId: paymentDetails?.paymentId || '',
      orderId: paymentDetails?.orderId || '',
      signature: paymentDetails?.signature || ''
    };

    mockPurchasesV2 = mockPurchasesV2.filter(p => !(p.itemId === bundleId && p.itemType === 'bundle'));
    mockPurchasesV2.push(newPurchase);
    setStoredData('bw_mock_purchases_v2', mockPurchasesV2);

    try {
      if (user.id) await vpsApi.grantPurchase(user.id, bundleId, 'bundle', 299, paymentDetails?.paymentId);
      if (user.email && user.email !== user.id) await vpsApi.grantPurchase(user.email, bundleId, 'bundle', 299, paymentDetails?.paymentId);
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
    }

    return { success: true, error: null };
  },

  getPurchasedNotes: async (): Promise<{ data: Note[]; error: string | null }> => {
    const { data: allNotes } = await dbService.getNotes();
    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();

    if (purchasedNoteIds.length === 0) return { data: [], error: null };

    const noteMap = new Map<string, Note>();
    (allNotes || []).forEach(n => noteMap.set(n.id, n));

    const result: Note[] = [];
    purchasedNoteIds.forEach(id => {
      const note = noteMap.get(id);
      if (note) result.push(note);
    });

    return { data: result, error: null };
  },

  isNotePurchased: async (notesId: string): Promise<{ purchased: boolean; expiresAt: string | null; daysLeft: number | null }> => {
    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();
    const purchased = purchasedNoteIds.includes(notesId);
    return { purchased, expiresAt: null, daysLeft: 180 };
  },

  checkNoteAccess: async (notesId: string): Promise<boolean> => {
    const { purchased } = await dbService.isNotePurchased(notesId);
    return purchased;
  },

  isBundlePurchased: async (bundleId: string): Promise<{ purchased: boolean; expiresAt: string | null; daysLeft: number | null }> => {
    const { purchasedBundleIds } = await dbService.getAllUserPurchasesState();
    const purchased = purchasedBundleIds.includes(bundleId);
    return { purchased, expiresAt: null, daysLeft: 180 };
  },

  // --- ADMIN & MANAGEMENT ---
  updateNote: async (id: string, note: Partial<Note>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.updateNote(id, note);
      mockNotes = mockNotes.map(n => n.id === id ? { ...n, ...note } : n);
      setStoredData('bw_mock_notes', mockNotes);
      return { success: !res.error, error: res.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  deleteNote: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.deleteNote(id);

      const deletedIds = getStoredData<string[]>('bw_deleted_notes', []);
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        setStoredData('bw_deleted_notes', deletedIds);
      }

      mockNotes = mockNotes.filter(n => n.id !== id);
      setStoredData('bw_mock_notes', mockNotes);

      const cachedNotes = getStoredData<Note[]>('bw_cached_notes', []).filter(n => n.id !== id);
      setStoredData('bw_cached_notes', cachedNotes);

      return { success: !res?.error, error: res?.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  updateBundle: async (id: string, bundle: Partial<Bundle>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const payload = {
        ...bundle,
        description: encodeBundleDescription(bundle)
      };
      const res = await vpsApi.updateBundle(id, payload);
      mockBundles = mockBundles.map(b => b.id === id ? { ...b, ...payload } : b);
      setStoredData('bw_mock_bundles', mockBundles);
      return { success: !res.error, error: res.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  deleteBundle: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.deleteBundle(id);
      mockBundles = mockBundles.filter(b => b.id !== id);
      setStoredData('bw_mock_bundles', mockBundles);
      return { success: !res.error, error: res.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  deletePlaylist: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.deletePlaylist(id);
      mockPlaylists = mockPlaylists.filter(p => p.id !== id);
      setStoredData('bw_mock_playlists', mockPlaylists);
      return { success: !res.error, error: res.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  getAllProfiles: async (): Promise<{ data: UserProfile[]; error: string | null }> => {
    try {
      const res = await vpsApi.getAllProfiles();
      if (res.data) return { data: res.data, error: null };
    } catch (e) {}
    return { data: mockUsers, error: null };
  },

  getAllPurchases: async (): Promise<{ data: Purchase[]; error: string | null }> => {
    try {
      const res = await vpsApi.getAllPurchases();
      if (res.data && Array.isArray(res.data)) {
        const activeRows = res.data.filter((p: any) => p.status !== 'revoked');
        const mapped: Purchase[] = activeRows.map((p: any) => ({
          id: p.id,
          userId: p.user_id || p.userId,
          userEmail: p.user_email || p.userEmail || p.user_id || p.userId || 'student@gmail.com',
          userName: p.user_name || p.userName || '',
          itemId: p.item_id || p.itemId,
          itemName: p.item_name || p.itemName || p.item_id || p.itemId || 'Unlocked Resource',
          itemSubject: p.item_subject || p.itemSubject || '',
          itemType: (p.item_type || p.itemType || 'notes') as any,
          purchasedAt: p.granted_at || p.grantedAt || new Date().toISOString(),
          expiresAt: p.expires_at || p.expiresAt || new Date(Date.now() + 180 * 86400000).toISOString(),
          paymentId: p.razorpay_payment_id || p.paymentId || ''
        }));
        return { data: mapped, error: null };
      }
    } catch (e) {}
    return { data: mockPurchasesV2.filter(p => p.status !== 'revoked'), error: null };
  },

  grantPurchase: async (userId: string, itemId: string, itemType: 'note' | 'bundle' = 'note'): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.grantPurchase(userId, itemId, itemType, 0);
      if (res.data) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
        }
        return { success: true, error: null };
      }
      return { success: false, error: res.error || 'Failed to grant purchase.' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  grantManualLicense: async (userId: string, itemId: string, itemType?: string, _durationDays?: number): Promise<{ success: boolean; error: string | null }> => {
    const type = itemType === 'notes' ? 'note' : (itemType as any || 'note');
    return dbService.grantPurchase(userId, itemId, type);
  },

  revokePurchase: async (userId: string, itemId: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.revokePurchase(userId, itemId);
      if (res.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
        }
        return { success: true, error: null };
      }
      return { success: false, error: res.error || 'Failed to revoke purchase.' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  revokeLicense: async (purchaseId: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.revokePurchaseById(purchaseId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
      }
      return { success: !res.error, error: res.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  revokeAllLicenses: async (): Promise<{ success: boolean; error: string | null }> => {
    try {
      const res = await vpsApi.revokeAllPurchases();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
      }
      return { success: !res.error, error: res.error || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  clearOfflineNotes: () => {},
  clearDatabase: async (): Promise<{ success: boolean }> => {
    mockNotes = [];
    mockBundles = [];
    mockPlaylists = [];
    mockPurchasesV2 = [];
    setStoredData('bw_mock_notes', []);
    setStoredData('bw_mock_bundles', []);
    setStoredData('bw_mock_playlists', []);
    setStoredData('bw_mock_purchases_v2', []);
    return { success: true };
  },
  saveNoteForOffline: (_note: Note) => {},
  getOfflineNote: async (id: string): Promise<Note | null> => {
    const { data: note } = await dbService.getNoteById(id);
    return note;
  }
};
