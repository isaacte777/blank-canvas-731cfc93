import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowed origins for CORS
const allowedOrigins = [
  'https://vision-hug.lovable.app',
  'https://id-preview--28130d7e-bc45-44d3-ad12-e2972ad3ae99.lovable.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.lovable.app'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Create regular client to verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the caller is a pastor
    const { data: { user: caller } } = await supabaseClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if caller is pastor or owner
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)

    const roles = callerRoles?.map(r => r.role) || []
    const isPastorOrOwner = roles.includes('pastor') || roles.includes('owner')

    if (!isPastorOrOwner) {
      console.log('Access denied for user:', caller.id, 'roles:', roles)
      return new Response(JSON.stringify({ error: 'Only owners or pastors can create admins' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Access granted for user:', caller.id, 'roles:', roles)

    // Get request body
    const { email, password, fullName } = await req.json()

    // Server-side input validation
    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate password length (minimum 12 characters)
    if (password.length < 12) {
      return new Response(JSON.stringify({ error: 'Password must be at least 12 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate fullName length (2-100 characters)
    const trimmedName = fullName.trim()
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return new Response(JSON.stringify({ error: 'Full name must be between 2 and 100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      // User exists - check if they already have admin/pastor/owner role
      const { data: existingRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUser.id)

      const existingRolesList = existingRoles?.map(r => r.role) || []
      
      if (existingRolesList.includes('admin') || existingRolesList.includes('pastor') || existingRolesList.includes('owner')) {
        return new Response(JSON.stringify({ error: 'Este usuario ya es administrador' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // User exists but is not admin - promote them
      console.log('User exists, promoting to admin:', existingUser.id)
      
      if (existingRoles && existingRoles.length > 0) {
        // Update existing role
        const { error: updateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', existingUser.id)

        if (updateError) {
          console.error('Error updating role:', updateError)
          return new Response(JSON.stringify({ error: 'Error al actualizar el rol: ' + updateError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } else {
        // Insert new role
        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: existingUser.id, role: 'admin' })

        if (insertError) {
          console.error('Error inserting role:', insertError)
          return new Response(JSON.stringify({ error: 'Error al asignar el rol: ' + insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Update profile with new name if provided
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', existingUser.id)

      return new Response(JSON.stringify({ 
        success: true, 
        user: { id: existingUser.id, email: existingUser.email },
        message: 'Usuario existente promovido a administrador'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create new user with admin API (doesn't affect caller's session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
      // Translate common error messages
      let errorMessage = createError.message
      if (errorMessage.includes('already been registered')) {
        errorMessage = 'Ya existe un usuario registrado con este correo electrónico'
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update role to admin (the trigger creates a 'user' role by default)
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', newUser.user.id)
      .single()

    if (userRole) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', newUser.user.id)

      if (roleError) {
        console.error('Error updating role for new user:', roleError)
        return new Response(JSON.stringify({ error: 'Usuario creado pero error al asignar rol: ' + roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      // No role exists, insert one
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role: 'admin' })

      if (insertError) {
        console.error('Error inserting role for new user:', insertError)
        return new Response(JSON.stringify({ error: 'Usuario creado pero error al asignar rol: ' + insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: newUser.user.id, email: newUser.user.email }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})