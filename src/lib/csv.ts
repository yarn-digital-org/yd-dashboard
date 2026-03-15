/**
 * CSV parsing and generation utilities
 */

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export interface CSVParseOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  skipEmptyLines?: boolean;
}

/**
 * Parse CSV string into headers and rows
 */
export function parseCSV(content: string, options: CSVParseOptions = {}): CSVParseResult {
  const { delimiter = ',', hasHeaders = true, skipEmptyLines = true } = options;
  
  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];
  
  for (const line of lines) {
    if (skipEmptyLines && line.trim() === '') continue;
    
    const row = parseCSVLine(line, delimiter);
    rows.push(row);
  }
  
  if (rows.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }
  
  const headers = hasHeaders ? rows.shift()! : rows[0].map((_, i) => `Column ${i + 1}`);
  
  return {
    headers,
    rows,
    rowCount: rows.length
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  fields.push(current.trim());
  return fields;
}

/**
 * Generate CSV string from data
 */
export function generateCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escapeField = (field: any): string => {
    const str = field === null || field === undefined ? '' : String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const headerLine = headers.map(escapeField).join(',');
  const dataLines = rows.map(row => row.map(escapeField).join(','));
  
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Common contact field mappings for auto-detection
 */
export const FIELD_MAPPINGS: Record<string, string[]> = {
  firstName: ['first name', 'firstname', 'first', 'given name', 'givenname', 'fname', 'name prefix'],
  lastName: ['last name', 'lastname', 'last', 'surname', 'family name', 'familyname', 'lname', 'family name yomi'],
  email: ['email', 'email address', 'e-mail', 'mail', 'emailaddress'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'phone number', 'contact number', 'phone 1 - value', 'phone 1 value'],
  company: ['company', 'organization', 'organisation', 'business', 'employer', 'company name', 'organization 1 - name', 'organization name'],
  jobTitle: ['job title', 'jobtitle', 'title', 'position', 'role', 'job'],
  website: ['website', 'web', 'url', 'site', 'homepage'],
  street: ['street', 'address', 'address line 1', 'street address', 'address1'],
  city: ['city', 'town', 'locality'],
  state: ['state', 'province', 'region', 'county'],
  zip: ['zip', 'postal code', 'postcode', 'zip code', 'zipcode'],
  country: ['country', 'nation'],
  notes: ['notes', 'comments', 'description', 'memo'],
  type: ['type', 'contact type', 'category', 'status'],
  tags: ['tags', 'labels', 'keywords'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile'],
  twitter: ['twitter', 'twitter handle', 'x', 'x handle'],
  instagram: ['instagram', 'ig', 'instagram handle'],
};

/**
 * Auto-detect field mapping from CSV headers
 */
export function autoMapFields(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const csvHeader of csvHeaders) {
    const normalized = csvHeader.toLowerCase().trim();
    
    for (const [field, aliases] of Object.entries(FIELD_MAPPINGS)) {
      if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
        mapping[csvHeader] = field;
        break;
      }
    }
  }
  
  return mapping;
}

/**
 * Contact fields available for mapping
 */
export const CONTACT_FIELDS = [
  { value: 'firstName', label: 'First Name', required: true },
  { value: 'lastName', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: true },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'website', label: 'Website' },
  { value: 'street', label: 'Street Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State/Province' },
  { value: 'zip', label: 'Postal Code' },
  { value: 'country', label: 'Country' },
  { value: 'notes', label: 'Notes' },
  { value: 'type', label: 'Contact Type' },
  { value: 'tags', label: 'Tags' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: '', label: '— Skip this column —' },
];
