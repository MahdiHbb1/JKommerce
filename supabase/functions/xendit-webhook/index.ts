import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify callback token
    const callbackToken = req.headers.get('x-callback-token');
    const expectedToken = Deno.env.get('XENDIT_CALLBACK_TOKEN');
    
    if (!callbackToken || callbackToken !== expectedToken) {
      console.error('Invalid callback token');
      return new Response(
        JSON.stringify({ error: 'Invalid callback token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const body = await req.json();
    const { external_id, status } = body;

    if (!external_id || !status) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update order status based on Xendit webhook status
    let newStatus: string;
    if (status === 'PAID') {
      newStatus = 'paid';
    } else if (status === 'EXPIRED') {
      newStatus = 'expired';
    } else {
      // For other statuses, just log and return success
      console.log(`Received webhook with status: ${status} for order: ${external_id}`);
      return new Response(
        JSON.stringify({ message: 'Webhook received' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Update order in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('order_number', external_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log(`Order ${external_id} status updated to ${newStatus}`);

    return new Response(
      JSON.stringify({ message: 'Order status updated' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
