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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editGender, setEditGender] = useState<Gender>('unspecified')
  const [editLikes, setEditLikes] = useState<string[]>([])
  const [editDislikes, setEditDislikes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
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
      // Get file extension
      const ext = file.name.split('.').pop() || 'png'
      const filePath = `${user.id}/${residentId}/avatar.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const photoUrl = urlData.publicUrl

      // Update database
      const { error: updateError } = await supabase
        .from('residents')
        .update({ photo_url: photoUrl })
        .eq('id', residentId)

      if (updateError) throw updateError

      // Update local store immediately
      updateResidentIdentity(residentId, { photo_url: photoUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input
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
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <button
        onClick={handleOpenPanel}
        className="mb-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 shadow-lg transition-colors"
      >
        My Residents ({myResidents.length}/5)
      </button>

      {/* Slide-in Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}>
          <div
            className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl overflow-y-auto transform transition-transform"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">My Residents</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Residents List */}
              {myResidents.length === 0 ? (
                <p className="text-gray-600 text-sm">No residents yet. Create one to get started!</p>
              ) : (
                <div className="space-y-4">
                  {myResidents.map((resident) => (
                    <div key={resident.id} className="border border-gray-200 rounded-lg p-4">
                      {/* Resident Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="flex-shrink-0 rounded-full"
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
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isSavingName}
                                  className="flex-1 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm font-medium py-1 transition-colors"
                                >
                                  {isSavingName ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="flex-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium py-1 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-800">{resident.name}</p>
                              <button
                                onClick={() => {
                                  setEditingId(resident.id)
                                  setEditName(resident.name)
                                  setEditGender(resident.gender)
                                  setEditLikes(resident.likes)
                                  setEditDislikes(resident.dislikes)
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteResident(resident.id)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Photo Upload */}
                      {editingId === resident.id && (
                        <div className="border-t pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              <div className="w-full rounded border-2 border-dashed border-gray-300 hover:border-blue-400 px-3 py-3 text-center cursor-pointer transition-colors">
                                {isUploadingPhoto ? (
                                  <p className="text-xs text-gray-600">Uploading...</p>
                                ) : (
                                  <p className="text-xs text-gray-600">
                                    Click to choose image
                                  </p>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Gender Selector */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Gender
                            </label>
                            <select
                              value={editGender}
                              onChange={(e) => setEditGender(e.target.value as Gender)}
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="unspecified">Unspecified</option>
                              <option value="female">Female</option>
                              <option value="male">Male</option>
                            </select>
                          </div>

                          {/* Likes Picker */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Likes ({editLikes.length}/3)
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {FOOD_CATALOG.map((food) => (
                                <button
                                  key={`like-${food}`}
                                  onClick={() => toggleLike(food)}
                                  disabled={editLikes.length >= 3 && !editLikes.includes(food)}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    editLikes.includes(food)
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {food}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dislikes Picker */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dislikes ({editDislikes.length}/3)
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {FOOD_CATALOG.map((food) => (
                                <button
                                  key={`dislike-${food}`}
                                  onClick={() => toggleDislike(food)}
                                  disabled={editDislikes.length >= 3 && !editDislikes.includes(food)}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    editDislikes.includes(food)
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {food}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Save Preferences Button */}
                          <button
                            onClick={() => handleSavePreferences(resident.id)}
                            disabled={isSavingPreferences}
                            className="w-full rounded bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white text-sm font-medium py-2 transition-colors"
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
                  className="w-full rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 transition-colors"
                >
                  {isCreating ? 'Creating...' : '+ Add Resident'}
                </button>
                {!canAddResident && (
                  <p className="text-xs text-gray-500 text-center mt-2">
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
