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
Use shrink-safe containers, fluid grids and stacked mobile records for shared clinical UI; this prevents future nested overflow without hiding information.
Keep shared ScrollArea content block-sized and dialog headers clear of close controls; this prevents intrinsic-width clipping and overlapping long titles.
- New accounts always get the least-privileged role in the signup trigger; never read roles from signup metadata, because users control it.
- Responsive/role-guard browser QA lives in `scripts/qa/responsive_audit.py` (Python Playwright, read-only, credentials via env) and parses `ROUTE_ACCESS` from `src/lib/rbac.ts`; keep it dependency-free for the app so it never adds npm packages or writes clinical data.
