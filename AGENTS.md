<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Payments go through `src/lib/payments/providers.server.ts`; tickets are issued only by `fulfill_order` after server-side provider verification — never trust the browser.
- Sandbox payments run only when PAYMENT_SANDBOX="true"; default is real provider so production never fakes success.
- Rate limiting uses the `hit_rate_limit` SQL function keyed by action+IP (or staff user for scans) — no platform primitive exists.

- Organiser pages share authenticated, RLS-scoped server functions and a single query cache; invalidate it after mutations so all reports reflect saved records.
- Gate admission uses the atomic scan_ticket RPC, never a browser-side status update, to prevent double entry.
- CSV exports escape spreadsheet formulas to prevent customer input from executing in spreadsheets.
