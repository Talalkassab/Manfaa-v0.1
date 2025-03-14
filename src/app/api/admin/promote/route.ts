import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: `User not found with email: ${email}` },
        { status: 404 }
      )
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { role: 'admin' } }
    )

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `User ${email} has been successfully promoted to admin role.`
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred while promoting the user.' },
      { status: 500 }
    )
  }
} 