'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useResidentStore } from '@/lib/residentStore'
import { AVATAR_SIZE, Gender, FOOD_CATALOG } from '@/lib/types'

interface ResidentEditorPanelProps {
  user: User
}

const RESIDENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#95E1D3']

function randomFromPalette(): string {
  return RESIDENT_COLORS[Math.floor(Math.random() * RESIDENT_COLORS.length)]
}

export default function ResidentEditorPanel({ user }: ResidentEditorPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editGender, setEditGender] = useState<Gender>('unspecified')
  const [editLikes, setEditLikes] = useState<string[]>([])
  const [editDislikes, setEditDislikes] = useState<string[]>([])
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { residents, updateResidentIdentity, addResident, removeResident } = useResidentStore()
  const myResidents = residents.filter(r => r.owner_id === user.id)
  const canAddResident = myResidents.length < 5

  const handleOpenPanel = () => {
    setIsOpen(true)
    setIsExpanded(false)
  }

  const handleClosePanel = () => {
    setIsOpen(false)
    setIsExpanded(false)
  }

  const handleSaveName = async (e: FormEvent, residentId: string) => {
    e.preventDefault()
    if (!editName.trim()) {
      setError('Name cannot be empty')
      return
    }

    setIsSavingName(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('residents')
        .update({ name: editName })
        .eq('id', residentId)

      if (updateError) throw updateError

      updateResidentIdentity(residentId, { name: editName })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save name')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSavePreferences = async (residentId: string) => {
    setIsSavingPreferences(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('residents')
        .update({ gender: editGender, likes: editLikes, dislikes: editDislikes })
        .eq('id', residentId)

      if (updateError) throw updateError

      updateResidentIdentity(residentId, { gender: editGender, likes: editLikes, dislikes: editDislikes })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const toggleLike = (food: string) => {
    if (editLikes.includes(food)) {
      setEditLikes(editLikes.filter(f => f !== food))
    } else if (editLikes.length < 3) {
      setEditLikes([...editLikes, food])
    }
  }

  const toggleDislike = (food: string) => {
    if (editDislikes.includes(food)) {
      setEditDislikes(editDislikes.filter(f => f !== food))
    } else if (editDislikes.length < 3) {
      setEditDislikes([...editDislikes, food])
    }
  }

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>, residentId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop() || 'png'
      const filePath = `${user.id}/${residentId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const photoUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('residents')
        .update({ photo_url: photoUrl })
        .eq('id', residentId)

      if (updateError) throw updateError

      updateResidentIdentity(residentId, { photo_url: photoUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleDeleteResident = async (residentId: string) => {
    if (!confirm('Are you sure you want to delete this resident?')) return

    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('residents')
        .delete()
        .eq('id', residentId)

      if (deleteError) throw deleteError

      removeResident(residentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resident')
    }
  }

  const handleAddResident = async () => {
    if (!canAddResident) return

    setIsCreating(true)
    setError(null)

    try {
      const color = randomFromPalette()
      const { data, error: insertError } = await supabase
        .from('residents')
        .insert({ owner_id: user.id, name: 'New Resident', color })
        .select()
        .single()

      if (insertError) throw insertError

      if (data) {
        addResident(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resident')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={handleOpenPanel}
        className="fixed bottom-6 right-6 z-50 mb-4 rounded-full bg-mint hover:bg-mint/80 text-white font-bold px-6 py-3 shadow-warm transition-colors md:flex hidden"
      >
        My Residents ({myResidents.length}/5)
      </button>

      {/* Mobile toggle button */}
      {!isOpen && (
        <button
          onClick={handleOpenPanel}
          className="fixed bottom-6 right-6 z-50 md:hidden rounded-full bg-mint hover:bg-mint/80 text-white font-bold px-6 py-3 shadow-warm transition-colors"
        >
          My Residents ({myResidents.length}/5)
        </button>
      )}

      {/* Slide-in Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={handleClosePanel}>
          {/* Desktop: right sidebar */}
          <div
            className="hidden md:flex fixed right-0 top-0 bottom-0 w-96 bg-white-warm shadow-warm overflow-y-auto transform transition-transform flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white-warm border-b border-sand p-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-brown">My Residents</h2>
              <button
                onClick={handleClosePanel}
                className="text-brown-light hover:text-brown text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-coral/10 border border-coral p-3 text-sm text-coral">
                  {error}
                </div>
              )}

              {/* Residents List */}
              {myResidents.length === 0 ? (
                <p className="text-brown-light text-sm">No residents yet. Create one to get started!</p>
              ) : (
                <div className="space-y-4">
                  {myResidents.map((resident) => (
                    <div key={resident.id} className="bg-cream border border-sand rounded-2xl p-4">
                      {/* Resident Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="flex-shrink-0 rounded-full border-2 border-white-warm"
                          style={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            backgroundColor: resident.color,
                            backgroundImage: resident.photo_url
                              ? `url(${resident.photo_url})`
                              : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <div className="flex-grow">
                          {editingId === resident.id ? (
                            <form onSubmit={(e) => handleSaveName(e, resident.id)} className="space-y-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Resident name"
                                className="w-full rounded-full border border-sand px-3 py-1.5 text-sm bg-white-warm focus:border-coral focus:outline-none text-brown font-semibold transition-colors"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isSavingName}
                                  className="flex-1 rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white text-sm font-bold py-1.5 transition-colors"
                                >
                                  {isSavingName ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="flex-1 rounded-full bg-sand text-brown-light hover:text-brown text-sm font-semibold py-1.5 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <p className="font-bold text-brown">{resident.name}</p>
                              <button
                                onClick={() => {
                                  setEditingId(resident.id)
                                  setEditName(resident.name)
                                  setEditGender(resident.gender)
                                  setEditLikes(resident.likes)
                                  setEditDislikes(resident.dislikes)
                                }}
                                className="text-xs text-coral hover:text-coral-dark font-semibold"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteResident(resident.id)}
                          className="text-coral hover:bg-coral/10 rounded-full p-1 font-bold transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Photo Upload */}
                      {editingId === resident.id && (
                        <div className="border-t border-sand pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Upload Photo
                            </label>
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, resident.id)}
                                disabled={isUploadingPhoto}
                                className="hidden"
                              />
                              <div className="w-full rounded-xl border-2 border-dashed border-sand hover:border-coral bg-cream px-3 py-3 text-center cursor-pointer transition-colors">
                                {isUploadingPhoto ? (
                                  <p className="text-xs text-brown-light">Uploading...</p>
                                ) : (
                                  <p className="text-xs text-brown-light">
                                    Click to choose image
                                  </p>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Gender Selector */}
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Gender
                            </label>
                            <div className="flex gap-2">
                              {(['unspecified', 'male', 'female'] as Gender[]).map((g) => (
                                <button
                                  key={g}
                                  onClick={() => setEditGender(g)}
                                  className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                                    editGender === g
                                      ? 'bg-coral text-white'
                                      : 'bg-sand text-brown-light hover:text-brown'
                                  }`}
                                >
                                  {g === 'unspecified' ? 'Any' : g.charAt(0).toUpperCase() + g.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Likes Picker */}
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Likes ({editLikes.length}/3)
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {FOOD_CATALOG.map((food) => (
                                <button
                                  key={`like-${food}`}
                                  onClick={() => toggleLike(food)}
                                  disabled={editLikes.length >= 3 && !editLikes.includes(food)}
                                  className={`px-2 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    editLikes.includes(food)
                                      ? 'bg-mint text-white'
                                      : 'bg-sand text-brown-light hover:text-brown disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  ♥ {food}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dislikes Picker */}
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Dislikes ({editDislikes.length}/3)
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {FOOD_CATALOG.map((food) => (
                                <button
                                  key={`dislike-${food}`}
                                  onClick={() => toggleDislike(food)}
                                  disabled={editDislikes.length >= 3 && !editDislikes.includes(food)}
                                  className={`px-2 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    editDislikes.includes(food)
                                      ? 'bg-coral text-white'
                                      : 'bg-sand text-brown-light hover:text-brown disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  ✕ {food}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Save Preferences Button */}
                          <button
                            onClick={() => handleSavePreferences(resident.id)}
                            disabled={isSavingPreferences}
                            className="w-full rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white text-sm font-bold py-2 transition-colors shadow-coral"
                          >
                            {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Resident Button */}
              <div>
                <button
                  onClick={handleAddResident}
                  disabled={!canAddResident || isCreating}
                  className="w-full rounded-full bg-mint hover:bg-mint/80 disabled:opacity-40 text-white font-bold py-3 transition-colors shadow-warm"
                >
                  {isCreating ? 'Creating...' : '+ Add Resident'}
                </button>
                {!canAddResident && (
                  <p className="text-xs text-brown-light text-center mt-2">
                    5 resident limit reached
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: bottom sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white-warm rounded-t-2xl shadow-warm flex flex-col transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
            style={{
              height: isExpanded ? '100vh' : '50vh',
            }}
          >
            {/* Drag Handle */}
            <div
              className="flex justify-center items-center py-2 border-b border-sand cursor-pointer hover:bg-sand/50"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="w-12 h-1 bg-sand rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <h2 className="text-base font-extrabold text-brown">My Residents</h2>
              <button
                onClick={handleClosePanel}
                className="text-brown-light hover:text-brown text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-coral/10 border border-coral p-3 text-sm text-coral">
                  {error}
                </div>
              )}

              {/* Residents List */}
              {myResidents.length === 0 ? (
                <p className="text-brown-light text-sm">No residents yet. Create one to get started!</p>
              ) : (
                <div className="space-y-4">
                  {myResidents.map((resident) => (
                    <div key={resident.id} className="bg-cream border border-sand rounded-2xl p-4">
                      {/* Resident Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="flex-shrink-0 rounded-full border-2 border-white-warm"
                          style={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            backgroundColor: resident.color,
                            backgroundImage: resident.photo_url
                              ? `url(${resident.photo_url})`
                              : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <div className="flex-grow">
                          {editingId === resident.id ? (
                            <form onSubmit={(e) => handleSaveName(e, resident.id)} className="space-y-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Resident name"
                                className="w-full rounded-full border border-sand px-3 py-1.5 text-sm bg-white-warm focus:border-coral focus:outline-none text-brown font-semibold transition-colors"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isSavingName}
                                  className="flex-1 rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white text-sm font-bold py-1.5 transition-colors"
                                >
                                  {isSavingName ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="flex-1 rounded-full bg-sand text-brown-light hover:text-brown text-sm font-semibold py-1.5 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <p className="font-bold text-brown">{resident.name}</p>
                              <button
                                onClick={() => {
                                  setEditingId(resident.id)
                                  setEditName(resident.name)
                                  setEditGender(resident.gender)
                                  setEditLikes(resident.likes)
                                  setEditDislikes(resident.dislikes)
                                }}
                                className="text-xs text-coral hover:text-coral-dark font-semibold"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteResident(resident.id)}
                          className="text-coral hover:bg-coral/10 rounded-full p-1 font-bold transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Photo Upload */}
                      {editingId === resident.id && (
                        <div className="border-t border-sand pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Upload Photo
                            </label>
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, resident.id)}
                                disabled={isUploadingPhoto}
                                className="hidden"
                              />
                              <div className="w-full rounded-xl border-2 border-dashed border-sand hover:border-coral bg-cream px-3 py-3 text-center cursor-pointer transition-colors">
                                {isUploadingPhoto ? (
                                  <p className="text-xs text-brown-light">Uploading...</p>
                                ) : (
                                  <p className="text-xs text-brown-light">
                                    Click to choose image
                                  </p>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Gender Selector */}
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Gender
                            </label>
                            <div className="flex gap-2">
                              {(['unspecified', 'male', 'female'] as Gender[]).map((g) => (
                                <button
                                  key={g}
                                  onClick={() => setEditGender(g)}
                                  className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                                    editGender === g
                                      ? 'bg-coral text-white'
                                      : 'bg-sand text-brown-light hover:text-brown'
                                  }`}
                                >
                                  {g === 'unspecified' ? 'Any' : g.charAt(0).toUpperCase() + g.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Likes Picker */}
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Likes ({editLikes.length}/3)
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {FOOD_CATALOG.map((food) => (
                                <button
                                  key={`like-${food}`}
                                  onClick={() => toggleLike(food)}
                                  disabled={editLikes.length >= 3 && !editLikes.includes(food)}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    editLikes.includes(food)
                                      ? 'bg-mint text-white'
                                      : 'bg-sand text-brown-light hover:text-brown disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  ♥
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dislikes Picker */}
                          <div>
                            <label className="block text-sm font-extrabold text-brown mb-2">
                              Dislikes ({editDislikes.length}/3)
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {FOOD_CATALOG.map((food) => (
                                <button
                                  key={`dislike-${food}`}
                                  onClick={() => toggleDislike(food)}
                                  disabled={editDislikes.length >= 3 && !editDislikes.includes(food)}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    editDislikes.includes(food)
                                      ? 'bg-coral text-white'
                                      : 'bg-sand text-brown-light hover:text-brown disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  ✕
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Save Preferences Button */}
                          <button
                            onClick={() => handleSavePreferences(resident.id)}
                            disabled={isSavingPreferences}
                            className="w-full rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white text-sm font-bold py-2 transition-colors shadow-coral"
                          >
                            {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Resident Button */}
              <div>
                <button
                  onClick={handleAddResident}
                  disabled={!canAddResident || isCreating}
                  className="w-full rounded-full bg-mint hover:bg-mint/80 disabled:opacity-40 text-white font-bold py-3 transition-colors shadow-warm"
                >
                  {isCreating ? 'Creating...' : '+ Add Resident'}
                </button>
                {!canAddResident && (
                  <p className="text-xs text-brown-light text-center mt-2">
                    5 resident limit reached
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
