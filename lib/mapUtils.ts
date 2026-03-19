import type { Continent, Destination, PinState } from '@/lib/types'

export function getPinState(destination: Destination): PinState {
  if (destination.visits.some((v) => v.type === 'lived')) return 'lived'
  if (destination.visits.length > 0) return 'visited'
  if (destination.intent?.state === 'planning') return 'planning'
  return 'on my list'
}

const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  // Europe
  'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe',
  'Spain': 'Europe', 'Portugal': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe',
  'Switzerland': 'Europe', 'Austria': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe',
  'Denmark': 'Europe', 'Finland': 'Europe', 'Ireland': 'Europe', 'Poland': 'Europe',
  'Czech Republic': 'Europe', 'Czechia': 'Europe', 'Greece': 'Europe', 'Turkey': 'Europe',
  'Croatia': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe', 'Bulgaria': 'Europe',
  'Iceland': 'Europe', 'Cyprus': 'Europe', 'Malta': 'Europe', 'Luxembourg': 'Europe',
  'Estonia': 'Europe', 'Latvia': 'Europe', 'Lithuania': 'Europe', 'Slovenia': 'Europe',
  'Slovakia': 'Europe', 'Serbia': 'Europe', 'Montenegro': 'Europe', 'Albania': 'Europe',
  'North Macedonia': 'Europe', 'Bosnia and Herzegovina': 'Europe', 'Moldova': 'Europe',
  'Ukraine': 'Europe', 'Belarus': 'Europe', 'Russia': 'Europe',
  // North America
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Cuba': 'North America', 'Jamaica': 'North America', 'Dominican Republic': 'North America',
  'Costa Rica': 'North America', 'Panama': 'North America', 'Guatemala': 'North America',
  'Honduras': 'North America', 'El Salvador': 'North America', 'Nicaragua': 'North America',
  'Belize': 'North America', 'Haiti': 'North America', 'Trinidad and Tobago': 'North America',
  'Bahamas': 'North America', 'Barbados': 'North America', 'Puerto Rico': 'North America',
  // South America
  'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
  'Peru': 'South America', 'Chile': 'South America', 'Ecuador': 'South America',
  'Bolivia': 'South America', 'Paraguay': 'South America', 'Uruguay': 'South America',
  'Venezuela': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
  // Asia
  'Japan': 'Asia', 'China': 'Asia', 'South Korea': 'Asia', 'India': 'Asia',
  'Thailand': 'Asia', 'Vietnam': 'Asia', 'Indonesia': 'Asia', 'Philippines': 'Asia',
  'Malaysia': 'Asia', 'Singapore': 'Asia', 'Cambodia': 'Asia', 'Myanmar': 'Asia',
  'Laos': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia', 'Sri Lanka': 'Asia',
  'Nepal': 'Asia', 'Bangladesh': 'Asia', 'Pakistan': 'Asia', 'Afghanistan': 'Asia',
  'Iran': 'Asia', 'Iraq': 'Asia', 'Israel': 'Asia', 'Jordan': 'Asia',
  'Lebanon': 'Asia', 'Saudi Arabia': 'Asia', 'United Arab Emirates': 'Asia',
  'Qatar': 'Asia', 'Oman': 'Asia', 'Kuwait': 'Asia', 'Bahrain': 'Asia',
  'Mongolia': 'Asia', 'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia',
  // Africa
  'South Africa': 'Africa', 'Egypt': 'Africa', 'Morocco': 'Africa', 'Kenya': 'Africa',
  'Tanzania': 'Africa', 'Nigeria': 'Africa', 'Ghana': 'Africa', 'Ethiopia': 'Africa',
  'Tunisia': 'Africa', 'Algeria': 'Africa', 'Senegal': 'Africa', 'Uganda': 'Africa',
  'Rwanda': 'Africa', 'Mozambique': 'Africa', 'Zimbabwe': 'Africa', 'Botswana': 'Africa',
  'Namibia': 'Africa', 'Madagascar': 'Africa', 'Mauritius': 'Africa', 'Zambia': 'Africa',
  // Oceania
  'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
  'Papua New Guinea': 'Oceania', 'Samoa': 'Oceania', 'Tonga': 'Oceania',
  'French Polynesia': 'Oceania', 'New Caledonia': 'Oceania',
  // Antarctica
  'Antarctica': 'Antarctica',
}

export function countryToContinent(country: string): Continent | undefined {
  return COUNTRY_TO_CONTINENT[country]
}
