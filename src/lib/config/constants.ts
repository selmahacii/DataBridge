// shared constants and option lists
// FIXME: the 'other' industry should probably be split into more specific
// categories once we have a better picture of actual client verticals

export type ClientStatus = 'active' | 'trial' | 'suspended' | 'churned'
export type Industry = 'retail' | 'restaurant' | 'btp' | 'healthcare' | 'services' | 'manufacturing' | 'logistics' | 'ecommerce' | 'other'

export const industryOptions: { value: Industry; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'btp', label: 'Business/Technology Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'services', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'other', label: 'Other' },
]

export const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' },
]
