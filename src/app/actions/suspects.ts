'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSuspectAction(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const course = formData.get('course') as string
  const file = formData.get('photo') as File | null

  if (!name || !course || !file || file.size === 0) {
    return { error: 'Todos os campos (nome, curso e foto) são obrigatórios.' }
  }

  // Gera um nome único para evitar colisão
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `public/${fileName}`

  // 1. Upload da Foto
  const { error: uploadError } = await supabase.storage
    .from('suspect-photos')
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    return { error: `Erro ao subir a foto do suspeito: ${uploadError.message}` }
  }

  // 2. Obter URL Pública
  const { data: { publicUrl } } = supabase.storage
    .from('suspect-photos')
    .getPublicUrl(filePath)

  // 3. Inserir Registro na Tabela users
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      name,
      course,
      photo_url: publicUrl
    })

  // 4. Fallback (Rollback) se a inserção falhar
  if (insertError) {
    // Usamos o Admin Client para ignorar a restrição de DELETE do RLS
    const adminSupabase = await createAdminClient()
    await adminSupabase.storage
      .from('suspect-photos')
      .remove([filePath])
      
    return { error: `Erro no registro do banco. A imagem foi descartada. Detalhes: ${insertError.message}` }
  }

  // Atualiza o cache da página se houver listagem
  revalidatePath('/suspect-entry') 
  return { success: true }
}
