import type { TripNode } from '@/types'

export interface GuestReview {
  by: string
  rating: number
  text: string
}

export interface PlaceTip {
  suggestion: string
  reviews: GuestReview[]
}

export function tipFor(node: TripNode | null): PlaceTip {
  if (!node) {
    return {
      suggestion: 'Ask from a hotel, eatery, or place node — I use that context for reviews.',
      reviews: [],
    }
  }
  if (node.category === 'stay' || node.title.toLowerCase().includes('fern') || node.title.toLowerCase().includes('hotel')) {
    return {
      suggestion: `Based on recent guests, try the veg samosa at ${shortName(node)} — lobby cafe, before you leave for the next hop.`,
      reviews: [
        { by: 'Neha P.', rating: 5, text: 'Veg samosa at the lobby cafe is the move. Crisp, not oily, and they do a mint chutney.' },
        { by: 'Kabir S.', rating: 4, text: 'Room is quiet. Breakfast is fine. The samosa is what people actually talk about.' },
        { by: 'Isha M.', rating: 5, text: 'Asked the desk what is best on property. Three staff said the veg samosa. They were right.' },
        { by: 'Rohan D.', rating: 4, text: 'Pool is small. Staff called a cab on time. Order the samosa if you only try one thing.' },
      ],
    }
  }
  if (node.category === 'food') {
    return {
      suggestion: `Reviews lean toward the house special at ${shortName(node)} — share one plate for two and keep the next hop on time.`,
      reviews: [
        { by: 'Aarav S.', rating: 5, text: 'Butter garlic crab if it is on. If not, the thali is the honest order.' },
        { by: 'Meera K.', rating: 4, text: 'Busy at 13:30. Book. The prawn curry is the plate people repeat.' },
        { by: 'Sana Q.', rating: 4, text: 'Street stall next door is cheaper. This table is the one you remember.' },
      ],
    }
  }
  if (node.category === 'activity') {
    return {
      suggestion: `Guests say go early at ${shortName(node)} — calmer water, better photos, less queue.`,
      reviews: [
        { by: 'Dev P.', rating: 5, text: '09:30 slot is the one. Afternoon swell made the later group sit out.' },
        { by: 'Riya N.', rating: 4, text: 'Gear is fine. Ask for the certified jacket. Lockers are small.' },
        { by: 'Anjali N.', rating: 4, text: 'If rain is flagged, skip water and eat inland. That is the local call.' },
      ],
    }
  }
  if (node.category === 'transport') {
    return {
      suggestion: `For this hop, reviews say keep the 45-minute buffer and a bottle of water — the seat is the product.`,
      reviews: [
        { by: 'Priya L.', rating: 5, text: 'Vande Bharat 2A is worth it. Catering is decent. Reach Kalupur by 05:15.' },
        { by: 'Vikram P.', rating: 4, text: 'Flight is faster but the station hop is calmer with bags.' },
        { by: 'Kabir S.', rating: 4, text: 'Window seat on the left for the last hour into Mumbai.' },
      ],
    }
  }
  return {
    suggestion: `On this stop, keep it light — water, phone, and one local bite nearby.`,
    reviews: [{ by: 'Desk note', rating: 4, text: 'Open block. Use it as recovery, not a new paid node.' }],
  }
}

function shortName(node: TripNode) {
  const cut = node.title.split('·')[0]?.trim()
  return cut || node.city
}

export function wantsReviews(text: string) {
  const lower = text.toLowerCase()
  return (
    lower.includes('best') ||
    lower.includes('review') ||
    lower.includes('samosa') ||
    lower.includes('eat') ||
    lower.includes('try') ||
    lower.includes('recommend') ||
    lower.includes('suggest') ||
    lower.includes('what should')
  )
}
