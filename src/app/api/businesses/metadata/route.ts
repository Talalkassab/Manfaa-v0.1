import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('Fetching business metadata (categories and locations)');
    
    // Get unique categories
    const { data: categoryData, error: categoryError } = await supabase
      .from('businesses')
      .select('category')
      .eq('status', 'approved')
      .not('category', 'is', null);
    
    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }
    
    // Get unique locations
    const { data: locationData, error: locationError } = await supabase
      .from('businesses')
      .select('location')
      .eq('status', 'approved')
      .not('location', 'is', null);
    
    if (locationError) {
      console.error('Error fetching locations:', locationError);
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }
    
    // Extract unique categories
    const categories = [...new Set(
      categoryData
        .map(item => item.category)
        .filter(Boolean) // Remove nulls and empty strings
    )].sort();
    
    // Extract unique locations
    const locations = [...new Set(
      locationData
        .map(item => item.location)
        .filter(Boolean) // Remove nulls and empty strings
    )].sort();
    
    // Add default categories if we don't have enough from the database
    if (categories.length < 5) {
      const defaultCategories = [
        "Food & Beverage",
        "Technology",
        "Retail",
        "Health & Fitness",
        "Education",
        "Professional Services",
        "Manufacturing",
        "Construction",
        "Transportation"
      ];
      
      defaultCategories.forEach(category => {
        if (!categories.includes(category)) {
          categories.push(category);
        }
      });
    }
    
    // Add default locations if we don't have enough from the database
    if (locations.length < 5) {
      const defaultLocations = [
        "Riyadh",
        "Jeddah",
        "Dammam",
        "Mecca",
        "Medina",
        "Khobar",
        "Dhahran",
        "Online"
      ];
      
      defaultLocations.forEach(location => {
        if (!locations.includes(location)) {
          locations.push(location);
        }
      });
    }
    
    return NextResponse.json({
      categories,
      locations
    });
  } catch (error) {
    console.error('Unexpected error fetching business metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 