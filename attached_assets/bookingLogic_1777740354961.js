const DEPOSIT = 25;
const NATURAL_HAIR_COLORS = ['1', '1B', '2', '4'];

export function calculateBookingEstimate(form, services, addons) {
  const service = services.find(s => s.id === form.serviceId) || services[0];
  const selectedAddons = addons.filter(a => form.addons?.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, item) => sum + item.price, 0);
  const flags = [];

  if (form.sameDay) flags.push('Same-day requests require approval.');
  if (service?.hairIncluded && !NATURAL_HAIR_COLORS.includes(form.hairColor)) {
    flags.push('Selected hair color is outside included natural colors. Client must confirm hair details.');
  }

  return {
    base: service.basePrice,
    addons: addonsTotal,
    deposit: DEPOSIT,
    total: service.basePrice + addonsTotal,
    balanceAfterDeposit: service.basePrice + addonsTotal - DEPOSIT,
    flags
  };
}

export function buildSmsBookingText(form, service, estimate) {
  return [
    'Hi Ravishing Beauté, I would like to request an appointment.',
    `Name: ${form.name || ''}`,
    `Phone: ${form.phone || ''}`,
    `Service: ${service?.name || ''}`,
    `Preferred date: ${form.date || ''}`,
    `Preferred time: ${form.time || ''}`,
    service?.hairIncluded ? `Hair color: ${form.hairColor || ''}` : null,
    `Estimated service total: $${estimate.total}+`,
    `Deposit noted: $${estimate.deposit}`,
    form.sameDay ? 'Same-day request: Yes, approval needed.' : 'Same-day request: No.',
    `Notes: ${form.notes || ''}`
  ].filter(Boolean).join('\n');
}

export function buildSmsQuestionText(q) {
  return [
    'Hi Ravishing Beauté, I have a question.',
    `Name: ${q.name || ''}`,
    `Question: ${q.question || ''}`
  ].join('\n');
}
