import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { CheckIcon } from '@/components/ui/Icon'
import type { BookingQuestion } from '@/lib/types'
import BookingFlowEditor from './BookingFlowEditor'

export const dynamic = 'force-dynamic'

async function saveQuestions(formData: FormData) {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  let questions: BookingQuestion[] = []
  try {
    const parsed = JSON.parse((formData.get('questions') as string) || '[]')
    if (Array.isArray(parsed)) {
      questions = parsed
        .filter((q) => q && typeof q.label === 'string' && q.label.trim())
        .slice(0, 30)
        .map((q, i) => ({
          id: typeof q.id === 'string' && q.id ? q.id : `q_${Date.now()}_${i}`,
          label: String(q.label).trim().slice(0, 200),
          type: q.type === 'checkbox' ? 'checkbox' : 'text',
          required: !!q.required,
        }))
    }
  } catch {
    // keep questions = []
  }

  await supabase
    .from('businesses')
    .update({ booking_questions: questions, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath('/admin/booking-flow')
  redirect('/admin/booking-flow?saved=1')
}

export default async function BookingFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('booking_questions')
    .eq('id', user.id)
    .single()

  const initial = (business?.booking_questions as BookingQuestion[]) || []

  return (
    <>
      <PageHeader
        title="Booking flow"
        description="Add your own questions to the booking form. They appear after the customer's contact details and their answers are saved on each booking."
      />

      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckIcon size={14} />
          Booking flow saved.
        </div>
      )}

      <BookingFlowEditor action={saveQuestions} initial={initial} />
    </>
  )
}
