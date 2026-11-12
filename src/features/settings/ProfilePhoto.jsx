import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, UploadCloud } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { prepareAvatar, ImageError } from '../../lib/image';

/**
 * Profile photo: click or drop an image. It is cropped and resized in the
 * browser, shown immediately, then uploaded; the new photo appears in the
 * sidebar and header as soon as it is saved.
 */
export default function ProfilePhoto() {
  const { user, updateUser } = useAuth();
  const addToast = useToast();
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null); // 'upload' | 'remove' | null
  const [dragging, setDragging] = useState(false);

  const upload = async (file) => {
    if (!file || busy) return;
    let prepared;
    try {
      prepared = await prepareAvatar(file);
    } catch (err) {
      addToast({ title: 'Photo not added', message: err instanceof ImageError ? err.message : 'That image couldn’t be read. Try another one.' }, 'error');
      return;
    }
    setPreview(prepared.previewUrl);
    setBusy('upload');
    try {
      const form = new FormData();
      form.append('file', prepared.blob, `avatar.${prepared.type === 'image/webp' ? 'webp' : 'jpg'}`);
      const profile = await api.put('/users/me/avatar', form);
      updateUser({ avatarUrl: profile?.avatarUrl || null });
      addToast('Profile photo updated.', 'success');
    } catch (err) {
      addToast({ ...err, toastTitle: 'Photo not saved', message: err.message, status: err.status }, 'error');
    } finally {
      setBusy(null);
      setPreview(null);
      URL.revokeObjectURL(prepared.previewUrl);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy('remove');
    try {
      await api.delete('/users/me/avatar');
      updateUser({ avatarUrl: null });
      addToast('Profile photo removed.', 'success');
    } catch (err) {
      addToast(err, 'error');
    } finally {
      setBusy(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border-2 border-dashed p-3.5 mb-4 transition-colors ${dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200"
        aria-label="Change profile photo"
        disabled={!!busy}
      >
        <Avatar name={user?.fullName} src={preview || user?.avatarUrl} size={72} className="ring-2 ring-primrose/40" />
        <span className={`absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white transition-opacity ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {busy ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <Camera size={20} aria-hidden="true" />}
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">Profile photo</p>
        <p className="text-xs text-gray-500 mt-0.5">Drop an image here or choose one. It’s cropped to a square automatically.</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => input.current?.click()} disabled={!!busy}>
            <UploadCloud size={13} aria-hidden="true" /> {busy === 'upload' ? 'Uploading…' : user?.avatarUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {user?.avatarUrl && (
            <button type="button" className="btn-ghost btn-sm text-danger-600" onClick={remove} disabled={!!busy}>
              <Trash2 size={13} aria-hidden="true" /> {busy === 'remove' ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
