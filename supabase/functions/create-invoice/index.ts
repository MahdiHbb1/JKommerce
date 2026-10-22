import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  order_number: string;
  amount: number;
  payer_email: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  success_redirect_url: string;
  failure_redirect_url: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      throw new Error('XENDIT_SECRET_KEY is not configured');
    }

    const body: InvoiceRequest = await req.json();
    const { order_number, amount, payer_email, items, success_redirect_url, failure_redirect_url } = body;

    if (!order_number || !amount || !payer_email || !items || !success_redirect_url || !failure_redirect_url) {
      throw new Error('Missing required fields');
    }

    // Create Xendit invoice
    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(xenditSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: order_number,
        amount: amount,
        payer_email: payer_email,
        description: `Order ${order_number}`,
        currency: 'IDR',
        items: items,
        success_redirect_url: success_redirect_url,
        failure_redirect_url: failure_redirect_url,
      }),
    });

    if (!xenditResponse.ok) {
      const errorText = await xenditResponse.text();
      console.error('Xendit API error:', errorText);
      throw new Error(`Xendit API error: ${xenditResponse.status}`);
    }

    const xenditData = await xenditResponse.json();
    
    return new Response(
      JSON.stringify({
        invoice_url: xenditData.invoice_url,
        invoice_id: xenditData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
