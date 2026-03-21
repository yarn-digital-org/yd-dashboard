# Custom Subdomain Setup: app.yarndigital.co.uk

## What
Move the YD Dashboard from `yd-dashboard.vercel.app` to `app.yarndigital.co.uk`.

## Why
- Professional branding on landing pages (ads currently link to a Vercel subdomain)
- SEO: keeps all brand equity under yarndigital.co.uk
- Consistent with the main site

## Steps (5 minutes)

### Step 1: Add domain in Vercel (Bolt does this)
Already prepped — just needs the DNS record to validate.

### Step 2: Add DNS record in Fasthosts
Log into Fasthosts → Advanced DNS → Add CNAME Record:

| Host Name | Points To |
|-----------|-----------|
| `app` | `cname.vercel-dns.com` |

That's it. One CNAME record.

### Step 3: Wait for propagation
- Usually 5-15 minutes with Fasthosts
- Can take up to 24 hours in rare cases

### Step 4: Verify in Vercel (Bolt does this)
Once DNS propagates, Vercel auto-provisions SSL and routes traffic.

### Step 5: Update ad landing page URLs
All ads currently pointing to `yd-dashboard.vercel.app/...` get updated to `app.yarndigital.co.uk/...`. Blaze handles this.

## What NOT to change
- Do NOT remove or change the existing A records (31.43.160.6 / 31.43.161.6) — those are for the main site on Framer
- Do NOT touch the www CNAME → sites.framer.app
- Do NOT touch MX records

## Timeline
- DNS change: 2 minutes (Jonny)
- Vercel config: 5 minutes (Bolt)
- Ad URL updates: 15 minutes (Blaze)
- Total: ~30 minutes end-to-end

## Meta Pixel snippet (ready to inject to Framer)
Pixel ID: 2078268825978104

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2078268825978104');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=2078268825978104&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```

This goes into Framer via `setCustomCode({ headStart: { html: "..." } })` — one API call, covers every page on yarndigital.co.uk.
