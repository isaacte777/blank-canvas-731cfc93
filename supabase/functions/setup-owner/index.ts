import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins for CORS
const allowedOrigins = [
  'https://vision-hug.lovable.app',
  'https://id-preview--28130d7e-bc45-44d3-ad12-e2972ad3ae99.lovable.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.lovable.app'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-setup-token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Security: Require setup token for owner creation
    const setupToken = req.headers.get('x-setup-token');
    const expectedToken = Deno.env.get('SETUP_OWNER_SECRET');

    // If a secret is configured, validate it
    if (expectedToken && setupToken !== expectedToken) {
      console.error('Invalid or missing setup token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid setup token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any owner already exists
    const { data: existingOwners } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'owner');

    if (existingOwners && existingOwners.length > 0) {
      return new Response(
        JSON.stringify({ error: 'An owner already exists. Only one owner is allowed.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating owner user:', email);

    // Create the user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || 'Dueño Principal' }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', userData.user.id);

    // Update role to owner
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: 'owner' })
      .eq('user_id', userData.user.id);

    if (roleError) {
      console.error('Error updating role:', roleError);
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Owner role assigned successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Owner created successfully', userId: userData.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in setup-owner function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});