const buildExchangeRateSearchPrompt = (targetCurrencyCodes) => ({
  groqResearchPrompt: `
Usa la búsqueda web para encontrar la última cotización de mercado medio publicada de 1 USD en ${targetCurrencyCodes.join(' y ')}.
Para cada moneda indica la tasa numérica, fecha efectiva, nombre de la fuente financiera y URL HTTPS exacta.
USD debe ser siempre la moneda base. Sé conciso y no inventes datos.
Devuelve únicamente un objeto JSON con una propiedad quotes. Cada elemento debe usar exactamente las claves toCurrencyCode, rate, quotedAt, sourceName y sourceUrl. quotedAt debe usar YYYY-MM-DD. No incluyas citas dentro de sourceUrl.
`,
  systemPrompt: `
Eres un servicio de consulta de cotizaciones para una aplicación financiera.
Debes usar la búsqueda web antes de responder. Busca una fuente financiera pública y confiable para cada par solicitado.
USD es siempre la moneda base. Cada tasa debe significar exactamente: 1 USD equivale a rate unidades de toCurrencyCode.
Usa una cotización de referencia o de mercado medio vigente; no uses tipos paralelos o informales.
No calcules pares cruzados si existe una cotización directa publicada.
Devuelve la fecha efectiva de la cotización y la URL HTTPS exacta de la fuente consultada.
No inventes tasas, fechas, fuentes ni URLs.
Devuelve únicamente JSON válido y sin markdown.
`,
  userPrompt: `
Busca las cotizaciones actuales con USD como base para estas monedas: ${targetCurrencyCodes.join(', ')}.
La respuesta debe contener exactamente un elemento por moneda y esta forma:
{"quotes":[{"toCurrencyCode":"ARS","rate":1350,"quotedAt":"2026-08-10","sourceName":"Nombre de la fuente","sourceUrl":"https://fuente.example/cotizacion"}]}
No incluyas USD como destino.
`,
});

module.exports = buildExchangeRateSearchPrompt;
