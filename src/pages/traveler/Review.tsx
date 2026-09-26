import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Check, Sparkles, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { AILabel } from '@/components/domain/AICards'
import { useAppState } from '@/state/AppState'
import { cn } from '@/lib/cn'
import { checkoutDates } from '@/pages/traveler/checkout/model'
import {
  aiDraft,
  emptyReviews,
  loadReviewState,
  persistReviewState,
  tripInsights,
  type ReviewKind,
  type VendorReview,
} from '@/pages/traveler/review/model'

export function Review() {
  const { id } = useParams()
  const { trips, pushToast, completeTrip } = useAppState()
  const trip = trips.find((item) => item.id === id)
  const saved = trip ? loadReviewState(trip.id) : null
  const [reviews, setReviews] = useState<VendorReview[]>(() => saved?.reviews ?? (trip ? emptyReviews(trip) : []))
  const [submitted, setSubmitted] = useState(Boolean(saved?.submitted))
  const [draftingAll, setDraftingAll] = useState(false)
  const navigate = useNavigate()
  const insights = useMemo(() => (trip ? tripInsights(trip) : []), [trip])
  const approvedCount = reviews.filter((review) => review.approved).length

  if (!trip) {
    return (
      <EmptyState
        icon={<Star className="h-5 w-5" />}
        title="Trip not found"
        body="Open a trip from My Trips to leave a review."
        action={<Button type="button" onClick={() => navigate('/traveler/trips')}>My trips</Button>}
      />
    )
  }

  const patch = (id: ReviewKind, next: Partial<VendorReview>) => {
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, ...next } : review)))
  }

  const draftOne = (kind: ReviewKind) => {
    patch(kind, { drafting: true })
    window.setTimeout(() => {
      patch(kind, {
        drafting: false,
        comment: aiDraft(kind, trip),
        rating: 5,
        source: 'ai',
        approved: false,
      })
    }, 1100)
  }

  const draftAll = () => {
    setDraftingAll(true)
    setReviews((current) => current.map((review) => ({ ...review, drafting: true })))
    window.setTimeout(() => {
      setReviews((current) =>
        current.map((review) => ({
          ...review,
          drafting: false,
          comment: aiDraft(review.id, trip),
          rating: review.rating || 5,
          source: 'ai',
          approved: false,
        })),
      )
      setDraftingAll(false)
    }, 1400)
  }

  const submit = () => {
    if (reviews.some((review) => !review.approved)) {
      pushToast({
        title: 'Approve each AI draft first',
        body: 'TripFlow will not publish a review until you approve it.',
      })
      return
    }
    persistReviewState(trip.id, true, reviews)
    completeTrip(trip.id)
    setSubmitted(true)
    pushToast({ title: 'Trip complete!', body: 'Your approved reviews are on the traveler file.' })
  }

  if (submitted) {
    return (
      <CompleteView
        route={trip.route}
        dates={checkoutDates(trip.startDate, trip.endDate)}
        reviews={reviews}
        insights={insights}
        onTrips={() => navigate('/traveler/trips?tab=completed')}
        onHome={() => navigate('/traveler')}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="How was your journey?"
        description={`${trip.route} · ${checkoutDates(trip.startDate, trip.endDate)}`}
        crumbs={[
          { label: 'My trips', to: '/traveler/trips' },
          { label: 'Review' },
        ]}
        actions={
          <Button type="button" variant="ai" icon={<Sparkles className="h-4 w-4" />} loading={draftingAll} onClick={draftAll}>
            Draft with AI
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onRate={(rating) => patch(review.id, { rating, approved: false })}
              onComment={(comment) =>
                patch(review.id, { comment, source: review.source === 'ai' ? 'edited' : review.source, approved: false })
              }
              onPhotos={(photos) => patch(review.id, { photos })}
              onDraft={() => draftOne(review.id)}
              onApprove={() => {
                if (!review.comment.trim() || review.rating < 1) {
                  pushToast({ title: 'Add a rating and comment first', body: 'Approve only after you are happy with the draft.' })
                  return
                }
                patch(review.id, { approved: true })
              }}
              onEdit={() => patch(review.id, { approved: false })}
            />
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Trip insights</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {insights.map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="font-display text-xl font-semibold">{item.value}</p>
                  <p className="meta mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-slate-500">{`₹12,100 saved · 1 itinerary adaptation · ${insights[2]?.value || "7"} activities completed · ${insights[3]?.value || "6/7"} planned nodes completed`}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-600">
              {approvedCount}/4 reviews approved. AI can draft, but nothing publishes until you approve each card.
            </p>
            <Button type="button" className="mt-4 w-full" onClick={submit}>
              Submit Reviews
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function ReviewCard({
  review,
  onRate,
  onComment,
  onPhotos,
  onDraft,
  onApprove,
  onEdit,
}: {
  review: VendorReview
  onRate: (value: number) => void
  onComment: (value: string) => void
  onPhotos: (photos: string[]) => void
  onDraft: () => void
  onApprove: () => void
  onEdit: () => void
}) {
  const locked = review.approved

  return (
    <Card className={cn(review.approved && 'border-emerald-200', review.source === 'ai' && !review.approved && 'border-brand-100')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="card-title">{review.label}</p>
          <p className="meta mt-0.5">{review.vendor}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {review.source === 'ai' ? <AILabel /> : null}
          {review.approved ? <Badge tone="success">Approved</Badge> : review.source === 'ai' ? <Badge tone="warning">Needs approval</Badge> : null}
        </div>
      </div>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value}
            type="button"
            aria-label={`${value} stars`}
            disabled={locked}
            onClick={() => onRate(value)}
            className="p-0.5"
          >
            <Star
              className={cn('h-5 w-5', value <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')}
            />
          </button>
        ))}
      </div>

      {review.drafting ? (
        <div className="ai-generating mt-3 rounded-xl border border-brand-100 bg-brand-50 px-3 py-4 text-sm text-brand-900">
          Drafting from your trip activity…
        </div>
      ) : (
        <textarea
          value={review.comment}
          disabled={locked}
          onChange={(event) => onComment(event.target.value)}
          placeholder="What stood out? AI can draft this from the itinerary."
          className="mt-3 min-h-28 w-full rounded-lg border border-line p-3 text-sm disabled:bg-slate-50"
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-slate-600">
          <Camera className="h-4 w-4" />
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={locked}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              onPhotos(files.map((file) => URL.createObjectURL(file)))
            }}
          />
        </label>
        {review.photos.map((photo) => (
          <img key={photo} src={photo} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" icon={<Sparkles className="h-3.5 w-3.5" />} loading={review.drafting} onClick={onDraft}>
          Draft with AI
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onEdit} disabled={!review.comment}>
          Edit
        </Button>
        <Button type="button" size="sm" icon={<Check className="h-3.5 w-3.5" />} onClick={onApprove} disabled={review.approved}>
          Approve
        </Button>
      </div>
    </Card>
  )
}

function CompleteView({
  route,
  dates,
  reviews,
  insights,
  onTrips,
  onHome,
}: {
  route: string
  dates: string
  reviews: VendorReview[]
  insights: { label: string; value: string }[]
  onTrips: () => void
  onHome: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-7 w-7" />
      </div>
      <h1 className="page-title mt-4">Trip complete!</h1>
      <p className="mt-2 text-sm text-slate-600">
        {route} · {dates}
      </p>
      <Card className="mt-6 text-left">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Memorable summary</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          You closed {route} with {insights[2]?.value ?? '7'} activities and one live adaptation. The approved notes
          below stay on the traveler file for the next circuit.
        </p>
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-sm font-semibold">
                {review.label} · {review.vendor}
              </p>
              <p className="mt-1 text-[13px] text-slate-600">{review.comment}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {insights.map((item) => (
            <div key={item.label}>
              <p className="font-semibold">{item.value}</p>
              <p className="meta">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={onTrips}>My trips</Button>
        <Button type="button" variant="secondary" onClick={onHome}>
          Dashboard
        </Button>
      </div>
    </div>
  )
}

