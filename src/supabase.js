import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

const cacheKey = (userId, storageKey) => `questiondeck:${userId}:${storageKey}`
const announce = (status, message = '') => {
  window.dispatchEvent(new CustomEvent('questiondeck:sync', { detail: { status, message } }))
}

// Matches the window.storage API used by the existing question-bank files.
export function createProgressStorage(userId) {
  return {
    async get(storageKey) {
      const localKey = cacheKey(userId, storageKey)
      try {
        const { data, error } = await supabase.from('question_bank_progress').select('data')
          .eq('user_id', userId).eq('storage_key', storageKey).maybeSingle()
        if (error) throw error
        const value = data ? JSON.stringify(data.data) : null
        if (value) localStorage.setItem(localKey, value)
        announce('synced')
        return { value }
      } catch (error) {
        // A local copy prevents a temporary network problem from appearing as
        // lost work. The next successful save updates Supabase again.
        announce('error', error.message || 'Unable to load saved progress.')
        return { value: localStorage.getItem(localKey) }
      }
    },
    async set(storageKey, value) {
      const localKey = cacheKey(userId, storageKey)
      localStorage.setItem(localKey, value)
      announce('saving')
      let parsed
      try { parsed = JSON.parse(value) } catch { parsed = value }
      try {
        const { error } = await supabase.from('question_bank_progress').upsert(
          { user_id: userId, storage_key: storageKey, data: parsed, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,storage_key' },
        )
        if (error) throw error
        announce('synced')
      } catch (error) {
        announce('error', error.message || 'Unable to save progress.')
        throw error
      }
    },
  }
}
