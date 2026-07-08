import React, { useState, useEffect } from 'react';
import { 
  FilePlus, Video, FolderHeart, ShieldAlert, Loader2, CheckCircle2, 
  Layers, Trash2, Edit2, Key, Users, AlertCircle, BookOpen 
} from 'lucide-react';
import { dbService } from '../lib/supabase';
import type { Note, UserProfile, Bundle, Purchase, Playlist } from '../lib/supabase';

interface AdminProps {
  user: UserProfile | null;
  navigate: (page: string) => void;
}

export const Admin: React.FC<AdminProps> = ({ user, navigate }) => {
  const [activeTab, setActiveTab] = useState<'uploads' | 'inventory' | 'licenses'>('uploads');
  const [notes, setNotes] = useState<Note[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [purchases, setPurchases] = useState<(Purchase & { userEmail?: string; itemName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Note Form Fields ---
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteYear, setNoteYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');
  const [noteSemester, setNoteSemester] = useState(1);
  const [notePrice, setNotePrice] = useState(99);
  const [noteDesc, setNoteDesc] = useState('');
  const [noteTopics, setNoteTopics] = useState('');
  const [notePages, setNotePages] = useState(100);
  const [noteType, setNoteType] = useState<'notes' | 'pyqs'>('notes');

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>('');
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editSelectedFileBase64, setEditSelectedFileBase64] = useState<string>('');

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
  const [bundleYear, setBundleYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('2nd Year');
  const [bundleSemester, setBundleSemester] = useState(4);
  const [selectedNotesIds, setSelectedNotesIds] = useState<string[]>([]);

  // --- License Grant Form Fields ---
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedLicenseItem, setSelectedLicenseItem] = useState('');
  const [licenseType, setLicenseType] = useState<'notes' | 'bundle'>('notes');
  const [licenseMonths, setLicenseMonths] = useState(6);

  // --- Edit Modal States ---
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTopicsText, setEditTopicsText] = useState('');
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    } else if (licenseType === 'bundle' && bundles.length > 0) {
      setSelectedLicenseItem(bundles[0].id);
    } else {
      setSelectedLicenseItem('');
    }
  }, [licenseType, notes, bundles]);

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

    if (!selectedFileBase64) {
      alert('Please upload a PDF file for these notes.');
      return;
    }

    const topicsArray = noteTopics.split(',').map(t => t.trim()).filter(Boolean);

    const notePayload = {
      title: noteTitle,
      subject: noteSubject,
      year: noteYear,
      semester: Number(noteSemester),
      price: Number(notePrice),
      description: noteDesc,
      previewUrl: selectedFileBase64, // Local Base64 PDF String or Supabase Storage URL
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
      setNotePages(100);
      setNoteType('notes');
      setSelectedFile(null);
      setSelectedFileBase64('');
      loadInventory();
    } else {
      alert(error || 'Failed to add note to database.');
    }
  };

  // Handle Note Update
  const handleUpdateNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    const topicsArray = typeof editingNote.topics === 'string'
      ? (editingNote.topics as string).split(',').map(t => t.trim()).filter(Boolean)
      : editingNote.topics;

    let updatedPreviewUrl = editingNote.previewUrl;
    if (editSelectedFileBase64) {
      updatedPreviewUrl = editSelectedFileBase64;
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
  };

  // Handle Note Deletion
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note pack? This will also remove it from any semester bundles!')) return;
    const { success } = await dbService.deleteNote(id);
    if (success) {
      showNotification('Note pack removed from database.');
      loadInventory();
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
          const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${playPlaylistId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.thumbnail_url) {
              thumbnail = data.thumbnail_url;
            }
          }
        } catch (err) {
          console.error('Error fetching playlist thumbnail:', err);
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
    if (!bundleTitle || !bundleDesc || selectedNotesIds.length === 0) {
      alert('Please fill out all bundle fields and select at least one note.');
      return;
    }

    const bundlePayload = {
      title: bundleTitle,
      description: bundleDesc,
      price: Number(bundlePrice),
      year: bundleYear,
      semester: Number(bundleSemester),
      notesIds: selectedNotesIds
    };

    const { data } = await dbService.addBundle(bundlePayload);
    if (data) {
      showNotification('Semester Combo Bundle successfully created!');
      setBundleTitle('');
      setBundleDesc('');
      setBundlePrice(149);
      setSelectedNotesIds([]);
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
    const { success } = await dbService.revokeLicense(purchaseId);
    if (success) {
      showNotification('Student access license revoked.');
      loadInventory();
    }
  };

  // Filter notes available for selection in the bundle
  const availableNotesForBundle = notes.filter(
    n => n.year === bundleYear && n.semester === Number(bundleSemester)
  );

  // Reset selected checkboxes if year or semester changes in Add Bundle form
  useEffect(() => {
    setSelectedNotesIds([]);
  }, [bundleYear, bundleSemester]);

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
      </div>

      {successMsg && (
        <div className="security-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed var(--color-success)', color: 'var(--color-success)', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', gap: '10px', alignItems: 'center', color: 'var(--color-muted)' }}>
          <Loader2 className="animate-spin" size={28} color="var(--color-blue-light)" />
          <span>Syncing locker registry...</span>
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
                      <input 
                        type="text" 
                        placeholder="e.g. Operating Systems"
                        value={noteSubject}
                        onChange={(e) => setNoteSubject(e.target.value)}
                        required
                      />
                    </div>

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
                        <input 
                          type="number" 
                          min="1" 
                          max="8"
                          value={noteSemester}
                          onChange={(e) => setNoteSemester(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Price (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={notePrice}
                          onChange={(e) => setNotePrice(Number(e.target.value))}
                        />
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

                    <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }}>
                      Publish Notes Pack
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
                        <input 
                          type="number" 
                          min="1" 
                          max="8"
                          value={bundleSemester}
                          onChange={(e) => setBundleSemester(Number(e.target.value))}
                        />
                      </div>
                    </div>

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
                      <label>Bundle Description</label>
                      <textarea 
                        placeholder="Includes all notes files for the semester..."
                        value={bundleDesc}
                        onChange={(e) => setBundleDesc(e.target.value)}
                        style={{ minHeight: '80px' }}
                        required
                      />
                    </div>

                    {/* Selected Notes Checkbox list */}
                    <div className="form-group">
                      <label>Select Included Notes (filtered by Year/Sem)</label>
                      {availableNotesForBundle.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          {availableNotesForBundle.map(note => (
                            <label key={note.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-white)', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedNotesIds.includes(note.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNotesIds([...selectedNotesIds, note.id]);
                                  } else {
                                    setSelectedNotesIds(selectedNotesIds.filter(id => id !== note.id));
                                  }
                                }}
                              />
                              <span>{note.title} <strong style={{ color: note.type === 'pyqs' ? '#60a5fa' : '#34d399', fontSize: '10px' }}>({note.type === 'pyqs' ? 'PYQ' : 'Notes'})</strong></span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                          No subject notes found for {bundleYear} Semester {bundleSemester} yet. Publish notes on the left first!
                        </p>
                      )}
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }} disabled={selectedNotesIds.length === 0}>
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
                        <input 
                          type="number" 
                          min="1" 
                          max="8"
                          value={playSemester}
                          onChange={(e) => setPlaySemester(Number(e.target.value))}
                        />
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
          {/* TAB 2: INVENTORY EDITOR */}
          {/* ============================================================== */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Reset Database Button block */}
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

              {/* Notes Inventory */}
              <div className="admin-list-card glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }} className="blue-accent">
                  <FolderHeart size={20} /> Notes Packages Editor ({notes.length} Packs)
                </h3>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Subject Title</th>
                        <th>Type</th>
                        <th>Year & Sem</th>
                        <th>Price</th>
                        <th>Pages</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map(n => (
                        <tr key={n.id}>
                          <td style={{ fontWeight: '600' }}>{n.title}</td>
                          <td>
                            <span className="bundle-banner-badge" style={{ 
                              background: n.type === 'pyqs' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: n.type === 'pyqs' ? '#60a5fa' : '#34d399',
                              border: n.type === 'pyqs' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}>
                              {n.type === 'pyqs' ? 'Exam PYQ' : 'Study Notes'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-muted)' }}>{n.year} (Sem {n.semester})</td>
                          <td className="yellow-accent" style={{ fontWeight: '700' }}>₹{n.price}</td>
                          <td>{n.pagesCount} pgs</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => {
                                  setEditingNote(n);
                                  setEditTopicsText(Array.isArray(n.topics) ? n.topics.join(', ') : n.topics);
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bundles Inventory */}
              <div className="admin-list-card glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }} className="yellow-accent">
                  <Layers size={20} /> Semester Combo Packs Editor ({bundles.length} Bundles)
                </h3>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Bundle Name</th>
                        <th>Year & Sem</th>
                        <th>Combo Price</th>
                        <th>Contents</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundles.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: '600' }}>{b.title}</td>
                          <td style={{ color: 'var(--color-muted)' }}>{b.year} (Sem {b.semester})</td>
                          <td className="yellow-accent" style={{ fontWeight: '700' }}>₹{b.price}</td>
                          <td>{b.notesIds.length} syllabus subfiles</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* YouTube Playlists Inventory */}
              <div className="admin-list-card glass-card" style={{ padding: '24px' }}>
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
                        notes.map(n => (
                          <option key={n.id} value={n.id}>[{n.type === 'pyqs' ? 'PYQ' : 'Notes'}] {n.title} (Sem {n.semester})</option>
                        ))
                      ) : (
                        bundles.map(b => (
                          <option key={b.id} value={b.id}>[Bundle] {b.title}</option>
                        ))
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
              <div className="admin-list-card glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }} className="blue-accent">
                  <Users size={20} /> Active Licenses Registry ({purchases.length} Keys)
                </h3>
                
                {purchases.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px' }}>No active unlocked notes licenses registered yet.</p>
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
                        {purchases.map(p => {
                          const expDate = new Date(p.expiresAt);
                          const isExpired = expDate < new Date();
                          const formattedDate = isExpired ? 'Expired' : expDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <tr key={p.id}>
                              <td style={{ fontWeight: '600', fontSize: '13px' }}>{p.userEmail}</td>
                              <td style={{ fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span className={`semester-tag ${p.itemType === 'bundle' ? 'yellow-accent' : 'blue-accent'}`} style={{ fontSize: '9px', padding: '2px 4px', marginRight: '6px' }}>
                                  {p.itemType.toUpperCase()}
                                </span>
                                {p.itemName}
                              </td>
                              <td style={{ fontSize: '12px', color: isExpired ? '#ef4444' : 'var(--color-yellow)', fontWeight: '600' }}>
                                {formattedDate}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
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
                    onChange={(e) => setEditingNote({ ...editingNote, year: e.target.value as any })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="8"
                    value={editingNote.semester}
                    onChange={(e) => setEditingNote({ ...editingNote, semester: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingNote.price}
                    onChange={(e) => setEditingNote({ ...editingNote, price: Number(e.target.value) })}
                  />
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
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Save Updates
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Year</label>
                  <select 
                    value={editingBundle.year} 
                    onChange={(e) => setEditingBundle({ ...editingBundle, year: e.target.value as any })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="8"
                    value={editingBundle.semester}
                    onChange={(e) => setEditingBundle({ ...editingBundle, semester: Number(e.target.value) })}
                  />
                </div>
              </div>

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
                <label>Bundle Description</label>
                <textarea 
                  value={editingBundle.description}
                  onChange={(e) => setEditingBundle({ ...editingBundle, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                  required
                />
              </div>

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
