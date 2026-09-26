import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/Progress'
import { formatDate, formatINR } from '@/lib/cn'
import type {
  ActivityItem,
  Booking,
  TourProduct,
  TravelerProfile,
  Trip,
  Vendor,
} from '@/types'

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="card-title">{vendor.name}</h3>
          <p className="meta mt-1">
            {vendor.city} · {vendor.type}
          </p>
        </div>
        <StatusBadge status={vendor.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {vendor.specialties.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <p className="meta">Rating</p>
          <p className="font-semibold">{vendor.rating.toFixed(1)}</p>
        </div>
        <div>
          <p className="meta">Reliability</p>
          <p className="font-semibold">{vendor.reliability}%</p>
        </div>
        <div>
          <p className="meta">Price</p>
          <p className="font-semibold">{vendor.priceBand}</p>
        </div>
      </div>
    </Card>
  )
}

export function TravelerCard({ traveler }: { traveler: TravelerProfile }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Avatar initials={traveler.avatarInitials} name={traveler.name} />
        <div>
          <h3 className="card-title">{traveler.name}</h3>
          <p className="meta">{traveler.home}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {traveler.travelStyle.map((style) => (
          <Badge key={style} tone="info">
            {style}
          </Badge>
        ))}
      </div>
      <p className="meta mt-3">{traveler.preferredStay}</p>
    </Card>
  )
}

export function TourCard({
  tour,
  onOpen,
}: {
  tour: TourProduct
  onOpen?: () => void
}) {
  const fill = Math.round((tour.booked / tour.seats) * 100)
  return (
    <Card onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="card-title">{tour.name}</h3>
          <p className="meta mt-1">{tour.route}</p>
        </div>
        <StatusBadge status={tour.status} />
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[12px] text-slate-500">
          <span>
            {tour.booked}/{tour.seats} seats
          </span>
          <span>from {formatINR(tour.priceFrom)}</span>
        </div>
        <ProgressBar value={fill} tone={fill > 90 ? 'warning' : 'success'} />
      </div>
      <p className="meta mt-3">
        {tour.duration} · next {formatDate(tour.nextDeparture, 'long')} · {tour.coordinator}
      </p>
    </Card>
  )
}

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="card-title">{booking.item}</h3>
          <p className="meta mt-1">
            {booking.travelerName} · {booking.vendorName}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-slate-500">{formatDate(booking.date, 'long')}</span>
        <span className="font-semibold">{formatINR(booking.amount)}</span>
      </div>
    </Card>
  )
}

export function ActivityCard({ activity }: { activity: ActivityItem }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="card-title">{activity.title}</h3>
        <Badge tone="info">{activity.category}</Badge>
      </div>
      <p className="meta mt-1">
        {activity.city} · {activity.duration} · {activity.rating.toFixed(1)}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{formatINR(activity.price)}</p>
        <p className="meta">{activity.slot}</p>
      </div>
    </Card>
  )
}

export function TripSummaryCard({ trip, onOpen }: { trip: Trip; onOpen?: () => void }) {
  const percent = Math.min(100, Math.round((trip.spent / trip.budget) * 100))
  return (
    <Card onClick={onOpen} className="group cursor-pointer transition-all hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="card-title group-hover:text-brand-800 transition-colors">{trip.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{trip.route}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>
      <p className="meta mt-3">
        {formatDate(trip.startDate)} – {formatDate(trip.endDate, 'long')} · {trip.adults} adults
      </p>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Spent {formatINR(trip.spent)}</span>
          <span>Budget {formatINR(trip.budget)}</span>
        </div>
        <ProgressBar value={percent} tone={percent > 90 ? 'warning' : 'success'} />
      </div>
    </Card>
  )
}
