#!/usr/bin/env python3
"""CarePriority persistent responsive + role-guard QA suite.

Read-only: it signs in, navigates, measures layout, and opens/closes nothing
that writes data. It never submits clinical forms.

Requirements: Python 3 with the `playwright` package and its Chromium build
(`pip install playwright && playwright install chromium`). No npm dependency
is added to the app.

Usage:
  BASE_URL=http://localhost:8080 \
  QA_ADMIN_EMAIL=... QA_ADMIN_PASSWORD=... \
  QA_DOCTOR_EMAIL=... QA_DOCTOR_PASSWORD=... \
  QA_RECEPTIONIST_EMAIL=... QA_RECEPTIONIST_PASSWORD=... \
  QA_NURSE_EMAIL=... QA_NURSE_PASSWORD=... \
  python3 scripts/qa/responsive_audit.py [--out /tmp/carepriority-qa] [--quick]

Roles without credentials are skipped and reported as skipped.
Exit code is 1 when any overflow, guard, or navigation check fails.

Checks:
  1. No horizontal page overflow at every viewport for every page the role may open
     (document scrollWidth vs. viewport, plus the elements that stick out past the
     right edge, ignoring content inside intentional horizontal scrollers), and no
     content silently clipped by an overflow-hidden ancestor (ellipsis truncation
     and intentional scroll containers are allowed).
  2. Direct-URL role guards: allowed pages stay put; forbidden pages redirect away.
  3. Sidebar navigation shows exactly the pages the role may open.
The role -> page matrix is parsed from src/lib/rbac.ts (ROUTE_ACCESS) so it cannot drift.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
RBAC = ROOT / "src" / "lib" / "rbac.ts"

VIEWPORTS = [
    ("mobile-320", 320, 720),
    ("mobile-360", 360, 760),
    ("mobile-390", 390, 844),
    ("mobile-430", 430, 932),
    ("tablet-768", 768, 1024),
    ("tablet-1024", 1024, 768),
    ("laptop-1366x768", 1366, 768),
    ("desktop-1920x1080", 1920, 1080),
]
QUICK_VIEWPORTS = {"mobile-320", "tablet-768", "laptop-1366x768", "desktop-1920x1080"}

ROLES = ["admin", "doctor", "nurse", "receptionist"]
ACCOUNT_PAGES = {"/app/notifications", "/app/settings", "/app/profile"}


def load_route_access() -> dict[str, list[str]]:
    src = RBAC.read_text()
    block = re.search(r"ROUTE_ACCESS[^=]*=\s*\{(.*?)\};", src, re.S)
    if not block:
        raise SystemExit("Could not parse ROUTE_ACCESS from src/lib/rbac.ts")
    access: dict[str, list[str]] = {}
    for path, roles in re.findall(r'"(/app/[a-z-]+)"\s*:\s*\[([^\]]*)\]', block.group(1)):
        access[path] = re.findall(r'"([a-z]+)"', roles)
    if not access:
        raise SystemExit("ROUTE_ACCESS parsed empty")
    return access


OVERFLOW_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const insideScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true;
    }
    return false;
  };
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') continue;
    if (el.closest('.sr-only,[data-radix-popper-content-wrapper]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      if (insideScroller(el)) continue;
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.baseVal === undefined ? String(el.className) : '').slice(0, 120),
        text: (el.innerText || '').trim().slice(0, 60),
        left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      });
      if (offenders.length >= 8) break;
    }
  }
  // Content silently cut off by an overflow-hidden/clip ancestor (not ellipsis
  // truncation, not an intentional scroll container).
  const clipped = [];
  for (const el of document.querySelectorAll('main *, [role=dialog] *')) {
    if (clipped.length >= 8) break;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed' || s.position === 'absolute') continue;
    if (el.closest('.sr-only,[data-radix-popper-content-wrapper],svg')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (/(auto|scroll)/.test(ps.overflowX)) break;
      if (/(hidden|clip)/.test(ps.overflowX)) {
        if (ps.textOverflow === 'ellipsis' || s.textOverflow === 'ellipsis') break;
        const pr = p.getBoundingClientRect();
        if (r.right > pr.right + 2 || r.left < pr.left - 2) {
          clipped.push({
            tag: el.tagName.toLowerCase(),
            cls: (typeof el.className === 'string' ? el.className : '').slice(0, 120),
            text: (el.innerText || '').trim().slice(0, 60),
            right: Math.round(r.right), clipRight: Math.round(pr.right),
            clipCls: (typeof p.className === 'string' ? p.className : '').slice(0, 80),
          });
        }
        break;
      }
    }
  }
  return { vw, sw, overflow: sw > vw + 1, offenders, clipped };
}
"""


async def sign_in(page, base: str, email: str, password: str) -> None:
    await page.goto(f"{base}/auth", wait_until="domcontentloaded")
    # Wait for hydration so the submit handler (not a native GET) runs.
    await settle(page)
    for attempt in range(3):
        await page.fill("#email", email)
        await page.fill("#password", password)
        await page.click("button[type=submit]")
        try:
            await page.wait_for_url(re.compile(r"/app/"), timeout=15000, wait_until="commit")
            return
        except Exception:
            if attempt == 2:
                raise
            await page.goto(f"{base}/auth", wait_until="domcontentloaded")
            await settle(page)
            await page.wait_for_timeout(1500)


async def settle(page) -> None:
    try:
        await page.wait_for_load_state("networkidle", timeout=8000)
    except Exception:
        pass
    await page.wait_for_timeout(400)


async def audit_role(browser, base, role, email, password, access, viewports, out, results):
    context = await browser.new_context(viewport={"width": 1366, "height": 768})
    page = await context.new_page()
    try:
        await sign_in(page, base, email, password)
    except Exception as exc:  # noqa: BLE001
        results["failures"].append({"role": role, "check": "sign-in", "detail": str(exc)[:200]})
        await context.close()
        return

    allowed = [p for p, roles in access.items() if role in roles]
    forbidden = [p for p, roles in access.items() if role not in roles]

    # 2. Direct-URL role guards
    for path in access:
        await page.goto(f"{base}{path}", wait_until="domcontentloaded")
        await settle(page)
        final = page.url.replace(base, "").split("?")[0]
        ok = final == path if path in allowed else final != path
        results["checks"] += 1
        if not ok:
            results["failures"].append(
                {"role": role, "check": "guard", "path": path, "landed": final,
                 "expected": "stay" if path in allowed else "redirect"})

    # 3. Sidebar navigation matrix (desktop sidebar)
    await page.set_viewport_size({"width": 1366, "height": 768})
    await page.goto(f"{base}{allowed[0]}", wait_until="domcontentloaded")
    await settle(page)
    hrefs = await page.eval_on_selector_all(
        "aside nav a", "els => els.map(e => new URL(e.href).pathname)")
    results["checks"] += 1
    if sorted(set(hrefs)) != sorted(allowed):
        results["failures"].append(
            {"role": role, "check": "nav", "shown": sorted(set(hrefs)), "expected": sorted(allowed)})

    # 1. Overflow at every viewport for every allowed page
    for name, w, h in viewports:
        await page.set_viewport_size({"width": w, "height": h})
        for path in allowed:
            if role != "admin" and path in ACCOUNT_PAGES:
                continue  # account pages share layout; admin pass covers them
            await page.goto(f"{base}{path}", wait_until="domcontentloaded")
            await settle(page)
            res = await page.evaluate(OVERFLOW_JS)
            results["checks"] += 1
            key = f"{role}:{name}:{path}"
            if res["overflow"] or res["offenders"] or res["clipped"]:
                shot = out / f"{role}_{name}_{path.strip('/').replace('/', '_')}.png"
                await page.screenshot(path=str(shot))
                results["failures"].append(
                    {"role": role, "check": "overflow", "viewport": name, "path": path,
                     "scrollWidth": res["sw"], "viewportWidth": res["vw"],
                     "offenders": res["offenders"], "clipped": res["clipped"],
                     "screenshot": str(shot)})
            else:
                results["passed"].append(key)
            # mobile drawer opens and fits
            if w < 1024 and path == allowed[0]:
                btn = page.get_by_role("button", name="Open navigation")
                if await btn.count():
                    await btn.click()
                    await page.wait_for_timeout(300)
                    drawer = await page.evaluate(OVERFLOW_JS)
                    results["checks"] += 1
                    if drawer["overflow"]:
                        results["failures"].append(
                            {"role": role, "check": "drawer-overflow", "viewport": name})
                    await page.keyboard.press("Escape")
                    close = page.get_by_role("button", name="Close navigation")
                    if await close.count():
                        await close.first.click(force=True)

    for k in forbidden:
        results.setdefault("forbidden", {}).setdefault(role, []).append(k)
    await context.close()


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/tmp/carepriority-qa")
    ap.add_argument("--quick", action="store_true", help="4 representative viewports only")
    ap.add_argument("--roles", default=",".join(ROLES))
    args = ap.parse_args()

    base = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    access = load_route_access()
    viewports = [v for v in VIEWPORTS if not args.quick or v[0] in QUICK_VIEWPORTS]
    results: dict = {"checks": 0, "passed": [], "failures": [], "skipped_roles": []}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for role in args.roles.split(","):
            email = os.environ.get(f"QA_{role.upper()}_EMAIL")
            password = os.environ.get(f"QA_{role.upper()}_PASSWORD")
            if not email or not password:
                results["skipped_roles"].append(role)
                continue
            await audit_role(browser, base, role, email, password, access, viewports, out, results)
        await browser.close()

    (out / "report.json").write_text(json.dumps(results, indent=2))
    print(f"checks={results['checks']} passed_pages={len(results['passed'])} "
          f"failures={len(results['failures'])} skipped_roles={results['skipped_roles']}")
    for f in results["failures"]:
        print("FAIL", json.dumps(f)[:600])
    return 1 if results["failures"] else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
