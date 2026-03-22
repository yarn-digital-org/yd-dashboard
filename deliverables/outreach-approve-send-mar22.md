# Outreach: Approve & Send — March 22, 2026

**Status:** Done ✅
**Deployed:** commit 3f47a24

## What changed

The Approve button on the outreach board now:
1. Shows a confirm dialog with recipient name, email address, and subject
2. Calls `/api/outreach/prospects/{id}` PATCH `{action: 'approve'}` → sets status to `approved`
3. Immediately calls `/api/outreach/prospects/{id}/send` POST → fires the email
4. Shows inline success/error state on the row (auto-dismisses after 5s)

## Flow

```
Draft saved → Click "Approve & Send" → Confirm dialog → Approved + Email sent → Status: sent
```

## Rules

- Button is disabled (grey, "Draft needed") if no draftMessage saved
- Button is red ("Approve & Send") when draft is ready
- For email contacts: fires via Resend from jonny@yarndigital.co.uk
- For LinkedIn/Instagram/Phone: marks as sent, assumes manual send
- If approve succeeds but send fails: shows warning (prospect stays "approved" so you can retry)

## API

- `PATCH /api/outreach/prospects/{id}` `{ action: 'approve' }` → `{ status: 'approved', approvedAt }`
- `POST /api/outreach/prospects/{id}/send` → `{ sent: true, via: 'email', to: '...' }`
