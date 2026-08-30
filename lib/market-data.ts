export interface LiveMandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export async function fetchLiveAgmarknetPrices(
  cropName: string,
  mandiName: string
): Promise<LiveMandiRecord[] | null> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY || process.env.AGMARKNET_API_KEY;

  if (!apiKey || apiKey === 'your_data_gov_in_key') {
    return null;
  }

  try {
    // Government of India Open Data Platform (Agmarknet Daily Prices API Resource ID)
    const resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
    const cleanCrop = cropName.split(' ')[0].toLowerCase();
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=20&filters[commodity]=${encodeURIComponent(
      cleanCrop
    )}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const records = json.records || [];
      if (records.length > 0) {
        return records.map((r: any) => ({
          state: r.state || 'Maharashtra',
          district: r.district || '',
          market: r.market || mandiName,
          commodity: r.commodity || cropName,
          variety: r.variety || 'Local',
          arrival_date: r.arrival_date || new Date().toISOString().split('T')[0],
          min_price: parseFloat(r.min_price) || 1500,
          max_price: parseFloat(r.max_price) || 2500,
          modal_price: parseFloat(r.modal_price) || 2000,
        }));
      }
    }
  } catch (err) {
    console.warn('Data.gov.in Agmarknet fetch error, falling back to SQLite database:', err);
  }

  return null;
}
