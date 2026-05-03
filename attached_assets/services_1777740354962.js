export const BRAND_RULES = [
  '$25 deposit required.',
  'Business hours are 8:30 AM to 6:00 PM by appointment.',
  'Closed Sunday and Monday.',
  'Same-day bookings only if approved.',
  'Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.'
];

export const SERVICES = [
  { id:'knotless-sm', name:'Small Knotless Braids', basePrice:220, durationHours:6, hairIncluded:true, description:'Clean parting, lightweight finish, and natural-color hair included for colors 1, 1B, 2, and 4.' },
  { id:'knotless-med', name:'Medium Knotless Braids', basePrice:180, durationHours:5, hairIncluded:true, description:'A polished everyday braid style with balanced sizing and neat finishing.' },
  { id:'feedins', name:'Feed-In Braids', basePrice:95, durationHours:3, hairIncluded:true, description:'Sleek feed-in braid styles with clean sections and a smooth finish.' },
  { id:'ponytail', name:'Sleek Ponytail', basePrice:85, durationHours:2, hairIncluded:false, description:'Smooth, polished ponytail styling for a clean finished look.' },
  { id:'quick-weave', name:'Quick Weave', basePrice:120, durationHours:3, hairIncluded:false, description:'Foundation, placement, and styling focused on a polished install.' },
  { id:'bob-braids', name:'Bob Braids', basePrice:160, durationHours:4, hairIncluded:true, description:'Sharp, clean bob braids with natural-color hair included when applicable.' },
  { id:'take-down', name:'Take Down / Prep', basePrice:45, durationHours:1, hairIncluded:false, description:'Service prep or previous style removal when approved with booking.' }
];

export const ADD_ONS = [
  { id:'length-waist', name:'Waist length', price:35 },
  { id:'length-butt', name:'Butt length', price:55 },
  { id:'boho', name:'Boho pieces', price:45 },
  { id:'wash', name:'Wash + blow dry', price:25 },
  { id:'style-change', name:'Custom design change', price:20 }
];

export const APPROVED_REVIEWS = [
  { name:'Client Review', text:'Very neat parts and the style came out polished. The booking process was clear and professional.' },
  { name:'Client Review', text:'Loved the finished look. Everything felt organized from the appointment details to the final style.' },
  { name:'Client Review', text:'Clean work, good communication, and the style lasted beautifully.' },
  { name:'Client Review', text:'Professional service and the results looked exactly like the inspiration.' }
];

export const GALLERY_IMAGES = [
  { src:'hero1', caption:'Signature polished braid work' },
  { src:'style1', caption:'Clean detail and finish' },
  { src:'braids1', caption:'Braids styled for visual impact' },
  { src:'client1', caption:'Client-ready finished look' },
  { src:'braids2', caption:'Protective styling with neat parts' },
  { src:'hero2', caption:'Premium Ravishing Beauté styling' },
  { src:'img3482', caption:'Stylist / brand portrait placeholder' }
];
