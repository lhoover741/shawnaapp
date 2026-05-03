export const businessRules = {
  brand: 'Ravishing Beauté',
  deposit: 25,
  depositLabel: '$25 deposit required to request an appointment',
  hours: '8:30 AM to 6:00 PM by appointment',
  closed: ['Sunday', 'Monday'],
  sameDay: 'Same-day bookings are available only if approved.',
  includedHairColors: ['1', '1B', '2', '4'],
  includedHairNote: 'Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.',
  detangle: 'Please come detangled to stay on schedule.'
};

export const services = [
  { id:'knotless-sm', category:'Braids', name:'Small Knotless Braids', price:220, duration:'5–7 hrs', deposit:25, hairIncluded:true, details:'Clean parts, lightweight finish, natural-color braiding hair included.' },
  { id:'knotless-md', category:'Braids', name:'Medium Knotless Braids', price:180, duration:'4–6 hrs', deposit:25, hairIncluded:true, details:'A polished everyday braid style with natural-color hair included.' },
  { id:'knotless-lg', category:'Braids', name:'Large Knotless Braids', price:140, duration:'3–4 hrs', deposit:25, hairIncluded:true, details:'A bold, neat finish with natural-color hair included.' },
  { id:'feedin', category:'Braids', name:'Feed-In Braids', price:85, duration:'2–3 hrs', deposit:25, hairIncluded:true, details:'Sleek feed-in styling. Final price may vary by braid count and length.' },
  { id:'stitch', category:'Braids', name:'Stitch Braids', price:95, duration:'2–4 hrs', deposit:25, hairIncluded:true, details:'Defined parts and a clean stitched finish.' },
  { id:'ponytail', category:'Styling', name:'Sleek Ponytail', price:75, duration:'1.5–2 hrs', deposit:25, hairIncluded:false, details:'Smooth molded base with polished styling. Client supplies bundle/extension hair unless discussed.' },
  { id:'quickweave', category:'Weaves', name:'Quick Weave', price:100, duration:'2–3 hrs', deposit:25, hairIncluded:false, details:'Protective cap foundation with clean blending and styling.' },
  { id:'bobbraids', category:'Braids', name:'Bob Braids', price:150, duration:'3–5 hrs', deposit:25, hairIncluded:true, details:'Chic bob-length braid style with natural-color hair included.' }
];

export const addOns = [
  { id:'extra-length', name:'Extra Length', price:25 },
  { id:'boho', name:'Boho Curls', price:35 },
  { id:'custom-color', name:'Custom Hair Color', price:20, note:'Client may need to provide hair if outside 1, 1B, 2, or 4.' },
  { id:'wash', name:'Wash + Blow Dry Prep', price:30 }
];

export function calculateBookingTotal(serviceId, addOnIds = []) {
  const service = services.find(item => item.id === serviceId) || services[0];
  const selectedAddOns = addOns.filter(item => addOnIds.includes(item.id));
  const addOnTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const estimatedTotal = service.price + addOnTotal;
  return { service, selectedAddOns, addOnTotal, estimatedTotal, depositDue: businessRules.deposit, remainingBalance: Math.max(estimatedTotal - businessRules.deposit, 0) };
}

export function buildBookingMessage({ name, phone, serviceId, addOnIds, date, time, notes }) {
  const quote = calculateBookingTotal(serviceId, addOnIds);
  const addOnText = quote.selectedAddOns.length ? quote.selectedAddOns.map(a => `${a.name} (+$${a.price})`).join(', ') : 'None';
  return `Hi Ravishing Beauté, I would like to request an appointment.\n\nName: ${name || ''}\nPhone: ${phone || ''}\nService: ${quote.service.name}\nAdd-ons: ${addOnText}\nPreferred date: ${date || ''}\nPreferred time: ${time || ''}\nEstimated total: $${quote.estimatedTotal}\nDeposit: $${quote.depositDue}\nNotes: ${notes || ''}`;
}
