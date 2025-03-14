// This file defines the mapping between frontend field names and database column names
// It acts as a single source of truth for database schema

// Types for better TypeScript support
export interface SchemaMapping {
  fields: Record<string, string>;
  toDatabase: (formData: any) => Record<string, any>;
  toForm: (dbData: any) => Record<string, any>;
  validate: (formData: any) => { valid: boolean; errors?: { missing: string[] } };
}

// Business table schema
export const BUSINESS_SCHEMA: SchemaMapping = {
  // Frontend form field name -> Database column name (using snake_case for database columns)
  fields: {
    // Map camelCase form fields to snake_case database columns
    title: 'name', // Frontend uses 'title', but database uses 'name'
    category: 'category',
    description: 'description',
    location: 'location', // Database uses 'location' as per schema.sql
    establishedYear: 'general_info.established_year', // Using JSONB field
    employees: 'operational_info.employees', // Using JSONB field for employees
    askingPrice: 'asking_price', // Direct column, not JSONB
    revenue: 'financial_info.revenue', // Store in financial_info JSONB field
    profit: 'financial_info.profit',
    inventory: 'financial_info.inventory_value',
    assets: 'financial_info.asset_value',
    reason: 'reason_for_selling',
    privacyLevel: 'privacy_level',
    status: 'status',
    slug: 'slug', // Explicitly mapping slug field
    owner_id: 'owner_id', // Map the owner_id field to the database column
  },
  
  // For transforming frontend form data to database structure
  toDatabase: (formData: any) => {
    const result: Record<string, any> = {};
    const financialInfo: Record<string, any> = {};
    const generalInfo: Record<string, any> = {};
    const operationalInfo: Record<string, any> = {};
    
    // Process non-financial fields with direct mapping
    Object.entries(BUSINESS_SCHEMA.fields).forEach(([formField, dbColumn]) => {
      if (formData[formField] !== undefined) {
        // Skip JSONB fields for separate processing
        if (['revenue', 'profit', 'inventory', 'assets', 'establishedYear', 'employees'].includes(formField)) {
          return;
        }
        
        // Direct assignment for non-JSONB fields
        if (typeof dbColumn === 'string' && !dbColumn.includes('.')) {
          result[dbColumn] = formData[formField];
        }
      }
    });
    
    // Process financial fields
    ['revenue', 'profit', 'inventory', 'assets'].forEach(field => {
      if (formData[field] !== undefined) {
        const value = formData[field];
        let numericValue = null;
        
        if (value !== null && value !== '') {
          if (typeof value === 'string') {
            // Remove currency symbols and commas before parsing
            const cleanValue = value.replace(/[$,]/g, '');
            numericValue = parseFloat(cleanValue) || null;
          } else if (typeof value === 'number') {
            numericValue = value;
          }
        }
        
        // Map fields to their database names
        const dbFieldName = field === 'revenue' ? 'revenue' :
                           field === 'profit' ? 'profit' :
                           field === 'inventory' ? 'inventory_value' :
                           field === 'assets' ? 'asset_value' : field;
        
        financialInfo[dbFieldName] = numericValue;
      }
    });
    
    // Handle asking price separately as it's a direct column
    if (formData.askingPrice !== undefined) {
      const value = formData.askingPrice;
      let numericValue = null;
      
      if (value !== null && value !== '') {
        if (typeof value === 'string') {
          // Remove currency symbols and commas before parsing
          const cleanValue = value.replace(/[$,]/g, '');
          numericValue = parseFloat(cleanValue) || null;
        } else if (typeof value === 'number') {
          numericValue = value;
        }
      }
      
      result.asking_price = numericValue;
    }
    
    // Process general info fields
    if (formData.establishedYear !== undefined) {
      const value = formData.establishedYear;
      if (value !== null && value !== '') {
        if (typeof value === 'string') {
          generalInfo.established_year = parseInt(value) || null;
        } else if (typeof value === 'number') {
          generalInfo.established_year = value;
        }
      } else {
        generalInfo.established_year = null;
      }
    }
    
    // Process operational info fields
    if (formData.employees !== undefined) {
      const value = formData.employees;
      if (value !== null && value !== '') {
        if (typeof value === 'string') {
          operationalInfo.employees = parseInt(value) || null;
        } else if (typeof value === 'number') {
          operationalInfo.employees = value;
        }
      } else {
        operationalInfo.employees = null;
      }
    }
    
    // Add JSONB fields if they contain data
    if (Object.keys(financialInfo).length > 0) {
      result.financial_info = financialInfo;
    }
    
    if (Object.keys(generalInfo).length > 0) {
      result.general_info = generalInfo;
    }
    
    if (Object.keys(operationalInfo).length > 0) {
      result.operational_info = operationalInfo;
    }
    
    // Generate a slug from the title
    if (formData.title) {
      result.slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    } else {
      result.slug = `business-${Date.now()}`;
    }
    
    // Add timestamps
    result.updated_at = new Date().toISOString();
    
    return result;
  },
  
  // For transforming database data to frontend form structure
  toForm: (dbData: any) => {
    const result: Record<string, any> = {};
    
    // Create reverse mapping for easier lookup
    const reverseMap: Record<string, string> = {};
    Object.entries(BUSINESS_SCHEMA.fields).forEach(([formField, dbColumn]) => {
      // Handle JSONB fields differently
      if (dbColumn.includes('.')) {
        const [jsonField, jsonKey] = dbColumn.split('.');
        reverseMap[`${jsonField}.${jsonKey}`] = formField;
      } else {
        reverseMap[dbColumn] = formField;
      }
    });
    
    // Map non-JSONB database fields to form fields
    Object.entries(dbData || {}).forEach(([dbColumn, value]) => {
      if (dbColumn !== 'financial_info') {
        const formField = reverseMap[dbColumn];
        if (formField) {
          if (['establishedYear', 'employees', 'askingPrice', 'revenue', 'profit', 'inventory', 'assets'].includes(formField)) {
            // Convert numeric fields to strings for form fields
            result[formField] = value !== null ? value.toString() : '';
          } else {
            result[formField] = value !== null ? value : '';
          }
        } else {
          // For unmapped fields, keep them with their original database column name
          result[dbColumn] = value;
        }
      }
    });
    
    // Handle financial_info JSONB field
    if (dbData.financial_info) {
      Object.entries(dbData.financial_info).forEach(([key, value]) => {
        const formField = reverseMap[`financial_info.${key}`];
        if (formField) {
          // Convert numeric fields to strings for form fields
          result[formField] = value !== null ? value.toString() : '';
        }
      });
    }
    
    // Handle general_info JSONB field
    if (dbData.general_info) {
      Object.entries(dbData.general_info).forEach(([key, value]) => {
        const formField = reverseMap[`general_info.${key}`];
        if (formField) {
          result[formField] = value !== null ? value.toString() : '';
        }
      });
    }
    
    // Handle operational_info JSONB field
    if (dbData.operational_info) {
      Object.entries(dbData.operational_info).forEach(([key, value]) => {
        const formField = reverseMap[`operational_info.${key}`];
        if (formField) {
          result[formField] = value !== null ? value.toString() : '';
        }
      });
    }
    
    // Set default values for any missing fields
    Object.keys(BUSINESS_SCHEMA.fields).forEach(formField => {
      if (result[formField] === undefined) {
        result[formField] = '';
      }
    });
    
    // Initialize empty arrays
    if (!dbData.images) {
      result.images = [];
    }
    
    return result;
  },
  
  // Validation for required fields
  validate: (formData: any) => {
    // Required fields for business form
    const requiredFields = ['title', 'category', 'description', 'location'];
    const missing = requiredFields.filter(field => !formData[field]);
    
    return {
      valid: missing.length === 0,
      errors: missing.length > 0 ? { missing } : undefined
    };
  }
};

// Business files table schema
export const BUSINESS_FILES_SCHEMA: SchemaMapping = {
  fields: {
    businessId: 'business_id',
    filePath: 'file_path',
    fileName: 'file_name',
    fileType: 'file_type',
    fileSize: 'file_size',
    visibility: 'visibility',
    category: 'category',
    description: 'description',
    uploadedBy: 'uploaded_by',
  },
  
  // Transform to database format
  toDatabase: (formData: any) => {
    const result: Record<string, any> = {};
    
    Object.entries(BUSINESS_FILES_SCHEMA.fields).forEach(([formField, dbColumn]) => {
      if (formData[formField] !== undefined) {
        result[dbColumn] = formData[formField];
      }
    });
    
    // Add timestamp
    result.created_at = new Date().toISOString();
    result.updated_at = new Date().toISOString();
    
    return result;
  },
  
  // Transform to frontend format
  toForm: (dbData: any) => {
    const result: Record<string, any> = {};
    
    const reverseMap: Record<string, string> = {};
    Object.entries(BUSINESS_FILES_SCHEMA.fields).forEach(([formField, dbColumn]) => {
      reverseMap[dbColumn] = formField;
    });
    
    Object.entries(dbData || {}).forEach(([dbColumn, value]) => {
      const formField = reverseMap[dbColumn];
      if (formField) {
        result[formField] = value !== null ? value : '';
      } else {
        result[dbColumn] = value;
      }
    });
    
    return result;
  },
  
  // Validation
  validate: (formData: any) => {
    const requiredFields = [
      'businessId', 
      'filePath', 
      'fileName', 
      'fileType',
      'visibility',
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: {
          missing: missingFields
        }
      };
    }
    
    return { valid: true };
  }
};

// NDA table schema
export const NDA_SCHEMA: SchemaMapping = {
  fields: {
    businessId: 'business_id',
    userId: 'user_id',
    status: 'status',
    message: 'message',
  },
  
  toDatabase: (formData: any) => {
    const result: Record<string, any> = {};
    
    Object.entries(NDA_SCHEMA.fields).forEach(([formField, dbColumn]) => {
      if (formData[formField] !== undefined) {
        result[dbColumn] = formData[formField];
      }
    });
    
    // Add timestamps
    result.created_at = new Date().toISOString();
    result.updated_at = new Date().toISOString();
    
    return result;
  },
  
  toForm: (dbData: any) => {
    const result: Record<string, any> = {};
    
    const reverseMap: Record<string, string> = {};
    Object.entries(NDA_SCHEMA.fields).forEach(([formField, dbColumn]) => {
      reverseMap[dbColumn] = formField;
    });
    
    Object.entries(dbData || {}).forEach(([dbColumn, value]) => {
      const formField = reverseMap[dbColumn];
      if (formField) {
        result[formField] = value !== null ? value : '';
      } else {
        result[dbColumn] = value;
      }
    });
    
    return result;
  },
  
  validate: (formData: any) => {
    const requiredFields = [
      'businessId', 
      'userId',
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: {
          missing: missingFields
        }
      };
    }
    
    return { valid: true };
  }
};

// Helper function to check if a column exists in a Supabase error message
export function isColumnNotFoundError(error: any, columnName?: string): boolean {
  if (!error) return false;
  
  // Get the error message
  const errorMessage = error.message || '';
  
  // If a specific column name is provided, check for that column
  if (columnName) {
    return errorMessage.includes(`column "${columnName}" does not exist`) || 
           errorMessage.includes(`relation "${columnName}" does not exist`) ||
           errorMessage.includes(`Could not find the '${columnName}' column`);
  }
  
  // Check for any column not found error pattern
  return errorMessage.includes('column') && 
        (errorMessage.includes('does not exist') || 
         errorMessage.includes('Could not find') ||
         errorMessage.includes('schema cache'));
}

// Helper function to handle a column-not-found error by suggesting the correct field
export function handleColumnNotFoundError(error: any, schemaMap = BUSINESS_SCHEMA): { message: string, suggestedFix: string } {
  if (!error) return { message: "No error provided", suggestedFix: "" };
  
  // Extract column name from error message
  const errorMessage = error.message || '';
  let columnName = '';
  
  // Try different error patterns
  const patternMatches = [
    errorMessage.match(/column ["']([^"']+)["'] does not exist/),
    errorMessage.match(/Could not find the ['"]([^'"]+)['"] column/),
    errorMessage.match(/column ([a-zA-Z0-9_]+) of relation/),
  ];
  
  for (const match of patternMatches) {
    if (match && match[1]) {
      columnName = match[1];
      break;
    }
  }
  
  if (!columnName) {
    return { 
      message: "Unknown database schema error", 
      suggestedFix: "Check your database schema and form field mappings" 
    };
  }
  
  // Common JSONB field mappings
  const jsonbFieldMappings = {
    'employees': 'operational_info.employees',
    'established_year': 'general_info.established_year',
    'asking_price': 'financial_info.asking_price',
    'revenue': 'financial_info.revenue',
    'profit': 'financial_info.profit',
    'inventory_value': 'financial_info.inventory_value',
    'asset_value': 'financial_info.asset_value'
  };
  
  // Check if this is a field that should be in a JSONB structure
  if (jsonbFieldMappings[columnName]) {
    return {
      message: `The '${columnName}' column was not found in the database schema.`,
      suggestedFix: `This field should be stored in a JSONB structure. Make sure your database has the appropriate JSONB column (${jsonbFieldMappings[columnName].split('.')[0]}).`
    };
  }
  
  // Create reverse mapping to find frontend field
  const reverseMap: Record<string, string> = {};
  Object.entries(schemaMap.fields).forEach(([formField, dbColumn]) => {
    // Handle both regular fields and JSONB fields
    if (typeof dbColumn === 'string') {
      if (dbColumn.includes('.')) {
        // For JSONB fields, also map the base field name
        const [jsonbField, jsonbKey] = dbColumn.split('.');
        reverseMap[jsonbKey] = formField;
        reverseMap[dbColumn] = formField;
      } else {
        reverseMap[dbColumn] = formField;
      }
    }
  });
  
  // Check if columnName is a direct match in the reverse mapping
  if (reverseMap[columnName]) {
    return {
      message: `The '${columnName}' column is mapped to the frontend field '${reverseMap[columnName]}'.`,
      suggestedFix: `Make sure you're using the correct field name and that the database schema matches.`
    };
  }
  
  // Try to find an alternative field name
  let suggestion = '';
  
  // Check if a similarly named column exists by checking common variations
  const possibleAlternatives = [
    columnName.replace(/_/g, ''),                  // Remove all underscores
    columnName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),  // Convert camelCase to snake_case
    columnName.split('_').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(''), // Convert snake_case to camelCase
    columnName.includes('_id') ? columnName.replace('_id', 'Id') : columnName, // Convert _id to Id
    !columnName.includes('_id') && columnName.endsWith('id') ? columnName.replace(/id$/, '_id') : columnName, // Convert id to _id
  ];
  
  // Check all possible alternatives
  for (const alt of possibleAlternatives) {
    if (reverseMap[alt]) {
      suggestion = `Use '${reverseMap[alt]}' in your form instead of '${columnName}'.`;
      break;
    }
  }
  
  if (!suggestion) {
    // Check if this might be a field that should be in a JSONB structure
    const jsonbFields = ['financial_info', 'general_info', 'operational_info'];
    
    if (jsonbFields.some(field => columnName.includes(field))) {
      suggestion = `This appears to be related to a JSONB field. Check your JSONB field mappings in database-schema.ts.`;
    } else {
      suggestion = 'Check your database schema and ensure all form fields have correct mappings in database-schema.ts.';
    }
  }
  
  return {
    message: `Column '${columnName}' not found in the database schema.`,
    suggestedFix: suggestion
  };
}

// Helper function to get the correct db column name from a form field name
export function getDbColumnName(formField: string, schema = BUSINESS_SCHEMA): string | null {
  return schema.fields[formField] || null;
}

// Helper function to get the correct form field name from a db column name
export function getFormFieldName(dbColumn: string, schema = BUSINESS_SCHEMA): string | null {
  const reverseMap: Record<string, string> = {};
  Object.entries(schema.fields).forEach(([formField, column]) => {
    reverseMap[column] = formField;
  });
  
  return reverseMap[dbColumn] || null;
}

// Helper function to safely transform data between frontend and database
export function safeTransform(
  data: any, 
  direction: 'toDatabase' | 'toForm', 
  schema = BUSINESS_SCHEMA
): Record<string, any> {
  try {
    return schema[direction](data);
  } catch (error) {
    console.error(`Error in ${direction} transformation:`, error);
    // Return original data if transformation fails
    return data;
  }
} 