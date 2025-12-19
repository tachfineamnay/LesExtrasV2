'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, Share2 } from 'lucide-react';

export interface ReferralCardProps {
    referralCode: string | null;
    pendingCount: number;
    confirmedCount: number;
    pendingPoints?: number;
}

function getReferralLink(referralCode: string) {
    if (typeof window === 'undefined') return `/r/${referralCode}`;
    return `${window.location.origin}/r/${referralCode}`;
}

export function ReferralCard({ referralCode, pendingCount, confirmedCount, pendingPoints = 0 }: ReferralCardProps) {
    const [hasCopied, setHasCopied] = useState(false);

    const referralLink = useMemo(() => {
        if (!referralCode) return '';
        return getReferralLink(referralCode);
    }, [referralCode]);

    const whatsappUrl = useMemo(() => {
        if (!referralLink) return '';
        const message = `Rejoins Les Extras avec mon lien : ${referralLink}`;
        return `https://wa.me/?text=${encodeURIComponent(message)}`;
    }, [referralLink]);

    const copyLink = async () => {
        if (!referralLink) return;
        try {
            await navigator.clipboard.writeText(referralLink);
            setHasCopied(true);
            toast.success('Lien de parrainage copié');
            window.setTimeout(() => setHasCopied(false), 1200);
        } catch {
            toast.error("Impossible de copier le lien. Copiez-le manuellement.");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <p className="label-sm">Parrainage</p>
                    <h3 className="text-lg font-semibold text-slate-900">Inviter un collègue</h3>
                    <p className="text-sm text-slate-600">
                        +200 points quand votre filleul est vérifié (anti-fraude).
                    </p>
                </div>
                <div className="shrink-0 px-3 py-2 rounded-2xl bg-coral-50 text-coral-700 text-sm font-semibold">
                    +200 pts
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">En attente</p>
                    <p className="text-lg font-semibold text-slate-900">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Validés</p>
                    <p className="text-lg font-semibold text-slate-900">{confirmedCount}</p>
                </div>
            </div>

            {pendingPoints > 0 ? (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900">
                    <span className="font-semibold">{pendingPoints} pts</span> en attente de validation.
                </div>
            ) : null}

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        value={referralLink}
                        readOnly
                        placeholder={referralCode ? 'Votre lien…' : 'Chargement du lien…'}
                        className="input-premium"
                    />
                    <button
                        type="button"
                        onClick={copyLink}
                        disabled={!referralLink}
                        className="btn-secondary !px-3 !py-3 disabled:opacity-70"
                        aria-label="Copier le lien"
                    >
                        {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                <a
                    href={whatsappUrl || '#'}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`btn-primary w-full justify-center ${!whatsappUrl ? 'pointer-events-none opacity-70' : ''}`}
                >
                    <Share2 className="w-4 h-4" />
                    Partager sur WhatsApp
                </a>
            </div>
        </div>
    );
}

