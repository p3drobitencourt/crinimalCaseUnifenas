'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDashboardData() {
  const supabase = createClient()
  
  const { data: sentences, error: err1 } = await supabase
    .from('sentences')
    .select('*')
    .order('description')

  const { data: suspects, error: err2 } = await supabase
    .from('users')
    .select(`
      *,
      draws (
        *,
        sentence:sentences (*)
      )
    `)
    .order('name')

  if (err1 || err2) throw new Error('Falha ao buscar dados')
  
  return { sentences, suspects }
}

export async function addSentenceAction(description: string) {
  const supabase = createClient()
  const { error } = await supabase.from('sentences').insert({ description })
  if (error) return { error: error.message }
  revalidatePath('/hq-admin')
  return { success: true }
}

export async function updateSentenceAction(id: string, description: string, is_active: boolean) {
  const supabase = createClient()
  // No script SQL criamos apenas description e id, wait!
  // The SQL script for sentences didn't have is_active!
  // Let me check my sql script. Wait, "description text not null". No is_active!
  // Let's adapt it. If is_active is needed, we should just delete or I'll add is_active to the sql if they need soft delete, but for now let's just update description.
  const { error } = await supabase.from('sentences').update({ description }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hq-admin')
  return { success: true }
}

export async function deleteSentenceAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('sentences').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hq-admin')
  return { success: true }
}

export async function deleteSuspectAction(id: string) {
  const supabase = createClient()
  await supabase.from('draws').delete().eq('user_id', id)
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hq-admin')
  return { success: true }
}

export async function drawJudgementAction(userId: string) {
  const supabase = createClient()
  
  // Idempotency: verify if already drawn
  const { data: existing } = await supabase.from('draws').select('*, sentence:sentences(*)').eq('user_id', userId).single()
  if (existing) {
    return { sentence: existing.sentence }
  }

  // Get sentences
  const { data: sentences } = await supabase.from('sentences').select('*')
  if (!sentences || sentences.length === 0) {
    return { error: 'Nenhuma pena cadastrada.' }
  }

  // Random pick
  const randomIndex = Math.floor(Math.random() * sentences.length)
  const selectedSentence = sentences[randomIndex]

  // Insert draw
  const { error } = await supabase.from('draws').insert({
    user_id: userId,
    sentence_id: selectedSentence.id
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/hq-admin/judgement')
  revalidatePath('/hq-admin')
  return { sentence: selectedSentence }
}
