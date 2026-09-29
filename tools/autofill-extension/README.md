# Job Application Autofill (Chrome extension)

Fills text fields on job application forms — name, email, phone, location, LinkedIn/GitHub/website,
current role — from a profile you save once. Also answers common screening questions and handles
edge cases across major ATS platforms (Greenhouse, Lever, SmartRecruiters, Workday, Ashby, BambooHR).

## What it handles

### Field types
- **Text inputs** — name, email, phone, city, country, state, zip, address, LinkedIn, GitHub, website
- **Native `<select>` dropdowns** — tries exact match, then partial match, then reverse partial
- **Custom comboboxes** (Greenhouse-style search-selects) — types the value, waits for the option list to render, clicks the matching option. Retries with progressive waits for slow/API-backed dropdowns
- **Custom div-based dropdowns** (React Select, Material UI, etc.) — clicks the trigger, finds the option list, clicks the match
- **Radio button groups** — matches the question label, selects the right option
- **Date inputs** — fills `YYYY-MM-DD` format
- **Textareas** — cover letter text, "why this role" summaries
- **Contenteditable elements** — rich text editors for cover letter / application text
- **Checkboxes** — auto-checks privacy/consent/GDPR/terms checkboxes

### Screening questions
- Work authorization ("Are you authorized to work in…")
- Visa sponsorship ("Do you require visa sponsorship?")
- Salary expectation
- Office/relocation willingness
- Years of experience
- Notice period / earliest start date
- "How did you hear about us?"
- Languages spoken
- Willing to travel
- Education level / highest degree

### EEO / demographic questions (auto-declines)
- Gender → "Decline to self-identify" / "Prefer not to say"
- Pronouns → "Prefer not to say"
- Ethnicity → "Decline to self-identify"
- Veteran status → "I don't wish to answer"
- Disability status → "I don't wish to answer"

Each EEO field tries multiple answer variants across ATS platforms.

### Edge cases covered
- Forms embedded in iframes (content script runs in all frames)
- React/Vue-controlled inputs (uses native setter + dispatches input/change/blur events)
- Fields with `data-testid` or `autocomplete` attributes (included in signature matching)
- Group labels via `<fieldset>`, `<legend>`, `role="group"`, or parent container walk-up
- Custom dropdown option selectors: `role="option"`, `class*="option"`, `class*="dropdown" li`, `class*="menu" li`, `class*="suggestion"`
- German-language form labels (Vorname, Nachname, Rufnummer, Gehalt, etc.)

## What it cannot do

- **Attach CV or cover letter files** — no browser extension can programmatically set a file input's value (Chrome security restriction). Drag the PDF onto the upload field manually.
- **Multi-step wizard forms** — fills the visible step; click Next, then click Fill again for the next step.
- **Shadow DOM forms** — content scripts can't reach inside closed shadow roots.
- **CAPTCHA** — human-only.

## Install (load unpacked)

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked** → select this folder (`tools/autofill-extension`)
4. Pin the extension (puzzle-piece icon → pin) for one-click access

## Use

1. Open a job application form
2. Click the extension icon
3. Check/edit the pre-filled profile fields, click **Save profile** (only needed once, or when something changes)
4. Click **Fill this page**
5. **Review every field before submitting** — pattern matching isn't perfect, and some dropdown/autocomplete fields may need manual selection
6. For multi-step forms: fill step 1, click Next, then click **Fill this page** again
7. Attach CV and cover letter PDFs by hand, then submit

## Editing your defaults

`popup.js` has a `DEFAULTS` object pre-filled from your candidate profile — edit it
directly, or change the values in the popup and click **Save profile** (stored in
`chrome.storage.local`, local to your browser only).
