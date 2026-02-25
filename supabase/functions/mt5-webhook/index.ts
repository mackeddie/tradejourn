import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// Simple hash function for API key comparison
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function detectAssetClass(symbol: string): string {
  const forex = /^(EUR|USD|GBP|JPY|AUD|NZD|CAD|CHF){6}$/i
  const crypto = /(BTC|ETH|LTC|XRP|ADA|DOT|SOL|DOGE|BNB)/i
  const commodities = /^(XAUUSD|XAGUSD|GOLD|SILVER|OIL|BRENT|WTI|USOIL|UKOIL)/i

  if (commodities.test(symbol)) return 'commodities'
  if (crypto.test(symbol)) return 'crypto'
  if (forex.test(symbol)) return 'forex'
  return 'stocks'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Hash the provided key and look it up
    const keyHash = await hashApiKey(apiKey)
    const { data: keyRecord, error: keyError } = await supabase
      .from('webhook_api_keys')
      .select('id, user_id, is_active')
      .eq('api_key_hash', keyHash)
      .maybeSingle()

    if (keyError || !keyRecord) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!keyRecord.is_active) {
      return new Response(JSON.stringify({ error: 'API key is disabled' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update last_used_at
    await supabase
      .from('webhook_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)

    const body = await req.json()
    const {
      ticket,
      symbol,
      type, // 0=buy, 1=sell
      volume,
      open_price,
      close_price,
      sl,
      tp,
      profit,
      open_time,
      close_time,
    } = body

    if (!ticket || !symbol || open_price === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields: ticket, symbol, open_price' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('trades')
      .select('id')
      .eq('mt5_ticket', String(ticket))
      .eq('user_id', keyRecord.user_id)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ message: 'Trade already exists', trade_id: existing.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const direction = type === 0 || type === 'buy' ? 'buy' : 'sell'
    const pl = profit ?? (close_price ? (direction === 'buy' ? close_price - open_price : open_price - close_price) * (volume || 1) : null)
    const status = pl === null ? null : pl > 0 ? 'win' : pl < 0 ? 'loss' : 'breakeven'

    const tradeData = {
      user_id: keyRecord.user_id,
      symbol: symbol.toUpperCase(),
      asset_class: detectAssetClass(symbol),
      direction,
      entry_date: open_time || new Date().toISOString(),
      exit_date: close_time || new Date().toISOString(),
      entry_price: open_price,
      exit_price: close_price ?? null,
      lot_size: volume || 0.01,
      stop_loss: sl || null,
      take_profit: tp || null,
      profit_loss: pl,
      status,
      strategy: 'MT5 Auto-Sync',
      mt5_ticket: String(ticket),
      needs_review: true,
    }

    const { data: trade, error: insertError } = await supabase
      .from('trades')
      .insert(tradeData)
      .select('id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to insert trade' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, trade_id: trade.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
