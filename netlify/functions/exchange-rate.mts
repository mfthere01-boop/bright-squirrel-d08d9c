export default async (request: Request) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Rate provider unavailable');
    const data = await response.json();
    const rate = data.rates?.PHP;
    const updatedAt = data.time_last_update_unix;
    if (data.result !== 'success' || data.base_code !== 'USD' ||
        !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(updatedAt) || updatedAt <= 0) {
      throw new Error('Invalid exchange rate');
    }
    return Response.json({ rate, updatedAt, base: 'USD', target: 'PHP' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'Exchange rate unavailable. Please retry or enter a rate manually.' }, { status: 502 });
  }
};
