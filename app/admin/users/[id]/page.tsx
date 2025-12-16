'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Building2,
    MapPin,
    Calendar,
    BadgeCheck,
    Clock,
    AlertCircle,
    XCircle,
    FileText,
    Image as ImageIcon,
    Eye,
    Check,
    X,
    Send,
    Loader2,
    Shield,
    MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

// ===========================================
// TYPES
// ===========================================

interface UserDocument {
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    createdAt: string;
}

interface AdminNote {
    id: string;
    content: string;
    createdAt: string;
    admin: {
        email: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
}

interface UserDetail {
    id: string;
    email: string;
    phone?: string;
    role: 'CLIENT' | 'EXTRA' | 'ADMIN';
    status: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'BANNED';
    clientType?: 'PARTICULAR' | 'ESTABLISHMENT';
    isVerified: boolean;
    onboardingStep: number;
    createdAt: string;
    profile?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        city?: string;
        postalCode?: string;
        bio?: string;
        specialties?: string[];
    };
    establishment?: {
        name: string;
        siret?: string;
        type?: string;
        city?: string;
    };
    documents: UserDocument[];
    adminNotesReceived: AdminNote[];
    _count?: {
        bookingsAsClient: number;
        bookingsAsProvider: number;
        missionsAsClient: number;
        missionsAsExtra: number;
    };
}

// ===========================================
// HELPERS
// ===========================================

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const normalized = apiBase.replace(/\/+$/, '');
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getFileIcon = (type: string) => {
    if (type.includes('image') || type === 'ID_CARD') {
        return <ImageIcon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
};

// ===========================================
// STATUS BADGE COMPONENT
// ===========================================

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
        PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-3.5 h-3.5" />, label: 'En attente' },
        VERIFIED: { bg: 'bg-green-100', text: 'text-green-700', icon: <BadgeCheck className="w-3.5 h-3.5" />, label: 'Vérifié' },
        APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: <Check className="w-3.5 h-3.5" />, label: 'Approuvé' },
        SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Suspendu' },
        BANNED: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Banni' },
        REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <X className="w-3.5 h-3.5" />, label: 'Rejeté' },
    };

    const c = config[status] || config.PENDING;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {c.icon}
            {c.label}
        </span>
    );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newNote, setNewNote] = useState('');
    const [isSendingNote, setIsSendingNote] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch user details
    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/admin/users/${userId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (!res.ok) throw new Error('Utilisateur non trouvé');

                const data = await res.json();
                setUser(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) fetchUser();
    }, [userId]);

    // Verify user
    const handleVerifyUser = async () => {
        if (!user) return;
        setActionLoading('verify');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/admin/users/${userId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                setUser(prev => prev ? { ...prev, isVerified: true, status: 'VERIFIED' } : null);
            }
        } catch (err) {
            console.error('Erreur vérification:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Update document status
    const handleDocumentAction = async (docId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
        setActionLoading(docId);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/admin/documents/${docId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ status, comment }),
            });

            if (res.ok) {
                setUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        documents: prev.documents.map(d =>
                            d.id === docId ? { ...d, status, comment } : d
                        ),
                    };
                });
            }
        } catch (err) {
            console.error('Erreur document:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Add note
    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSendingNote(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/admin/users/${userId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content: newNote }),
            });

            if (res.ok) {
                const note = await res.json();
                setUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        adminNotesReceived: [note, ...prev.adminNotesReceived],
                    };
                });
                setNewNote('');
            }
        } catch (err) {
            console.error('Erreur note:', err);
        } finally {
            setIsSendingNote(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-coral-500" />
            </div>
        );
    }

    // Error state
    if (error || !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Erreur</h2>
                    <p className="text-slate-500 mb-4">{error || 'Utilisateur non trouvé'}</p>
                    <Link href="/admin/profiles" className="text-coral-500 font-medium hover:underline">
                        Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    const displayName = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.establishment?.name || user.email;

    const initials = user.profile
        ? `${user.profile.firstName?.charAt(0) || ''}${user.profile.lastName?.charAt(0) || ''}`
        : user.establishment?.name?.charAt(0) || user.email.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-slate-900">Détail Utilisateur</h1>
                                    <p className="text-xs text-slate-500">CRM Admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ========================================= */}
                    {/* CARTE IDENTITÉ (Gauche) */}
                    {/* ========================================= */}
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                        {/* Header avec gradient */}
                        <div className="h-24 bg-gradient-to-r from-coral-100 via-slate-50 to-indigo-100" />

                        {/* Avatar */}
                        <div className="px-6 -mt-12">
                            <div className="relative">
                                {user.profile?.avatarUrl ? (
                                    <img
                                        src={user.profile.avatarUrl}
                                        alt={displayName}
                                        className="w-24 h-24 rounded-full border-4 border-white shadow-soft object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-soft bg-gradient-to-br from-coral-500 to-orange-400 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">{initials}</span>
                                    </div>
                                )}

                                {user.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                        <BadgeCheck className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Infos */}
                        <div className="p-6 pt-4 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                        {user.role === 'EXTRA' ? 'Talent' : user.role === 'CLIENT' ? 'Client' : 'Admin'}
                                    </span>
                                    {user.clientType && (
                                        <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-medium">
                                            {user.clientType === 'ESTABLISHMENT' ? 'Établissement' : 'Particulier'}
                                        </span>
                                    )}
                                    <StatusBadge status={user.status} />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-600">{user.phone}</span>
                                    </div>
                                )}
                                {user.establishment?.siret && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-600">SIRET: {user.establishment.siret}</span>
                                    </div>
                                )}
                                {(user.profile?.city || user.establishment?.city) && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-600">
                                            {user.profile?.city || user.establishment?.city}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">
                                        Inscrit le {formatDate(user.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Stats */}
                            {user._count && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                                        <p className="text-lg font-bold text-slate-900">
                                            {user._count.bookingsAsClient + user._count.bookingsAsProvider}
                                        </p>
                                        <p className="text-xs text-slate-500">Réservations</p>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                                        <p className="text-lg font-bold text-slate-900">
                                            {user._count.missionsAsClient + user._count.missionsAsExtra}
                                        </p>
                                        <p className="text-xs text-slate-500">Missions</p>
                                    </div>
                                </div>
                            )}

                            {/* Action: Valider le compte */}
                            {!user.isVerified && (
                                <button
                                    onClick={handleVerifyUser}
                                    disabled={actionLoading === 'verify'}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-70"
                                >
                                    {actionLoading === 'verify' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <BadgeCheck className="w-5 h-5" />
                                    )}
                                    Valider ce compte
                                </button>
                            )}

                            {user.isVerified && (
                                <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100 text-center">
                                    <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
                                        <BadgeCheck className="w-4 h-4" />
                                        Compte vérifié
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* CARTE DOCUMENTS (Centre) */}
                    {/* ========================================= */}
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-400" />
                                Documents ({user.documents.length})
                            </h3>
                        </div>

                        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                            {user.documents.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Aucun document uploadé</p>
                                </div>
                            ) : (
                                user.documents.map((doc) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-soft transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center
                                                ${doc.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                    doc.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                        'bg-slate-100 text-slate-600'}
                                            `}>
                                                {getFileIcon(doc.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-sm truncate">
                                                    {doc.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {doc.type} • {formatDate(doc.createdAt)}
                                                </p>
                                                <StatusBadge status={doc.status} />

                                                {doc.comment && (
                                                    <p className="mt-2 text-xs text-slate-500 italic">
                                                        "{doc.comment}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                    title="Voir"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>

                                                {doc.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleDocumentAction(doc.id, 'APPROVED')}
                                                            disabled={actionLoading === doc.id}
                                                            className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                                            title="Approuver"
                                                        >
                                                            {actionLoading === doc.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Raison du rejet :');
                                                                if (reason) handleDocumentAction(doc.id, 'REJECTED', reason);
                                                            }}
                                                            disabled={actionLoading === doc.id}
                                                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                                                            title="Rejeter"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* CARTE CRM NOTES (Droite) */}
                    {/* ========================================= */}
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-slate-400" />
                                Notes internes ({user.adminNotesReceived.length})
                            </h3>
                        </div>

                        {/* Messages list */}
                        <div className="flex-1 p-4 space-y-4 max-h-[350px] overflow-y-auto">
                            {user.adminNotesReceived.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Aucune note pour cet utilisateur</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {user.adminNotesReceived.map((note) => {
                                        const adminName = note.admin.profile
                                            ? `${note.admin.profile.firstName || ''} ${note.admin.profile.lastName || ''}`
                                            : note.admin.email;
                                        const adminInitials = note.admin.profile
                                            ? `${note.admin.profile.firstName?.charAt(0) || ''}${note.admin.profile.lastName?.charAt(0) || ''}`
                                            : note.admin.email.charAt(0).toUpperCase();

                                        return (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-3"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-white">{adminInitials}</span>
                                                </div>
                                                <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-none p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-slate-700">{adminName}</span>
                                                        <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{note.content}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    placeholder="Ajouter une note privée..."
                                    className="input-premium flex-1 !py-2.5 text-sm"
                                />
                                <button
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim() || isSendingNote}
                                    className="btn-primary !px-4 !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSendingNote ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
