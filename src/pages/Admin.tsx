import React, { useState, useEffect } from 'react';
import { 
  FilePlus, Video, FolderHeart, ShieldAlert, Loader2, CheckCircle2, 
  Layers, Trash2, Edit2, Key, Users, AlertCircle, BookOpen, Search, Filter,
  Smartphone, RefreshCw, LogOut, ArrowLeft
} from 'lucide-react';
import { dbService, deriveBundleType } from '../lib/dbService';
import type { Note, UserProfile, Bundle, Purchase, Playlist } from '../lib/dbService';
import { sanitizeSearchQuery } from '../lib/security';

const getPredefinedSubjects = (year: string, sem: number | string): string[] => {
  const sNum = Number(sem);
  if (year === '1st Year') {
    return [
      'Engineering Physics',
      'Engineering Chemistry',
      'Engineering Mathematics-I',
      'Programming for Problem Solving',
      'Fundamentals of Electronics Engineering',
      'Environment and Ecology',
      'Soft Skills'
    ];
  }
  if (year === '2nd Year') {
    const sem3 = ['Data Structure', 'Computer Organization & Architecture', 'Discrete Structures & Theory of Logic'];
    const sem4 = ['Operating System', 'Theory of Automata and Formal Languages', 'Object Oriented Programming with Java'];
    const common = ['Math IV', 'Technical Communication', 'Cyber Security', 'Python Programming', 'UHV', 'Energy Science and Engineering'];
    if (sNum === 3) return [...sem3, ...common];
    if (sNum === 4) return [...sem4, ...common];
    return [...sem3, ...sem4, ...common];
  }
  if (year === '3rd Year') {
    const sem5 = [
      'Database Management System',
      'Web Technology',
      'Design and Analysis of Algorithm (DAA)',
      'Data Analytics',
      'Object Oriented System Design with C++ (OOSD)',
      'Image Processing',
      'Data Warehouse & Data Mining'
    ];
    const sem6 = [
      'Software Engineering',
      'Compiler Design',
      'Computer Networks',
      'Blockchain Architecture Design',
      'Big Data',
      'Software Project Management (SPM)'
    ];
    const common = ['Constitution of India (COI)', 'Essence of Indian Traditional Knowledge (EITK)'];
    if (sNum === 5) return [...sem5, ...common];
    if (sNum === 6) return [...sem6, ...common];
    return [...sem5, ...sem6, ...common];
  }
  if (year === '4th Year') {
    const sem7 = ['Cloud Computing', 'Machine Learning', 'Information Security'];
    const sem8 = ['Deep Learning', 'Internet of Things (IoT)'];
    if (sNum === 7) return sem7;
    if (sNum === 8) return sem8;
    return [...sem7, ...sem8];
  }
  return [];
};

const getSemesterOptionsForYear = (year: string): { value: number; label: string }[] => {
  switch (year) {
    case '1st Year':
      return [
        { value: 1, label: 'Semester 1' },
        { value: 2, label: 'Semester 2' }
      ];
    case '2nd Year':
      return [
        { value: 3, label: 'Semester 3' },
        { value: 4, label: 'Semester 4' }
      ];
    case '3rd Year':
      return [
        { value: 5, label: 'Semester 5' },
        { value: 6, label: 'Semester 6' }
      ];
    case '4th Year':
      return [
        { value: 7, label: 'Semester 7' },
        { value: 8, label: 'Semester 8' }
      ];
    default:
      return [
        { value: 1, label: 'Semester 1' },
        { value: 2, label: 'Semester 2' }
      ];
  }
};

interface AdminProps {
  user: UserProfile | null;
  navigate: (page: string) => void;
}

export const Admin: React.FC<AdminProps> = ({ user, navigate }) => {
  const [activeTab, setActiveTab] = useState<'uploads' | 'inventory' | 'licenses' | 'sessions'>('uploads');
  const [notes, setNotes] = useState<Note[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [purchases, setPurchases] = useState<(Purchase & { userEmail?: string; itemName?: string })[]>([]);
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inventoryActiveEditor, setInventoryActiveEditor] = useState<'notes' | 'combos' | 'subjects' | 'playlists' | null>(null);

  // --- Note Form Fields ---
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [noteYear, setNoteYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');
  const [noteSemester, setNoteSemester] = useState(1);
  const [notePrice, setNotePrice] = useState(99);
  const [noteOriginalPrice, setNoteOriginalPrice] = useState(199);
  const [noteDesc, setNoteDesc] = useState('');
  const [noteTopics, setNoteTopics] = useState('');
  const [notePages, setNotePages] = useState(100);
  const [noteType, setNoteType] = useState<'notes' | 'pyqs'>('notes');

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>('');
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editSelectedFileBase64, setEditSelectedFileBase64] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file only.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditSelectedFile(file);
        setEditSelectedFileBase64(base64String);
      } else {
        setSelectedFile(file);
        setSelectedFileBase64(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Playlist Form Fields ---
  const [playPlaylistId, setPlayPlaylistId] = useState('');
  const [playTitle, setPlayTitle] = useState('');
  const [playThumb, setPlayThumb] = useState('');
  const [playSubject, setPlaySubject] = useState('');
  const [playYear, setPlayYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');
  const [playSemester, setPlaySemester] = useState(1);

  // --- Bundle Form Fields ---
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundlePrice, setBundlePrice] = useState(149);
  const [bundleOriginalPrice, setBundleOriginalPrice] = useState(249);
  const [bundleYear, setBundleYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('2nd Year');
  const [bundleSemester, setBundleSemester] = useState(4);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // --- Subject Bundle Form Fields ---
  const [subjBundleTitle, setSubjBundleTitle] = useState('');
  const [subjBundleDesc, setSubjBundleDesc] = useState('');
  const [subjBundlePrice, setSubjBundlePrice] = useState(149);
  const [subjBundleOriginalPrice, setSubjBundleOriginalPrice] = useState(249);
  const [subjBundleYear, setSubjBundleYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('2nd Year');
  const [subjBundleSemester, setSubjBundleSemester] = useState(3);
  const [subjBundleSubject, setSubjBundleSubject] = useState('');
  const [isCustomSubjBundleSubject, setIsCustomSubjBundleSubject] = useState(false);
  const [subjBundleSelectedNotesIds, setSubjBundleSelectedNotesIds] = useState<string[]>([]);

  // --- License Grant Form Fields ---
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedLicenseItem, setSelectedLicenseItem] = useState('');
  const [licenseType, setLicenseType] = useState<'notes' | 'bundle' | 'subject'>('notes');
  const [licenseMonths, setLicenseMonths] = useState(6);

  // --- Edit Modal States ---
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTopicsText, setEditTopicsText] = useState('');
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  // --- Inventory Organization Filter States ---
  const [notesFilterSem, setNotesFilterSem] = useState<number | 'all'>('all');
  const [notesFilterSubject, setNotesFilterSubject] = useState<string>('all');
  const [notesSearchQuery, setNotesSearchQuery] = useState<string>('');

  // Load existing inventory (notes, bundles, playlists, purchases)
  const loadInventory = async () => {
    setLoading(true);
    try {
      const notesData = await dbService.getNotes();
      setNotes(notesData.data || []);
      
      const bundlesData = await dbService.getBundles();
      setBundles(bundlesData.data || []);

      const playlistsData = await dbService.getPlaylists();
      setPlaylists(playlistsData.data || []);

      const purchasesData = await dbService.getAllPurchases();
      setPurchases(purchasesData.data || []);

      fetchActiveSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    setLoadingSessions(true);
    const { data } = await dbService.getAllActiveSessions();
    setActiveSessions(data || []);
    setLoadingSessions(false);
  };

  const handleTerminateSession = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to terminate active session for ${userEmail}? The student will be logged out immediately.`)) return;
    const { success, error } = await dbService.terminateDeviceSession(userId);
    if (success) {
      setSuccessMsg(`Active session terminated for ${userEmail}. Student device logged out.`);
      fetchActiveSessions();
    } else {
      alert(error || 'Failed to terminate session.');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadInventory();
    }
  }, [user]);

  // Set default selection item for license grant form
  useEffect(() => {
    if (licenseType === 'notes' && notes.length > 0) {
      setSelectedLicenseItem(notes[0].id);
    } else if (licenseType === 'subject') {
      const subjectPacks = bundles.filter(b => deriveBundleType(b) === 'subject');
      const semesterCombos = bundles.filter(b => deriveBundleType(b) === 'semester');
      if (subjectPacks.length > 0) {
        setSelectedLicenseItem(subjectPacks[0].id);
      } else if (semesterCombos.length > 0) {
        setSelectedLicenseItem(semesterCombos[0].id);
      } else if (bundles.length > 0) {
        setSelectedLicenseItem(bundles[0].id);
      } else {
        setSelectedLicenseItem('');
      }
    } else if (licenseType === 'bundle') {
      const semesterCombos = bundles.filter(b => deriveBundleType(b) === 'semester');
      const subjectPacks = bundles.filter(b => deriveBundleType(b) === 'subject');
      if (semesterCombos.length > 0) {
        setSelectedLicenseItem(semesterCombos[0].id);
      } else if (subjectPacks.length > 0) {
        setSelectedLicenseItem(subjectPacks[0].id);
      } else if (bundles.length > 0) {
        setSelectedLicenseItem(bundles[0].id);
      } else {
        setSelectedLicenseItem('');
      }
    } else {
      setSelectedLicenseItem('');
    }
  }, [licenseType, notes, bundles]);

  // Reset note subject when year or semester changes
  useEffect(() => {
    const predefined = getPredefinedSubjects(noteYear, noteSemester);
    if (predefined.length > 0) {
      setNoteSubject(predefined[0]);
      setIsCustomSubject(false);
    } else {
      setNoteSubject('');
      setIsCustomSubject(true);
    }
  }, [noteYear, noteSemester]);

  // Reset subject bundle subject when year or semester changes
  useEffect(() => {
    const predefined = getPredefinedSubjects(subjBundleYear, subjBundleSemester);
    if (predefined.length > 0) {
      setSubjBundleSubject(predefined[0]);
      setIsCustomSubjBundleSubject(false);
    } else {
      setSubjBundleSubject('');
      setIsCustomSubjBundleSubject(true);
    }
  }, [subjBundleYear, subjBundleSemester]);

  // Auto-adjust selected semester when Year changes across forms
  useEffect(() => {
    const validSems = getSemesterOptionsForYear(noteYear);
    if (!validSems.some(s => s.value === noteSemester)) {
      setNoteSemester(validSems[0].value);
    }
  }, [noteYear]);

  useEffect(() => {
    const validSems = getSemesterOptionsForYear(subjBundleYear);
    if (!validSems.some(s => s.value === subjBundleSemester)) {
      setSubjBundleSemester(validSems[0].value);
    }
  }, [subjBundleYear]);

  useEffect(() => {
    const validSems = getSemesterOptionsForYear(bundleYear);
    if (!validSems.some(s => s.value === bundleSemester)) {
      setBundleSemester(validSems[0].value);
    }
  }, [bundleYear]);

  useEffect(() => {
    const validSems = getSemesterOptionsForYear(playYear);
    if (!validSems.some(s => s.value === playSemester)) {
      setPlaySemester(validSems[0].value);
    }
  }, [playYear]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handle Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteSubject || !noteDesc) {
      alert('Please fill out all primary note fields.');
      return;
    }

    if (!selectedFile) {
      alert('Please upload a PDF file for these notes.');
      return;
    }

    setUploading(true);
    try {
      let finalPreviewUrl = selectedFileBase64;

      const { url, error: uploadError } = await dbService.uploadFile(selectedFile, noteType);
      if (url) {
        finalPreviewUrl = url;
      } else if (uploadError) {
        alert(`File upload failed: ${uploadError}`);
        return;
      }

      const topicsArray = noteTopics.split(',').map(t => t.trim()).filter(Boolean);

      const notePayload = {
        title: noteTitle,
        subject: noteSubject,
        year: noteYear,
        semester: Number(noteSemester),
        price: Number(notePrice),
        originalPrice: Number(noteOriginalPrice),
        description: noteDesc,
        previewUrl: finalPreviewUrl,
        pagesCount: Number(notePages),
        topics: topicsArray.length > 0 ? topicsArray : ['Core syllabus', 'PYQs solutions'],
        type: noteType
      };

      const { data, error } = await dbService.addNote(notePayload);
      
      if (data) {
        showNotification('Note successfully added to catalog!');
        setNoteTitle('');
        setNoteSubject('');
        setNoteTopics('');
        setNotePrice(99);
        setNoteOriginalPrice(199);
        setNotePages(100);
        setNoteType('notes');
        setSelectedFile(null);
        setSelectedFileBase64('');
        loadInventory();
      } else {
        alert(error || 'Failed to add note to database.');
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle Note Update
  const handleUpdateNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    setUploading(true);
    try {
      const topicsArray = typeof editingNote.topics === 'string'
        ? (editingNote.topics as string).split(',').map(t => t.trim()).filter(Boolean)
        : editingNote.topics;

      let updatedPreviewUrl = editingNote.previewUrl;
      
      if (editSelectedFile && editSelectedFileBase64) {
        updatedPreviewUrl = editSelectedFileBase64;
        const { url, error: uploadError } = await dbService.uploadFile(editSelectedFile, editingNote.type || 'notes');
        if (url) {
          updatedPreviewUrl = url;
        } else if (uploadError) {
          alert(`File upload failed: ${uploadError}`);
          return;
        }
      }

      const { success, error } = await dbService.updateNote(editingNote.id, {
        ...editingNote,
        previewUrl: updatedPreviewUrl,
        topics: topicsArray
      });

      if (success) {
        showNotification('Notes pack successfully updated!');
        setEditingNote(null);
        setEditSelectedFile(null);
        setEditSelectedFileBase64('');
        loadInventory();
      } else {
        alert(error || 'Failed to update note.');
      }
    } catch (err: any) {
      alert(`Update error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle Note Deletion
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note pack? This will also remove it from any semester bundles!')) return;
    const { success, error } = await dbService.deleteNote(id);
    if (success) {
      showNotification('Note pack removed from database.');
      await loadInventory();
    } else {
      alert(error || 'Failed to delete note pack.');
    }
  };

  // Handle Playlist Submission
  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playPlaylistId || !playTitle || !playSubject) {
      alert('Please fill out all primary playlist fields.');
      return;
    }

    let thumbnail = playThumb.trim();
    
    if (!thumbnail) {
      const isPlaylist = playPlaylistId.startsWith('PL') || playPlaylistId.length > 12;
      if (isPlaylist) {
        try {
          // 1. Try direct fetch to YouTube official oEmbed API
          const directUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playPlaylistId}&format=json`;
          const response = await fetch(directUrl);
          if (response.ok) {
            const data = await response.json();
            if (data && data.thumbnail_url) {
              thumbnail = data.thumbnail_url;
            }
          }
        } catch (err) {
          console.warn('Direct YouTube oEmbed failed, trying CORS proxy...', err);
        }

        // 2. Try proxy fallback if direct fetch failed
        if (!thumbnail) {
          try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playPlaylistId}&format=json`)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
              const data = await response.json();
              if (data && data.contents) {
                const parsed = JSON.parse(data.contents);
                if (parsed && parsed.thumbnail_url) {
                  thumbnail = parsed.thumbnail_url;
                }
              }
            }
          } catch (err) {
            console.error('CORS proxy YouTube oEmbed failed:', err);
          }
        }
      } else {
        thumbnail = `https://img.youtube.com/vi/${playPlaylistId}/mqdefault.jpg`;
      }
      
      if (!thumbnail) {
        thumbnail = `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80`;
      }
    }

    const playlistPayload = {
      playlistId: playPlaylistId,
      title: playTitle,
      thumbnailUrl: thumbnail,
      subject: playSubject,
      year: playYear,
      semester: Number(playSemester)
    };

    const { data } = await dbService.addPlaylist(playlistPayload);
    if (data) {
      showNotification('YouTube Playlist synced successfully!');
      setPlayPlaylistId('');
      setPlayTitle('');
      setPlayThumb('');
      setPlaySubject('');
      setPlayYear('1st Year');
      setPlaySemester(1);
      loadInventory();
    }
  };

  // Handle Playlist Deletion
  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to unsync this YouTube playlist?')) return;
    const { success } = await dbService.deletePlaylist(id);
    if (success) {
      showNotification('YouTube Playlist unsynced.');
      loadInventory();
    }
  };

  // Handle Bundle Submission
  const handleAddBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleTitle || !bundleDesc || selectedSubjects.length === 0) {
      alert('Please fill out all bundle fields and select at least one subject.');
      return;
    }

    // Find all note IDs that belong to the selected subjects for this Year/Sem
    const noteIdsToInclude = notes
      .filter(n => n.year === bundleYear && n.semester === Number(bundleSemester) && selectedSubjects.includes(n.subject))
      .map(n => n.id);

    const bundlePayload = {
      title: bundleTitle,
      description: bundleDesc,
      price: Number(bundlePrice),
      originalPrice: Number(bundleOriginalPrice),
      year: bundleYear,
      semester: Number(bundleSemester),
      notesIds: noteIdsToInclude,
      subjects: selectedSubjects,
      type: 'semester' as const
    };

    const { data } = await dbService.addBundle(bundlePayload);
    if (data) {
      showNotification('Semester Combo Bundle successfully created!');
      setBundleTitle('');
      setBundleDesc('');
      setBundlePrice(149);
      setBundleOriginalPrice(249);
      setSelectedSubjects([]);
      loadInventory();
    }
  };

  // Handle Subject Bundle Submission
  const handleAddSubjectBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjBundleTitle || !subjBundleDesc || !subjBundleSubject || subjBundleSelectedNotesIds.length === 0) {
      alert('Please fill out all subject bundle fields and select at least one note.');
      return;
    }

    const bundlePayload = {
      title: subjBundleTitle,
      description: subjBundleDesc,
      price: Number(subjBundlePrice),
      originalPrice: Number(subjBundleOriginalPrice),
      year: subjBundleYear,
      semester: Number(subjBundleSemester),
      notesIds: subjBundleSelectedNotesIds,
      type: 'subject' as const,
      subject: subjBundleSubject
    };

    const { data } = await dbService.addBundle(bundlePayload);
    if (data) {
      showNotification('Subject study bundle successfully created!');
      setSubjBundleTitle('');
      setSubjBundleDesc('');
      setSubjBundlePrice(149);
      setSubjBundleOriginalPrice(249);
      setSubjBundleSelectedNotesIds([]);
      loadInventory();
    }
  };

  // Handle Bundle Update
  const handleUpdateBundleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBundle) return;

    const { success, error } = await dbService.updateBundle(editingBundle.id, editingBundle);
    if (success) {
      showNotification('Combo bundle successfully updated!');
      setEditingBundle(null);
      loadInventory();
    } else {
      alert(error || 'Failed to update bundle.');
    }
  };

  // Handle Bundle Deletion
  const handleDeleteBundle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this semester combo bundle?')) return;
    const { success } = await dbService.deleteBundle(id);
    if (success) {
      showNotification('Combo bundle removed.');
      loadInventory();
    }
  };

  // Handle Manual License Grant
  const handleGrantLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail || !selectedLicenseItem) {
      alert('Please enter student email and select an item to grant.');
      return;
    }

    const { success, error } = await dbService.grantManualLicense(
      studentEmail.trim(),
      selectedLicenseItem,
      licenseType,
      Number(licenseMonths)
    );

    if (success) {
      showNotification(`Successfully unlocked license for ${studentEmail}!`);
      setStudentEmail('');
      loadInventory();
    } else {
      alert(error || 'Failed to grant license.');
    }
  };

  // Handle License Revocation
  const handleRevokeLicense = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to revoke this student\'s unlocked access license?')) return;
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    const { success, error } = await dbService.revokeLicense(purchaseId);
    if (success) {
      showNotification('Student access license revoked.');
      await loadInventory();
    } else {
      alert(error || 'Failed to revoke license.');
      loadInventory();
    }
  };

  // Handle All Licenses Revocation
  const handleRevokeAllLicenses = async () => {
    if (purchases.length === 0) return;
    if (!confirm('⚠️ WARNING: Are you sure you want to revoke ALL active student licenses? This will remove unlocked access for all students. Proceed?')) {
      return;
    }
    setPurchases([]);
    const { success, error } = await dbService.revokeAllLicenses();
    if (success) {
      showNotification('All active student licenses successfully revoked.');
      await loadInventory();
    } else {
      alert(error || 'Failed to revoke all licenses.');
      loadInventory();
    }
  };

  // Get all subjects (predefined + custom from database) for the active Year/Sem in the add bundle form
  const availableSubjectsForBundle = Array.from(new Set([
    ...getPredefinedSubjects(bundleYear, bundleSemester),
    ...notes.filter(n => n.year === bundleYear && n.semester === Number(bundleSemester)).map(n => n.subject)
  ]));

  const availableSubjectsForEditingBundle = editingBundle ? Array.from(new Set([
    ...getPredefinedSubjects(editingBundle.year, editingBundle.semester),
    ...notes.filter(n => n.year === editingBundle.year && n.semester === Number(editingBundle.semester)).map(n => n.subject)
  ])) : [];

  // Filter notes available for selection in the subject bundle
  const availableNotesForSubjBundle = notes.filter(
    n => n.year === subjBundleYear && n.semester === Number(subjBundleSemester) && n.subject.toLowerCase() === subjBundleSubject.toLowerCase()
  );

  // Reset selected subjects if year or semester changes in Add Bundle form
  useEffect(() => {
    setSelectedSubjects([]);
  }, [bundleYear, bundleSemester]);

  // Reset selected checkboxes if year, semester, or subject changes in Add Subject Bundle form
  useEffect(() => {
    setSubjBundleSelectedNotesIds([]);
  }, [subjBundleYear, subjBundleSemester, subjBundleSubject]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container section-padding fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="auth-card glass-card" style={{ textAlign: 'center', padding: '30px', borderColor: 'var(--color-error)' }}>
          <ShieldAlert size={48} className="red-accent" style={{ margin: '0 auto 16px', color: 'var(--color-error)' }} />
          <h3>Access Denied</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', margin: '8px 0 20px' }}>
            Only administrators are authorized to access this console.
          </p>
          <button className="btn-primary" onClick={() => navigate('landing')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-container fade-in" style={{ paddingBottom: '80px', textAlign: 'left' }}>
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Admin Management Console</h2>
        <p className="section-subtitle">Manage study notes, edit custom bundles, sync video playlists, and unlock student licenses.</p>
      </div>

      {/* Tab controls */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button 
          className={`sem-filter-btn ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('uploads')}
        >
          <FilePlus size={16} style={{ marginRight: '6px' }} /> Upload Forms
        </button>
        <button 
          className={`sem-filter-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <FolderHeart size={16} style={{ marginRight: '6px' }} /> Inventory Manager
        </button>
        <button 
          className={`sem-filter-btn ${activeTab === 'licenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('licenses')}
        >
          <Key size={16} style={{ marginRight: '6px' }} /> Student Keys Locker
        </button>
        <button 
          className={`sem-filter-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('sessions');
            fetchActiveSessions();
          }}
        >
          <Smartphone size={16} style={{ marginRight: '6px' }} /> Active Sessions ({activeSessions.length})
        </button>
      </div>

      {successMsg && (
        <div className="security-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed var(--color-success)', color: 'var(--color-success)', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '30px 0' }} className="fade-in">
          <div className="skeleton-box" style={{ width: '100%', height: '140px', borderRadius: '18px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="skeleton-box" style={{ width: '100%', height: '120px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ width: '100%', height: '120px', borderRadius: '16px' }}></div>
          </div>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* TAB 1: UPLOAD FORMS */}
          {/* ============================================================== */}
          {activeTab === 'uploads' && (
            <div className="admin-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Note Form Card */}
                <div className="admin-form-card glass-card">
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="blue-accent">
                    <FilePlus size={20} /> Add New Notes Pack
                  </h3>
                  <form onSubmit={handleAddNote} className="auth-form">
                    <div className="form-group">
                      <label>Resource Type</label>
                      <select value={noteType} onChange={(e) => setNoteType(e.target.value as 'notes' | 'pyqs')}>
                        <option value="notes">Study Notes / Syllabus Guide</option>
                        <option value="pyqs">Previous Year Questions (PYQs)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Note Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Operating Systems Unit 1-5 Hand-written"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Subject</label>
                      <select 
                        value={isCustomSubject ? '__custom__' : noteSubject} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsCustomSubject(true);
                            setNoteSubject('');
                          } else {
                            setIsCustomSubject(false);
                            setNoteSubject(val);
                          }
                        }}
                      >
                        {getPredefinedSubjects(noteYear, noteSemester).map((subj, idx) => (
                          <option key={idx} value={subj}>{subj}</option>
                        ))}
                        <option value="__custom__">+ Enter Custom Subject...</option>
                      </select>
                    </div>

                    {isCustomSubject && (
                      <div className="form-group">
                        <label>Custom Subject Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Operating Systems"
                          value={noteSubject}
                          onChange={(e) => setNoteSubject(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Year</label>
                        <select value={noteYear} onChange={(e) => setNoteYear(e.target.value as any)}>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Semester</label>
                        <select 
                          value={noteSemester}
                          onChange={(e) => setNoteSemester(Number(e.target.value))}
                        >
                          {getSemesterOptionsForYear(noteYear).map(sem => (
                            <option key={sem.value} value={sem.value}>{sem.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Discounted Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={notePrice}
                          onChange={(e) => setNotePrice(Number(e.target.value))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Original Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={noteOriginalPrice}
                          onChange={(e) => setNoteOriginalPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Pages Count</label>
                      <input 
                        type="number" 
                        min="1"
                        value={notePages}
                        onChange={(e) => setNotePages(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        placeholder="Enter short syllabus details..."
                        value={noteDesc}
                        onChange={(e) => setNoteDesc(e.target.value)}
                        style={{ minHeight: '80px' }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Topics (comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. CPU Scheduling, Semaphores, Paging"
                        value={noteTopics}
                        onChange={(e) => setNoteTopics(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Upload Notes PDF File</label>
                      <div style={{ position: 'relative', border: '2px dashed var(--glass-border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input 
                          type="file" 
                          accept="application/pdf"
                          onChange={(e) => handleFileChange(e, false)}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <BookOpen size={24} style={{ color: selectedFile ? 'var(--color-yellow)' : 'var(--color-muted)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--color-white)', fontWeight: '600' }}>
                          {selectedFile ? selectedFile.name : 'Click to select PDF or Drag-and-Drop'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Format` : 'PDF files only (hand-written or digital)'}
                        </span>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }} disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />
                          Uploading PDF to Storage...
                        </>
                      ) : 'Publish Notes Pack'}
                    </button>
                  </form>
                </div>

                {/* Subject Bundle Form Card */}
                <div className="admin-form-card glass-card" style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="blue-accent">
                    <Layers size={20} /> Create Subject Bundle
                  </h3>
                  <form onSubmit={handleAddSubjectBundle} className="auth-form">
                    <div className="form-group">
                      <label>Bundle Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Data Structures All-in-One Complete Bundle"
                        value={subjBundleTitle}
                        onChange={(e) => setSubjBundleTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Year</label>
                        <select value={subjBundleYear} onChange={(e) => setSubjBundleYear(e.target.value as any)}>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Semester</label>
                        <select 
                          value={subjBundleSemester}
                          onChange={(e) => setSubjBundleSemester(Number(e.target.value))}
                        >
                          {getSemesterOptionsForYear(subjBundleYear).map(sem => (
                            <option key={sem.value} value={sem.value}>{sem.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Subject</label>
                      <select 
                        value={isCustomSubjBundleSubject ? '__custom__' : subjBundleSubject} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsCustomSubjBundleSubject(true);
                            setSubjBundleSubject('');
                          } else {
                            setIsCustomSubjBundleSubject(false);
                            setSubjBundleSubject(val);
                          }
                        }}
                      >
                        {getPredefinedSubjects(subjBundleYear, subjBundleSemester).map((subj, idx) => (
                          <option key={idx} value={subj}>{subj}</option>
                        ))}
                        <option value="__custom__">+ Enter Custom Subject...</option>
                      </select>
                    </div>

                    {isCustomSubjBundleSubject && (
                      <div className="form-group">
                        <label>Custom Subject Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Data Structure"
                          value={subjBundleSubject}
                          onChange={(e) => setSubjBundleSubject(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Bundle Discount Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={subjBundlePrice}
                          onChange={(e) => setSubjBundlePrice(Number(e.target.value))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Original Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={subjBundleOriginalPrice}
                          onChange={(e) => setSubjBundleOriginalPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Bundle Description</label>
                      <textarea 
                        placeholder="Includes syllabus notes, all units, previous year questions, solutions..."
                        value={subjBundleDesc}
                        onChange={(e) => setSubjBundleDesc(e.target.value)}
                        style={{ minHeight: '80px' }}
                        required
                      />
                    </div>

                    {/* Selected Notes Checkbox list */}
                    <div className="form-group">
                      <label>Select Included Notes (filtered by Year/Sem/Subject)</label>
                      {availableNotesForSubjBundle.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          {availableNotesForSubjBundle.map(note => (
                            <label key={note.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-white)', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                              <input 
                                type="checkbox" 
                                checked={subjBundleSelectedNotesIds.includes(note.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSubjBundleSelectedNotesIds([...subjBundleSelectedNotesIds, note.id]);
                                  } else {
                                    setSubjBundleSelectedNotesIds(subjBundleSelectedNotesIds.filter(id => id !== note.id));
                                  }
                                }}
                              />
                              <span>{note.title} <strong style={{ color: note.type === 'pyqs' ? '#60a5fa' : '#34d399', fontSize: '10px' }}>({note.type === 'pyqs' ? 'PYQ' : 'Notes'})</strong></span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                          No subject notes found for {subjBundleYear} Semester {subjBundleSemester} subject "{subjBundleSubject}" yet. Publish notes for this subject first!
                        </p>
                      )}
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }} disabled={subjBundleSelectedNotesIds.length === 0}>
                      Create Subject Bundle
                    </button>
                  </form>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Bundle Form Card */}
                <div className="admin-form-card glass-card">
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="yellow-accent">
                    <Layers size={20} /> Create Semester Combo Bundle
                  </h3>
                  <form onSubmit={handleAddBundle} className="auth-form">
                    <div className="form-group">
                      <label>Bundle Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. BTech 2nd Year Sem 4 CSE Combo Pack"
                        value={bundleTitle}
                        onChange={(e) => setBundleTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Year</label>
                        <select value={bundleYear} onChange={(e) => setBundleYear(e.target.value as any)}>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Semester</label>
                        <select 
                          value={bundleSemester}
                          onChange={(e) => setBundleSemester(Number(e.target.value))}
                        >
                          {getSemesterOptionsForYear(bundleYear).map(sem => (
                            <option key={sem.value} value={sem.value}>{sem.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Combo Discount Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={bundlePrice}
                          onChange={(e) => setBundlePrice(Number(e.target.value))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Original Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={bundleOriginalPrice}
                          onChange={(e) => setBundleOriginalPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Bundle Description</label>
                      <textarea 
                        placeholder="Includes all notes files for the semester..."
                        value={bundleDesc}
                        onChange={(e) => setBundleDesc(e.target.value)}
                        style={{ minHeight: '80px' }}
                        required
                      />
                    </div>

                    {/* Selected Subjects Checkbox list */}
                    <div className="form-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ margin: 0 }}>Select Included Subjects (filtered by Year/Sem)</label>
                        {availableSubjectsForBundle.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              type="button" 
                              onClick={() => setSelectedSubjects([...availableSubjectsForBundle])}
                              style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-yellow)', border: '1px solid var(--color-yellow)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: '700' }}
                            >
                              Select All ({availableSubjectsForBundle.length})
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSelectedSubjects([])}
                              style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                      </div>
                      {availableSubjectsForBundle.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          {availableSubjectsForBundle.map((subject, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-white)', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedSubjects.includes(subject)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubjects([...selectedSubjects, subject]);
                                  } else {
                                    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                  }
                                }}
                              />
                              <span>{subject}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                          No subjects configured for {bundleYear} Semester {bundleSemester} yet.
                        </p>
                      )}
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }} disabled={selectedSubjects.length === 0}>
                      Create Combo Bundle
                    </button>
                  </form>
                </div>

                {/* Video Sync Form Card */}
                <div className="admin-form-card glass-card">
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="blue-accent">
                    <Video size={20} /> Sync YouTube Playlist
                  </h3>
                  <form onSubmit={handleAddPlaylist} className="auth-form">
                    <div className="form-group">
                      <label>YouTube Playlist ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. PLkIvxvvDMKq2jDKPhRgh..."
                        value={playPlaylistId}
                        onChange={(e) => setPlayPlaylistId(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Playlist Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Operating System Lectures"
                        value={playTitle}
                        onChange={(e) => setPlayTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Subject</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Operating Systems"
                        value={playSubject}
                        onChange={(e) => setPlaySubject(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Year</label>
                        <select value={playYear} onChange={(e) => setPlayYear(e.target.value as any)}>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Semester</label>
                        <select 
                          value={playSemester}
                          onChange={(e) => setPlaySemester(Number(e.target.value))}
                        >
                          {getSemesterOptionsForYear(playYear).map(sem => (
                            <option key={sem.value} value={sem.value}>{sem.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Custom Thumbnail URL (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Leave empty for auto YouTube thumbnail"
                        value={playThumb}
                        onChange={(e) => setPlayThumb(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }}>
                      Sync Video Playlist
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: INVENTORY MANAGER */}
          {/* ============================================================== */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Back to All Editors button when an editor is active */}
              {inventoryActiveEditor !== null && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setInventoryActiveEditor(null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '800',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      color: 'var(--color-white)',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={16} /> Back to Inventory Hub
                  </button>

                  <span style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600' }}>
                    Active Editor: <strong style={{ color: 'var(--color-yellow)' }}>
                      {inventoryActiveEditor === 'notes' ? 'Notes Packages Editor' :
                       inventoryActiveEditor === 'combos' ? 'Semester Combo Packs Editor' :
                       inventoryActiveEditor === 'subjects' ? 'Subject All-In-One Packs Editor' : 'YouTube Playlists Editor'}
                    </strong>
                  </span>
                </div>
              )}

              {/* 🎴 VIEW MODE 1: MASTER 4-CARDS HUB (VISIBLE ONLY WHEN NO EDITOR IS OPEN) */}
              {inventoryActiveEditor === null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
                  
                  {/* Reset Database Cache Block */}
                  <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)', borderRadius: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h4 style={{ color: 'var(--color-white)', fontSize: '15px', fontWeight: '700' }}>Reset Local Database Cache</h4>
                      <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '2px' }}>
                        Clear all pre-populated mock notes, combos, and synced keys to start with a completely empty registry for testing.
                      </p>
                    </div>
                    <button 
                      className="btn-secondary" 
                      style={{ borderColor: '#ef4444', color: '#f87171', padding: '10px 20px', fontSize: '13px' }}
                      onClick={async () => {
                        if (confirm('WARNING: This will wipe out all cached notes, bundles, playlists, and manual student licenses in your browser. This cannot be undone. Proceed?')) {
                          await (dbService as any).clearDatabase();
                          showNotification('Database cleared! Refreshing inventory...');
                          loadInventory();
                        }
                      }}
                    >
                      Clear All Data
                    </button>
                  </div>

                  {/* 4 CARDS GRID (EXACTLY 2 CARDS PER ROW ON DESKTOP) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                    
                    {/* CARD 1: NOTES PACKAGES EDITOR */}
                    <div 
                      className="glass-card library-hub-card fade-in"
                      style={{
                        borderRadius: '24px',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        background: 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
                        padding: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        minHeight: '260px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                      onClick={() => setInventoryActiveEditor('notes')}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '18px',
                            background: 'rgba(59, 130, 246, 0.18)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#60a5fa',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                          }}>
                            <FolderHeart size={30} />
                          </div>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            color: '#60a5fa',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '4px 14px',
                            borderRadius: '100px'
                          }}>
                            {notes.length} Packs Total
                          </span>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 8px' }}>
                          Notes Packages Editor
                        </h3>

                        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                          Manage individual unit study notes, hand-written guides & exam PYQ papers across all semesters.
                        </p>
                      </div>

                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '24px',
                          padding: '12px 18px',
                          fontSize: '14px',
                          fontWeight: '800',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        Open Notes Packages Editor →
                      </button>
                    </div>

                    {/* CARD 2: SEMESTER COMBO PACKS EDITOR */}
                    <div 
                      className="glass-card library-hub-card fade-in"
                      style={{
                        borderRadius: '24px',
                        border: '1px solid rgba(251, 191, 36, 0.35)',
                        background: 'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
                        padding: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        minHeight: '260px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                      onClick={() => setInventoryActiveEditor('combos')}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '18px',
                            background: 'rgba(251, 191, 36, 0.18)',
                            border: '1px solid rgba(251, 191, 36, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-yellow)',
                            boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)'
                          }}>
                            <Layers size={30} />
                          </div>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            color: 'var(--color-yellow)',
                            background: 'rgba(251, 191, 36, 0.15)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            padding: '4px 14px',
                            borderRadius: '100px'
                          }}>
                            {bundles.filter(b => deriveBundleType(b) === 'semester').length} Combos Total
                          </span>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 8px' }}>
                          Semester Combo Packs Editor
                        </h3>

                        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                          Manage multi-subject complete semester bundles, pricing, included subjects, and discounts.
                        </p>
                      </div>

                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '24px',
                          padding: '12px 18px',
                          fontSize: '14px',
                          fontWeight: '800',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#0f172a',
                          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        Open Semester Combo Editor →
                      </button>
                    </div>

                    {/* CARD 3: SUBJECT ALL-IN-ONE PACKS EDITOR */}
                    <div 
                      className="glass-card library-hub-card fade-in"
                      style={{
                        borderRadius: '24px',
                        border: '1px solid rgba(167, 139, 250, 0.35)',
                        background: 'radial-gradient(circle at 0% 0%, rgba(167, 139, 250, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
                        padding: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        minHeight: '260px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                      onClick={() => setInventoryActiveEditor('subjects')}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '18px',
                            background: 'rgba(167, 139, 250, 0.18)',
                            border: '1px solid rgba(167, 139, 250, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a78bfa',
                            boxShadow: '0 0 20px rgba(167, 139, 250, 0.2)'
                          }}>
                            <BookOpen size={30} />
                          </div>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            color: '#a78bfa',
                            background: 'rgba(167, 139, 250, 0.15)',
                            border: '1px solid rgba(167, 139, 250, 0.3)',
                            padding: '4px 14px',
                            borderRadius: '100px'
                          }}>
                            {bundles.filter(b => deriveBundleType(b) === 'subject').length} Packs Total
                          </span>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 8px' }}>
                          Subject All-In-One Packs Editor
                        </h3>

                        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                          Manage single-subject bundles containing Unit 1-5 notes & exam solved PYQ papers.
                        </p>
                      </div>

                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '24px',
                          padding: '12px 18px',
                          fontSize: '14px',
                          fontWeight: '800',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        Open Subject Packs Editor →
                      </button>
                    </div>

                    {/* CARD 4: YOUTUBE PLAYLISTS EDITOR */}
                    <div 
                      className="glass-card library-hub-card fade-in"
                      style={{
                        borderRadius: '24px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        background: 'radial-gradient(circle at 0% 0%, rgba(239, 68, 68, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
                        padding: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        minHeight: '260px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                      onClick={() => setInventoryActiveEditor('playlists')}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '18px',
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f87171',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
                          }}>
                            <Video size={30} />
                          </div>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            color: '#f87171',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '4px 14px',
                            borderRadius: '100px'
                          }}>
                            {playlists.length} Lists Synced
                          </span>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 8px' }}>
                          YouTube Playlists Editor
                        </h3>

                        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                          Manage embedded YouTube video lecture playlists mapped to specific subjects and semesters.
                        </p>
                      </div>

                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '24px',
                          padding: '12px 18px',
                          fontSize: '14px',
                          fontWeight: '800',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        Open YouTube Playlists Editor →
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* 🟨 VIEW MODE 2: ISOLATED INDIVIDUAL EDITOR VIEWS */}

              {/* EDITOR 1: NOTES PACKAGES EDITOR */}
              {inventoryActiveEditor === 'notes' && (() => {
                const filteredNotesList = notes.filter(n => {
                  const matchesSem = notesFilterSem === 'all' || n.semester === notesFilterSem;
                  const matchesSubj = notesFilterSubject === 'all' || n.subject.toLowerCase() === notesFilterSubject.toLowerCase();
                  const matchesQuery = !notesSearchQuery.trim() || 
                    n.title.toLowerCase().includes(notesSearchQuery.toLowerCase()) || 
                    n.subject.toLowerCase().includes(notesSearchQuery.toLowerCase());
                  return matchesSem && matchesSubj && matchesQuery;
                }).sort((a, b) => {
                  if (a.semester !== b.semester) return a.semester - b.semester;
                  if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
                  return a.type === 'notes' ? -1 : 1;
                });

                const availableInventorySubjects = Array.from(new Set(
                  notes
                    .filter(n => notesFilterSem === 'all' || n.semester === notesFilterSem)
                    .map(n => n.subject)
                    .filter(Boolean)
                )).sort();

                return (
                  <div className="admin-list-card glass-card fade-in" style={{ padding: '24px' }}>
                    {/* Header with Search & Subject Filter controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }} className="blue-accent">
                        <FolderHeart size={20} /> Notes Packages Editor ({filteredNotesList.length} of {notes.length} Packs)
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '180px' }}>
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                          <input 
                            type="text"
                            placeholder="Search notes or subject..."
                            value={notesSearchQuery}
                            onChange={(e) => setNotesSearchQuery(e.target.value)}
                            style={{
                              padding: '6px 10px 6px 30px',
                              fontSize: '12px',
                              borderRadius: '8px',
                              border: '1px solid var(--glass-border)',
                              background: 'rgba(0, 0, 0, 0.4)',
                              color: '#fff',
                              outline: 'none',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Subject Filter Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Filter size={14} style={{ color: 'var(--color-muted)' }} />
                          <select 
                            value={notesFilterSubject}
                            onChange={(e) => setNotesFilterSubject(e.target.value)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '12px',
                              borderRadius: '8px',
                              border: '1px solid var(--glass-border)',
                              background: 'rgba(10, 17, 43, 0.9)',
                              color: '#fff',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="all">All Subjects ({availableInventorySubjects.length})</option>
                            {availableInventorySubjects.map((subj, idx) => (
                              <option key={idx} value={subj}>{subj}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Semester-Wise Filter Tabs */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <button 
                        onClick={() => { setNotesFilterSem('all'); setNotesFilterSubject('all'); }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: notesFilterSem === 'all' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: notesFilterSem === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: notesFilterSem === 'all' ? '#60a5fa' : 'var(--color-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        All Semesters ({notes.length})
                      </button>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                        const countForSem = notes.filter(n => n.semester === semNum).length;
                        const isActive = notesFilterSem === semNum;
                        return (
                          <button 
                            key={semNum}
                            onClick={() => { setNotesFilterSem(semNum); setNotesFilterSubject('all'); }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: isActive ? '1px solid var(--color-yellow)' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: isActive ? '#fcd34d' : 'var(--color-muted)',
                              cursor: 'pointer',
                              opacity: countForSem === 0 && !isActive ? 0.45 : 1,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Sem {semNum} ({countForSem})
                          </button>
                        );
                      })}
                    </div>

                    {/* Table View */}
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Subject & Note Title</th>
                            <th>Type</th>
                            <th>Year & Sem</th>
                            <th>Price (Disc / Orig)</th>
                            <th>Pages</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredNotesList.length > 0 ? (
                            filteredNotesList.map(n => (
                              <tr key={n.id}>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: '700', color: 'var(--color-white)', fontSize: '13px' }}>{n.title}</span>
                                    <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600' }}>{n.subject}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="bundle-banner-badge" style={{ 
                                    background: n.type === 'pyqs' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: n.type === 'pyqs' ? '#60a5fa' : '#34d399',
                                    border: n.type === 'pyqs' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    display: 'inline-block'
                                  }}>
                                    {n.type === 'pyqs' ? 'Exam PYQ' : 'Study Notes'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ color: 'var(--color-muted)', fontSize: '12px', fontWeight: '600' }}>
                                    {n.year} (Sem {n.semester})
                                  </span>
                                </td>
                                <td className="yellow-accent" style={{ fontWeight: '700' }}>
                                  ₹{n.price} <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '11px', fontWeight: 'normal', marginLeft: '4px' }}>₹{n.originalPrice ?? (n.price + 100)}</span>
                                </td>
                                <td>{n.pagesCount} pgs</td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button 
                                      className="btn-secondary" 
                                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={async () => {
                                        const { data: fullNote } = await dbService.getNoteById(n.id);
                                        const noteToUse = fullNote || n;
                                        setEditingNote(noteToUse);
                                        setEditTopicsText(Array.isArray(noteToUse.topics) ? noteToUse.topics.join(', ') : noteToUse.topics);
                                      }}
                                    >
                                      <Edit2 size={12} /> Edit
                                    </button>
                                    <button 
                                      className="btn-secondary" 
                                      style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleDeleteNote(n.id)}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', fontStyle: 'italic', padding: '24px' }}>
                                No notes found for the selected semester / subject filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* EDITOR 2: SEMESTER COMBO PACKS EDITOR */}
              {inventoryActiveEditor === 'combos' && (() => {
                const semesterCombos = bundles.filter(b => deriveBundleType(b) === 'semester');

                return (
                  <div className="admin-list-card glass-card fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }} className="yellow-accent">
                      <Layers size={20} /> Semester Combo Packs Editor ({semesterCombos.length} Combos)
                    </h3>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Combo Title</th>
                            <th>Year & Sem</th>
                            <th>Included Subjects (Priority View)</th>
                            <th>Price (Disc / Orig)</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semesterCombos.length > 0 ? (
                            semesterCombos.map(b => {
                              const includedSubjs = (b.subjects && b.subjects.length > 0) 
                                ? b.subjects 
                                : getPredefinedSubjects(b.year, b.semester);

                              return (
                                <tr key={b.id}>
                                  <td style={{ fontWeight: '600' }}>{b.title}</td>
                                  <td style={{ color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{b.year} (Sem {b.semester})</td>
                                  <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '420px', padding: '4px 0' }}>
                                      {includedSubjs.map((subj, sIdx) => (
                                        <span key={sIdx} style={{
                                          background: 'rgba(245, 158, 11, 0.12)',
                                          color: '#fcd34d',
                                          border: '1px solid rgba(245, 158, 11, 0.28)',
                                          borderRadius: '6px',
                                          padding: '3px 9px',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}>
                                          {subj}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="yellow-accent" style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>
                                    ₹{b.price} <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '11px', fontWeight: 'normal', marginLeft: '4px' }}>₹{b.originalPrice ?? (b.price + 100)}</span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => setEditingBundle(b)}
                                      >
                                        <Edit2 size={12} /> Edit
                                      </button>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => handleDeleteBundle(b.id)}
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', fontStyle: 'italic', padding: '20px' }}>
                                No semester combo packs created yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* EDITOR 3: SUBJECT ALL-IN-ONE PACKS EDITOR */}
              {inventoryActiveEditor === 'subjects' && (() => {
                const subjectPacks = bundles.filter(b => deriveBundleType(b) === 'subject');

                return (
                  <div className="admin-list-card glass-card fade-in" style={{ padding: '24px', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
                    <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#a78bfa' }}>
                      <BookOpen size={20} /> Subject All-In-One Packs Editor ({subjectPacks.length} Packs)
                    </h3>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Subject Pack Title</th>
                            <th>Target Subject / Sem</th>
                            <th>Notes & PYQs Included</th>
                            <th>Price (Disc / Orig)</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectPacks.length > 0 ? (
                            subjectPacks.map(b => {
                              const includedSubjs = (b.subjects && b.subjects.length > 0) 
                                ? b.subjects 
                                : [b.subject || b.title];

                              return (
                                <tr key={b.id}>
                                  <td style={{ fontWeight: '600' }}>{b.title}</td>
                                  <td style={{ color: '#a78bfa', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                    {b.subject || b.title} <span style={{ color: 'var(--color-muted)', fontSize: '11px', fontWeight: 'normal' }}>(Sem {b.semester})</span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '420px', padding: '4px 0' }}>
                                      {includedSubjs.map((subj, sIdx) => (
                                        <span key={sIdx} style={{
                                          background: 'rgba(167, 139, 250, 0.12)',
                                          color: '#c4b5fd',
                                          border: '1px solid rgba(167, 139, 250, 0.3)',
                                          borderRadius: '6px',
                                          padding: '3px 9px',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}>
                                          {subj}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ color: '#a78bfa', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                    ₹{b.price} <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '11px', fontWeight: 'normal', marginLeft: '4px' }}>₹{b.originalPrice ?? (b.price + 100)}</span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => setEditingBundle(b)}
                                      >
                                        <Edit2 size={12} /> Edit
                                      </button>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => handleDeleteBundle(b.id)}
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', fontStyle: 'italic', padding: '20px' }}>
                                No subject all-in-one packs created yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* EDITOR 4: YOUTUBE PLAYLISTS EDITOR */}
              {inventoryActiveEditor === 'playlists' && (
                <div className="admin-list-card glass-card fade-in" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }} className="blue-accent">
                    <Video size={20} /> Synced YouTube Playlists ({playlists.length} Lists)
                  </h3>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Playlist Title</th>
                          <th>Subject Category</th>
                          <th>Year / Semester</th>
                          <th>Playlist ID</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playlists.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: '600' }}>{p.title}</td>
                            <td style={{ color: 'var(--color-muted)' }}>{p.subject}</td>
                            <td>
                              <span className="badge badge-year" style={{ marginRight: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', padding: '2px 8px', borderRadius: '100px', fontSize: '11px' }}>{p.year}</span>
                              <span className="badge badge-semester" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', padding: '2px 8px', borderRadius: '100px', fontSize: '11px' }}>Sem {p.semester}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.playlistId}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                                onClick={() => handleDeletePlaylist(p.id)}
                              >
                                <Trash2 size={12} /> Unsync
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: LICENSES MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'licenses' && (
            <div className="admin-grid">
              {/* Grant License Card */}
              <div className="admin-form-card glass-card" style={{ height: 'fit-content' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="yellow-accent">
                  <Key size={20} /> Grant Student License Key
                </h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '20px' }}>
                  Manually unlock notes or bundles for students who make offline payments (UPI, Cash, etc.).
                </p>
                <form onSubmit={handleGrantLicense} className="auth-form">
                  <div className="form-group">
                    <label>Student Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. student@gmail.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Resource Type</label>
                    <select 
                      value={licenseType} 
                      onChange={(e) => setLicenseType(e.target.value as any)}
                    >
                      <option value="notes">Individual Notes Pack</option>
                      <option value="subject">Subject Combo Pack (All Notes for a Subject)</option>
                      <option value="bundle">Semester Combo Pack</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Choose Unlock Item</label>
                    <select 
                      value={selectedLicenseItem} 
                      onChange={(e) => setSelectedLicenseItem(e.target.value)}
                      required
                    >
                      {licenseType === 'notes' ? (
                        <optgroup label="Individual Notes & PYQs">
                          {notes.map(n => (
                            <option key={n.id} value={n.id}>[{n.type === 'pyqs' ? 'PYQ' : 'Notes'}] {n.title} (Sem {n.semester})</option>
                          ))}
                        </optgroup>
                      ) : licenseType === 'subject' ? (
                        (() => {
                          const subjectPacks = bundles.filter(b => deriveBundleType(b) === 'subject');
                          const semesterBundles = bundles.filter(b => deriveBundleType(b) === 'semester');
                          return (
                            <>
                              {subjectPacks.length > 0 && (
                                <optgroup label="Subject All-In-One Packs & Bundles">
                                  {subjectPacks.map(b => (
                                    <option key={b.id} value={b.id}>[Subject Pack] {b.title} ({b.year || '2nd Year'}, Sem {b.semester || 4})</option>
                                  ))}
                                </optgroup>
                              )}
                              {semesterBundles.length > 0 && (
                                <optgroup label="Semester Combo Bundles">
                                  {semesterBundles.map(b => (
                                    <option key={b.id} value={b.id}>[Semester Bundle] {b.title} ({b.year || '2nd Year'}, Sem {b.semester || 4})</option>
                                  ))}
                                </optgroup>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        (() => {
                          const semesterBundles = bundles.filter(b => deriveBundleType(b) === 'semester');
                          const subjectPacks = bundles.filter(b => deriveBundleType(b) === 'subject');
                          return (
                            <>
                              {semesterBundles.length > 0 && (
                                <optgroup label="Semester Combo Bundles">
                                  {semesterBundles.map(b => (
                                    <option key={b.id} value={b.id}>[Semester Bundle] {b.title} ({b.year || '2nd Year'}, Sem {b.semester || 4})</option>
                                  ))}
                                </optgroup>
                              )}
                              {subjectPacks.length > 0 && (
                                <optgroup label="Subject All-In-One Packs & Bundles">
                                  {subjectPacks.map(b => (
                                    <option key={b.id} value={b.id}>[Subject Pack] {b.title} ({b.year || '2nd Year'}, Sem {b.semester || 4})</option>
                                  ))}
                                </optgroup>
                              )}
                            </>
                          );
                        })()
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>License Validity Duration</label>
                    <select 
                      value={licenseMonths} 
                      onChange={(e) => setLicenseMonths(Number(e.target.value))}
                    >
                      <option value="6">6 Months Validity (Standard)</option>
                      <option value="12">12 Months (Extended)</option>
                      <option value="120">Lifetime Access (Admin Grant)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }}>
                    Grant License Access
                  </button>
                </form>
              </div>

              {/* Active License Transactions */}
              {(() => {
                const filteredPurchases = purchases.filter(p => {
                  if (!licenseSearchQuery.trim()) return true;
                  const q = licenseSearchQuery.toLowerCase().trim();
                  const email = (p.userEmail || p.userId || '').toLowerCase();
                  const name = (p.userName || '').toLowerCase();
                  const item = (p.itemName || p.itemId || '').toLowerCase();
                  return email.includes(q) || name.includes(q) || item.includes(q);
                });

                return (
                  <div className="admin-list-card glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }} className="blue-accent">
                        <Users size={20} /> Active Licenses Registry ({filteredPurchases.length} / {purchases.length} Keys)
                      </h3>
                      {purchases.length > 0 && (
                        <button 
                          type="button"
                          className="btn-secondary" 
                          style={{
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '8px'
                          }}
                          onClick={handleRevokeAllLicenses}
                        >
                          <Trash2 size={13} /> Revoke All Licenses
                        </button>
                      )}
                    </div>

                    {/* Candidate Search Bar */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                      <input
                        type="text"
                        value={licenseSearchQuery}
                        maxLength={100}
                        onChange={(e) => setLicenseSearchQuery(sanitizeSearchQuery(e.target.value))}
                        placeholder="Search candidate by email ID, student name, or item name..."
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 40px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: 'var(--color-white)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {licenseSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setLicenseSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'var(--color-white)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          ✕ Clear
                        </button>
                      )}
                    </div>
                    
                    {purchases.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                        <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '14px' }}>No active unlocked notes licenses registered yet.</p>
                      </div>
                    ) : filteredPurchases.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                        <Search size={28} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                        <p style={{ fontSize: '14px', margin: 0 }}>No licenses found matching "{licenseSearchQuery}"</p>
                      </div>
                    ) : (
                      <div className="admin-table-wrapper" style={{ flexGrow: 1 }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Student Email</th>
                              <th>Unlocked Item Name</th>
                              <th>Expiry Date</th>
                              <th style={{ textAlign: 'right' }}>Access Control</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPurchases.map(p => {
                          const expDate = new Date(p.expiresAt);
                          const isExpired = expDate < new Date();
                          const formattedDate = isExpired ? 'Expired' : expDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <tr key={p.id}>
                              <td style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-white)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--color-white)', fontSize: '13px' }}>
                                    {p.userEmail || p.userId || 'Student'}
                                  </span>
                                  {p.userName && (
                                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '500' }}>
                                      {p.userName}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontSize: '13px', color: 'var(--color-white)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                  {(() => {
                                    const itemTypeLower = ((p.itemType as string) || '').toLowerCase();
                                    const itemIdLower = (p.itemId || '').toLowerCase();
                                    const itemNameLower = (p.itemName || '').toLowerCase();

                                    const isExplicitIndividualNote = 
                                      itemTypeLower === 'note' || 
                                      itemTypeLower === 'notes' || 
                                      itemTypeLower === 'unit' || 
                                      itemTypeLower === 'file' ||
                                      itemIdLower.startsWith('note_') || 
                                      itemIdLower.startsWith('unit_') ||
                                      itemIdLower.includes('_unit') ||
                                      itemNameLower.includes('unit ');

                                    let isSem = false;
                                    let isSub = false;

                                    if (!isExplicitIndividualNote) {
                                      const foundBundle = bundles.find(b => b.id === p.itemId);
                                      const derivedType = (itemTypeLower === 'subject' || itemTypeLower === 'semester')
                                        ? itemTypeLower
                                        : (foundBundle ? deriveBundleType(foundBundle) : 'individual');

                                      isSem = derivedType === 'semester';
                                      isSub = derivedType === 'subject';
                                    }

                                    return (
                                      <span className={`semester-tag ${isSem ? 'yellow-accent' : isSub ? 'purple-accent' : 'blue-accent'}`} style={{ fontSize: '9px', padding: '2px 6px', marginTop: '2px', fontWeight: 'bold', flexShrink: 0 }}>
                                        {isSem ? 'SEMESTER BUNDLE' : isSub ? 'SUBJECT PACK' : 'INDIVIDUAL NOTE'}
                                      </span>
                                    );
                                  })()}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: '700', color: 'var(--color-white)', fontSize: '13px' }}>
                                      {p.itemName || p.itemId || 'Unlocked Item'}
                                    </span>
                                    {p.itemSubject && p.itemSubject !== p.itemName && (
                                      <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600' }}>
                                        📚 Subject: {p.itemSubject}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: '12px', color: isExpired ? '#ef4444' : '#34d399', fontWeight: '700' }}>
                                {formattedDate}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  onClick={() => handleRevokeLicense(p.id)}
                                >
                                  <Trash2 size={10} /> Revoke
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
            </div>
          )}

          {/* ============================================================== */}
          {/* ACTIVE DEVICE SESSIONS TAB */}
          {/* ============================================================== */}
          {activeTab === 'sessions' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }} className="blue-accent">
                    <Smartphone size={20} /> Live Device Sessions Tracker
                  </h3>
                  <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                    Real-time monitoring of all active logged-in student accounts. Terminate unauthorized or shared device sessions instantly.
                  </p>
                </div>
                <button 
                  className="btn-secondary"
                  onClick={fetchActiveSessions}
                  disabled={loadingSessions}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                >
                  <RefreshCw size={14} className={loadingSessions ? 'spin' : ''} /> {loadingSessions ? 'Refreshing...' : 'Refresh Active Sessions'}
                </button>
              </div>

              {/* Search filter */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search active sessions by student name, email, phone or session ID..."
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    style={{ paddingLeft: '38px', background: 'rgba(10, 17, 40, 0.6)' }}
                  />
                </div>
              </div>

              {/* Sessions List Table */}
              {(() => {
                const filteredSessions = activeSessions.filter(s => {
                  if (!sessionSearchQuery) return true;
                  const q = sessionSearchQuery.toLowerCase();
                  return (
                    (s.user_name || '').toLowerCase().includes(q) ||
                    (s.user_email || '').toLowerCase().includes(q) ||
                    (s.user_phone || '').toLowerCase().includes(q) ||
                    (s.session_id || '').toLowerCase().includes(q)
                  );
                });

                if (loadingSessions) {
                  return (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ marginBottom: '10px' }} />
                      <p>Fetching active device sessions from server...</p>
                    </div>
                  );
                }

                if (filteredSessions.length === 0) {
                  return (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                      <Smartphone size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
                      <p style={{ margin: 0, fontWeight: '600' }}>No Active Sessions Found</p>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>No student devices are currently active or matching your filter.</span>
                    </div>
                  );
                }

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <th style={{ padding: '10px 12px' }}>Student Profile</th>
                          <th style={{ padding: '10px 12px' }}>Active Device Session ID</th>
                          <th style={{ padding: '10px 12px' }}>Last Activity / Login</th>
                          <th style={{ padding: '10px 12px' }}>Session Status</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Terminate Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSessions.map(s => {
                          const updated = s.updated_at ? new Date(s.updated_at) : null;
                          const formattedTime = updated ? updated.toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Just now';

                          return (
                            <tr key={s.user_id + s.session_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--color-white)', fontSize: '13px' }}>
                                    {s.user_name || 'Student'}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '500' }}>
                                    {s.user_email || s.user_id}
                                  </span>
                                  {s.user_phone && s.user_phone !== 'N/A' && (
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                      📞 {s.user_phone}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  color: '#fef08a',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-block'
                                }}>
                                  {s.session_id}
                                </span>
                              </td>

                              <td style={{ padding: '12px', fontSize: '12px', color: 'var(--color-white)' }}>
                                {formattedTime}
                              </td>

                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: s.is_active ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  border: s.is_active ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                                  color: s.is_active ? '#34d399' : '#fef08a',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '20px'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.is_active ? '#34d399' : '#f59e0b', boxShadow: s.is_active ? '0 0 6px #34d399' : 'none' }}></span>
                                  {s.is_active ? 'ACTIVE DEVICE' : 'REGISTERED ACCOUNT'}
                                </span>
                              </td>

                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button 
                                  className="btn-secondary" 
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    borderColor: 'rgba(239, 68, 68, 0.4)',
                                    color: '#f87171',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={() => handleTerminateSession(s.user_id, s.user_email || s.user_name)}
                                >
                                  <LogOut size={12} /> Terminate Session
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* EDIT NOTE GLASS MODAL */}
      {/* ============================================================== */}
      {editingNote && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 7, 18, 0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(37,99,235,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="blue-accent">
              <Edit2 size={22} /> Edit Notes Pack Details
            </h3>
            <form onSubmit={handleUpdateNoteSubmit} className="auth-form">
              <div className="form-group">
                <label>Note Title</label>
                <input 
                  type="text" 
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  value={editingNote.subject}
                  onChange={(e) => setEditingNote({ ...editingNote, subject: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Resource Type</label>
                <select 
                  value={editingNote.type || 'notes'} 
                  onChange={(e) => setEditingNote({ ...editingNote, type: e.target.value as 'notes' | 'pyqs' })}
                >
                  <option value="notes">Study Notes / Syllabus Guide</option>
                  <option value="pyqs">Previous Year Questions (PYQs)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Year</label>
                  <select 
                    value={editingNote.year} 
                    onChange={(e) => {
                      const newYear = e.target.value as any;
                      const validSems = getSemesterOptionsForYear(newYear);
                      const isSemValid = validSems.some(s => s.value === editingNote.semester);
                      setEditingNote({ 
                        ...editingNote, 
                        year: newYear,
                        semester: isSemValid ? editingNote.semester : validSems[0].value
                      });
                    }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <select 
                    value={editingNote.semester}
                    onChange={(e) => setEditingNote({ ...editingNote, semester: Number(e.target.value) })}
                  >
                    {getSemesterOptionsForYear(editingNote.year).map(sem => (
                      <option key={sem.value} value={sem.value}>{sem.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Discounted Price (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingNote.price}
                    onChange={(e) => setEditingNote({ ...editingNote, price: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingNote.originalPrice || 0}
                    onChange={(e) => setEditingNote({ ...editingNote, originalPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pages Count</label>
                <input 
                  type="number" 
                  min="1"
                  value={editingNote.pagesCount}
                  onChange={(e) => setEditingNote({ ...editingNote, pagesCount: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editingNote.description}
                  onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Topics (comma-separated)</label>
                <input 
                  type="text" 
                  value={editTopicsText}
                  onChange={(e) => setEditTopicsText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Replace Notes PDF File (Optional)</label>
                <div style={{ position: 'relative', border: '2px dashed var(--glass-border)', borderRadius: '12px', padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(e, true)}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <BookOpen size={20} style={{ color: editSelectedFile ? 'var(--color-yellow)' : 'var(--color-muted)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-white)', fontWeight: '600' }}>
                    {editSelectedFile ? editSelectedFile.name : 'Choose new PDF file to overwrite'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                    {editSelectedFile ? `${(editSelectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Leave empty to keep current PDF file'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />
                      Saving & Uploading...
                    </>
                  ) : 'Save Updates'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setEditingNote(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT BUNDLE GLASS MODAL */}
      {/* ============================================================== */}
      {editingBundle && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 7, 18, 0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }} className="yellow-accent">
              <Edit2 size={22} /> Edit Combo Bundle Details
            </h3>
            <form onSubmit={handleUpdateBundleSubmit} className="auth-form">
              <div className="form-group">
                <label>Bundle Title</label>
                <input 
                  type="text" 
                  value={editingBundle.title}
                  onChange={(e) => setEditingBundle({ ...editingBundle, title: e.target.value })}
                  required
                />
              </div>

              {editingBundle.type === 'subject' && (
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    value={editingBundle.subject || ''}
                    onChange={(e) => setEditingBundle({ ...editingBundle, subject: e.target.value })}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Year</label>
                  <select 
                    value={editingBundle.year} 
                    onChange={(e) => {
                      const newYear = e.target.value as any;
                      const validSems = getSemesterOptionsForYear(newYear);
                      const isSemValid = validSems.some(s => s.value === editingBundle.semester);
                      setEditingBundle({ 
                        ...editingBundle, 
                        year: newYear,
                        semester: isSemValid ? editingBundle.semester : validSems[0].value
                      });
                    }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <select 
                    value={editingBundle.semester}
                    onChange={(e) => setEditingBundle({ ...editingBundle, semester: Number(e.target.value) })}
                  >
                    {getSemesterOptionsForYear(editingBundle.year).map(sem => (
                      <option key={sem.value} value={sem.value}>{sem.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Combo Discount Price (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingBundle.price}
                    onChange={(e) => setEditingBundle({ ...editingBundle, price: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingBundle.originalPrice || 0}
                    onChange={(e) => setEditingBundle({ ...editingBundle, originalPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bundle Description</label>
                <textarea 
                  value={editingBundle.description}
                  onChange={(e) => setEditingBundle({ ...editingBundle, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                  required
                />
              </div>

              {/* For Semester Combos: Manage Included Subjects */}
              {(editingBundle.type === 'semester' || !editingBundle.type) ? (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Manage Included Subjects (filtered by Year/Sem)</label>
                    {availableSubjectsForEditingBundle.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => setEditingBundle({ ...editingBundle, subjects: [...availableSubjectsForEditingBundle] })}
                          style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-yellow)', border: '1px solid var(--color-yellow)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: '700' }}
                        >
                          Select All ({availableSubjectsForEditingBundle.length})
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingBundle({ ...editingBundle, subjects: [] })}
                          style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    {availableSubjectsForEditingBundle.map((subject, idx) => {
                      const currentSubjects = editingBundle.subjects || [];
                      const isChecked = currentSubjects.includes(subject);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-white)', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingBundle({
                                  ...editingBundle,
                                  subjects: [...currentSubjects, subject]
                                });
                              } else {
                                setEditingBundle({
                                  ...editingBundle,
                                  subjects: currentSubjects.filter(s => s !== subject)
                                });
                              }
                            }}
                          />
                          <span>{subject}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* For Subject Bundles: Manage Included Notes */
                <div className="form-group">
                  <label>Manage Included Notes</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    {notes
                      .filter(n => n.year === editingBundle.year && n.semester === editingBundle.semester)
                      .map(note => (
                        <label key={note.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-white)', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                          <input 
                            type="checkbox" 
                            checked={editingBundle.notesIds.includes(note.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingBundle({
                                  ...editingBundle,
                                  notesIds: [...editingBundle.notesIds, note.id]
                                });
                              } else {
                                setEditingBundle({
                                  ...editingBundle,
                                  notesIds: editingBundle.notesIds.filter(id => id !== note.id)
                                });
                              }
                            }}
                          />
                          <span>{note.title} <strong style={{ color: note.type === 'pyqs' ? '#60a5fa' : '#34d399', fontSize: '10px' }}>({note.type === 'pyqs' ? 'PYQ' : 'Notes'})</strong></span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Save Updates
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setEditingBundle(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
