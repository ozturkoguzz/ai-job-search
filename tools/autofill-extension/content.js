// Runs in every frame (manifest sets all_frames: true) so it reaches
// Greenhouse/Lever/Workday forms embedded in an iframe on the parent page.

const PATTERNS = {
  firstName: /first[\s_-]?name|given[\s_-]?name|^fname$|vorname/i,
  lastName: /last[\s_-]?name|family[\s_-]?name|surname|^lname$|nachname/i,
  fullName: /full[\s_-]?name|(?<!user|nick|host|file|domain|display|screen|login|account|company[\s_-]?)name(?![\s_-]?(?:space|server))|your[\s_-]?name/i,
  email: /e-?mail/i,
  phone: /phone|mobile|tel(ephone)?|rufnummer|handy/i,
  city: /\bcity\b|location(?!.*relocat)/i,
  country: /\bcountry\b|land\b|currently[\s_-]?based|where[\s_-]?(are[\s_-]?you[\s_-]?)?based/i,
  state: /\bstate\b|province|bundesland|\bregion\b/i,
  zip: /zip[\s_-]?code|postal[\s_-]?code|postleitzahl|plz\b/i,
  address: /street|address[\s_-]?line|straße|adresse/i,
  linkedin: /linkedin/i,
  github: /github/i,
  website: /website|portfolio|personal[\s_-]?site|homepage/i,
  currentCompany: /current[\s_-]?(company|employer|organisation|organization)/i,
  currentTitle: /current[\s_-]?(title|position|role|job[\s_-]?title)/i,
  coverLetter: /cover[\s_-]?letter|anschreiben|motivation/i,
  summary: /summary|about[\s_-]?you|tell[\s_-]?us[\s_-]?about|introduce[\s_-]?yourself|why[\s_-]?(this|are[\s_-]?you[\s_-]?interested|do[\s_-]?you[\s_-]?want|should[\s_-]?we)|what[\s_-]?motivat|find[\s_-]?(this|the)[\s_-]?(job|role|position)[\s_-]?exciting|why[\s_-]?(exciting|interested|apply)/i,
};

// Common application-question fields.
// type: "combobox"  → custom search-select widget (type text, click option)
// type: "text"      → plain text input
// type: "radio"     → radio button group (match by label)
// type: "select"    → native <select> or custom dropdown
const QUESTIONS = {
  workAuthorized: {
    pattern: /authori(s|z)ed to work|legally (eligible|permitted|allowed) to work|right to work|work (permit|visa|eligib)/i,
    type: "combobox",
  },
  visaSponsorship: {
    pattern: /visa[\s_-]?sponsor|sponsorship|require[\s_-]?sponsor|need[\s_-]?(a[\s_-]?)?sponsor|immigration[\s_-]?sponsor|require[\s_-]?visa|visa[\s_-]?\/[\s_-]?relocation/i,
    type: "combobox",
  },
  euPassportVisa: {
    pattern: /eu[\s_-]?passport|valid[\s_-]?visa|work[\s_-]?permit[\s_-]?for|aufenthaltstitel|arbeitserlaubnis/i,
    type: "select",
  },
  salaryExpectation: {
    pattern: /salary[\s_-]?(expectation|requirement|range|desired)|expected[\s_-]?(salary|compensation)|compensation[\s_-]?expectation|gehalt/i,
    type: "text",
  },
  officeRelocate: {
    pattern: /(willing|open|able|comfortable)[\s_-]?(?:to[\s_-]?)?relocat(?:e|ing)|work(?:ing)?[\s_-]?from[\s_-]?(our|the|an?)[\s_-]?office|work(?:ing)?[\s_-]?on-?site|available[\s_-]?to[\s_-]?work[\s_-]?from/i,
    type: "combobox",
  },
  yearsExperience: {
    pattern: /years?[\s_-]?(of[\s_-]?)?(professional[\s_-]?)?(experience|work)|berufserfahrung|how[\s_-]?(long|many[\s_-]?years)/i,
    type: "text",
  },
  noticePeriod: {
    pattern: /notice[\s_-]?period|kündigungsfrist|earliest[\s_-]?(start|join|available)|start[\s_-]?date|when[\s_-]?can[\s_-]?you[\s_-]?(start|join|begin)|availability/i,
    type: "text",
  },
  availableFrom: {
    pattern: /available[\s_-]?from|verfügbar[\s_-]?ab|frühester[\s_-]?eintrittstermin|start[\s_-]?datum/i,
    type: "text",
  },
  germanProficiency: {
    pattern: /level[\s_-]?(of[\s_-]?)?(language[\s_-]?)?proficiency[\s_-]?in[\s_-]?german|german[\s_-]?(language[\s_-]?)?(proficiency|level|skills|knowledge)|deutsch[\s_-]?(kenntnis|level|sprach)/i,
    type: "select",
  },
  heardAbout: {
    pattern: /how[\s_-]?did[\s_-]?you[\s_-]?(hear|find|learn)|where[\s_-]?did[\s_-]?you[\s_-]?(hear|find|see)|referral[\s_-]?source|source[\s_-]?of[\s_-]?application/i,
    type: "combobox",
  },
  languages: {
    pattern: /language(s)?[\s_-]?(spoken|proficiency|skills)|sprachen|what[\s_-]?languages/i,
    type: "text",
  },
  willingToTravel: {
    pattern: /(willing|open|able)[\s_-]?to[\s_-]?travel|travel[\s_-]?requirement|business[\s_-]?travel|reisebereitschaft/i,
    type: "combobox",
  },
  educationLevel: {
    pattern: /highest[\s_-]?(level[\s_-]?of[\s_-]?)?(education|degree|qualification)|education[\s_-]?level|degree[\s_-]?type/i,
    type: "combobox",
  },
  // EEO / demographic — always "Decline to self-identify" or "Prefer not to say"
  gender: {
    pattern: /\bgender\b|geschlecht|gender[\s_-]?identity/i,
    type: "select",
  },
  pronouns: {
    pattern: /\bpronoun/i,
    type: "select",
  },
  ethnicity: {
    pattern: /race|ethnicity|ethnic[\s_-]?background/i,
    type: "select",
  },
  veteranStatus: {
    pattern: /veteran|military[\s_-]?service/i,
    type: "select",
  },
  disabilityStatus: {
    pattern: /disability|disabled|live[\s_-]?with[\s_-]?any[\s_-]?disability/i,
    type: "select",
  },
  age: {
    pattern: /what[\s_-]?is[\s_-]?your[\s_-]?age|\byour[\s_-]?age\b|\bage[\s_-]?range\b|\bage[\s_-]?group\b/i,
    type: "select",
  },
  parentCaretaker: {
    pattern: /parent|caretaker|caregiver|legal[\s_-]?guardian/i,
    type: "select",
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Traverse shadow DOM to find all form elements, including those inside
// Web Components (SmartRecruiters uses spl-input, spl-dropzone, etc.)
function querySelectorAllDeep(selectors, root = document) {
  const results = Array.from(root.querySelectorAll(selectors));
  root.querySelectorAll("*").forEach((el) => {
    if (el.shadowRoot) {
      results.push(...querySelectorAllDeep(selectors, el.shadowRoot));
    }
  });
  return results;
}

// For shadow DOM inputs, walk up through shadow hosts to find labels
function labelTextForDeep(el) {
  // First try standard label lookup
  const std = labelTextFor(el);
  if (std) return std;
  // For shadow DOM: the host element often has a "label" attribute
  const host = el.getRootNode()?.host;
  if (host) {
    const hostLabel = host.getAttribute("label") || host.getAttribute("aria-label") || "";
    if (hostLabel) return hostLabel;
    // Check sibling/parent label in the host's context
    const hostRoot = host.getRootNode();
    if (hostRoot !== document) {
      // Nested shadow — check host's host
      return labelTextForDeep(host);
    }
    return labelTextFor(host);
  }
  return "";
}

function labelTextFor(el) {
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl) return lbl.textContent || "";
  }
  const parentLabel = el.closest("label");
  if (parentLabel) return parentLabel.textContent || "";
  // Greenhouse/SmartRecruiters often wrap input+label in a shared container
  const container = el.closest("div, li, fieldset, section");
  if (container) {
    const lbl = container.querySelector("label");
    if (lbl) return lbl.textContent || "";
    // Some forms use <legend> or <h3>/<h4> as field group labels
    const legend = container.querySelector("legend, h3, h4, h5, [class*='label' i], [class*='title' i]");
    if (legend) return legend.textContent || "";
  }
  return "";
}

// Walk up from an element to find the question/group label text for radio
// button groups or complex field containers.
function groupLabelFor(el) {
  let node = el.closest("fieldset, [role='group'], [role='radiogroup']");
  if (node) {
    // Check aria-labelledby first
    const labelledBy = node.getAttribute("aria-labelledby");
    if (labelledBy) {
      const lbl = document.getElementById(labelledBy);
      if (lbl) return lbl.textContent || "";
    }
    const legend = node.querySelector("legend");
    if (legend) return legend.textContent || "";
    // For radiogroup/group containers, the radio's own option labels live
    // INSIDE the container — the actual question text is usually a label
    // or span on the PARENT of the container.
    const parent = node.parentElement;
    if (parent) {
      const parentLabel = parent.querySelector(":scope > label, :scope > span, :scope > p, :scope > h3, :scope > h4");
      if (parentLabel && !parentLabel.contains(el) && parentLabel.textContent.trim().length > 3) return parentLabel.textContent || "";
    }
    // Fallback: label inside the group that is NOT wrapping a form control
    const labels = node.querySelectorAll("[class*='label' i], h3, h4, h5");
    for (const lbl of labels) {
      if (!lbl.querySelector("input, select, textarea") && !lbl.closest("label[class*='radio' i], label[class*='Radio' i]")) {
        return lbl.textContent || "";
      }
    }
  }
  // Walk up div containers until we find something with a label-like child
  node = el.parentElement;
  for (let i = 0; i < 8 && node; i++) {
    const lbl = node.querySelector(":scope > label, :scope > legend, :scope > [class*='label' i], :scope > h3, :scope > h4, :scope > span[class*='question' i]");
    if (lbl && !lbl.contains(el) && lbl.textContent.trim().length > 3) return lbl.textContent || "";
    node = node.parentElement;
  }
  return "";
}

function signatureFor(el) {
  return [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label"),
    el.getAttribute("data-testid"),
    el.getAttribute("autocomplete"),
    labelTextForDeep(el),
    // For native <select>, include first option text (often used as placeholder)
    el.tagName === "SELECT" && el.options?.[0]?.textContent?.trim() || "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function matchField(el) {
  const sig = signatureFor(el);
  if (!sig.trim()) return null;
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(sig)) return key;
  }
  return null;
}

function matchQuestion(el) {
  const sig = signatureFor(el);
  const groupSig = groupLabelFor(el);
  const combined = sig + " | " + groupSig;
  if (!combined.trim()) return null;
  for (const [key, meta] of Object.entries(QUESTIONS)) {
    if (meta.pattern.test(combined)) return key;
  }
  return null;
}

// Native setter trick so React/Vue-controlled inputs pick up the change.
// For shadow DOM elements, events need composed:true to cross shadow boundaries.
function setNativeValue(el, value) {
  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  const inShadow = el.getRootNode() !== document;
  el.dispatchEvent(new Event("input", { bubbles: true, composed: inShadow }));
  el.dispatchEvent(new Event("change", { bubbles: true, composed: inShadow }));
  el.dispatchEvent(new Event("blur", { bubbles: true, composed: inShadow }));
}

function fillSelect(el, value) {
  const options = Array.from(el.options);
  // Try exact match first, then case-insensitive match, then partial match
  // Filter out empty placeholder options for partial/reverse matching
  const nonEmpty = options.filter((o) => o.textContent.trim().length > 0);
  const match =
    options.find((o) => o.textContent.trim().toLowerCase() === value.toLowerCase() || o.value.toLowerCase() === value.toLowerCase()) ||
    nonEmpty.find((o) => o.textContent.toLowerCase().includes(value.toLowerCase())) ||
    nonEmpty.find((o) => value.toLowerCase().includes(o.textContent.trim().toLowerCase()));
  if (!match) return false;
  el.value = match.value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

// Try multiple answer variants for a select. Prioritizes exact matches across
// all values before falling back to partial, to avoid short values ("No")
// partial-matching the wrong option before a longer specific value is tried.
function fillSelectMultiAttempt(el, values) {
  const options = Array.from(el.options);
  const nonEmpty = options.filter((o) => o.textContent.trim().length > 0);
  // Pass 1: exact match
  for (const v of values) {
    const vLower = v.toLowerCase();
    const m = options.find((o) => o.textContent.trim().toLowerCase() === vLower || o.value.toLowerCase() === vLower);
    if (m) { el.value = m.value; el.dispatchEvent(new Event("change", { bubbles: true })); el.dispatchEvent(new Event("input", { bubbles: true })); return true; }
  }
  // Pass 2: partial match (option text contains value)
  for (const v of values) {
    const vLower = v.toLowerCase();
    const m = nonEmpty.find((o) => o.textContent.toLowerCase().includes(vLower));
    if (m) { el.value = m.value; el.dispatchEvent(new Event("change", { bubbles: true })); el.dispatchEvent(new Event("input", { bubbles: true })); return true; }
  }
  // Pass 3: reverse partial (value contains option text)
  for (const v of values) {
    const vLower = v.toLowerCase();
    const m = nonEmpty.find((o) => vLower.includes(o.textContent.trim().toLowerCase()));
    if (m) { el.value = m.value; el.dispatchEvent(new Event("change", { bubbles: true })); el.dispatchEvent(new Event("input", { bubbles: true })); return true; }
  }
  return false;
}

// Custom search-select widgets (Greenhouse's "Are you authorised..." style
// questions): typing opens a listbox of options rendered elsewhere in the
// DOM. Type the value, wait for it to render, click the matching option;
// fall back to Enter (accepts the first/highlighted suggestion) if no
// option element is found.
async function fillCombobox(el, value, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    el.focus();
    el.click();
    // Clear existing value first
    setNativeValue(el, "");
    await sleep(100);
    // Set the value using native setter
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    // Dispatch both regular Event and InputEvent — React Select listens for Event,
    // Radix/cmdk listens for InputEvent with inputType
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: value.slice(-1) }));
    // Progressively longer waits for slow-rendering dropdowns / API-backed search
    await sleep(350 + attempt * 200);

    const candidates = querySelectorAllDeep('[role="option"], [role="listbox"] > *, [class*="option" i], [class*="dropdown" i] li, [class*="menu" i] li, [class*="suggestion" i], [cmdk-item]')
    .filter((o) => o.offsetParent !== null && o.textContent.trim().length > 0);

    const exact = candidates.find((o) => o.textContent.trim().toLowerCase() === value.toLowerCase());
    const partial = candidates.find((o) => o.textContent.trim().toLowerCase().includes(value.toLowerCase()));
    const reversePartial = candidates.find((o) => value.toLowerCase().includes(o.textContent.trim().toLowerCase()));
    const match = exact || partial || reversePartial;
    if (match) {
      match.scrollIntoView({ block: "nearest" });
      match.click();
      await sleep(150);
      // If click didn't close dropdown (cmdk/Radix), use keyboard selection
      if (el.getAttribute("aria-expanded") === "true") {
        el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown", code: "ArrowDown", keyCode: 40 }));
        await sleep(50);
        el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", code: "Enter", keyCode: 13 }));
        await sleep(150);
      }
      return true;
    }

    // If a listbox is visible with items but none matched our selectors,
    // try keyboard navigation (ArrowDown + Enter)
    const listbox = document.querySelector('[role="listbox"]');
    if (listbox && listbox.children.length > 0) {
      el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown", code: "ArrowDown", keyCode: 40 }));
      await sleep(50);
      el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", code: "Enter", keyCode: 13 }));
      await sleep(150);
      if (el.getAttribute("aria-expanded") !== "true") return true;
    }

    if (attempt === retries) {
      // Last resort: press Enter to accept highlighted suggestion
      el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", code: "Enter", keyCode: 13 }));
      await sleep(150);
      return false;
    }
  }
  return false;
}

// Try multiple value variants for combobox (e.g. "Yes" then "Ja")
async function fillComboboxMultiAttempt(el, values) {
  for (const v of values) {
    if (await fillCombobox(el, v, 1)) return true;
  }
  return false;
}

// Custom div-based dropdown (React Select, Material UI, etc.)
// These render a clickable div that opens a list of options.
async function fillCustomDropdown(container, value) {
  // Find the clickable trigger element
  const trigger =
    container.querySelector('[class*="control" i], [class*="select" i]:not(select), [class*="trigger" i], [role="combobox"], [class*="indicator" i]') ||
    container;
  trigger.click();
  await sleep(300);

  // Look for the option list that appeared
  const optionSelectors = [
    '[role="option"]',
    '[class*="option" i]',
    '[class*="menu" i] div[id]',
    '[class*="listbox" i] > *',
    'li[class*="item" i]',
  ];
  let candidates = [];
  for (const sel of optionSelectors) {
    candidates = Array.from(document.querySelectorAll(sel)).filter(
      (o) => o.offsetParent !== null && o.textContent.trim().length > 0
    );
    if (candidates.length > 0) break;
  }

  const exact = candidates.find((o) => o.textContent.trim().toLowerCase() === value.toLowerCase());
  const partial = candidates.find((o) => o.textContent.trim().toLowerCase().includes(value.toLowerCase()));
  const match = exact || partial;
  if (match) {
    match.scrollIntoView({ block: "nearest" });
    match.click();
    await sleep(100);
    return true;
  }
  // Close the dropdown if we couldn't find a match
  document.body.click();
  return false;
}

function fillCheckboxConsent(el) {
  const sig = signatureFor(el).toLowerCase();
  // Also check the wider container text (Greenhouse puts "Please review our Privacy Notice"
  // in a sibling/parent element, not the checkbox label itself which just says "Confirm")
  // Walk up multiple levels to find privacy-related text — Greenhouse nests the
  // checkbox inside div.checkbox__input > div.checkbox__wrapper > fieldset.checkbox
  // and the "Please review our Privacy Notice" text sits on the fieldset, not the div.
  const containerText = (
    el.closest("fieldset")?.textContent ||
    el.closest("[class*='field' i]")?.textContent ||
    el.closest("div")?.parentElement?.textContent ||
    ""
  ).toLowerCase();
  const combined = sig + " | " + containerText;
  if (!/privacy|consent|gdpr|agree|terms|acknowledge|data[\s_-]?process|confirm.*review|review.*privacy/i.test(combined)) return false;
  if (el.checked) return false;
  el.click(); // native click toggles + fires the framework's own handlers
  return true;
}

// Fill a radio button group. Finds radios in same group (name) and picks
// the one whose label matches the desired value.
function fillRadioGroup(el, value) {
  const name = el.name;
  if (!name) return false;
  const radios = querySelectorAllDeep(`input[type="radio"][name="${CSS.escape(name)}"]`);
  if (radios.some((r) => r.checked)) return false; // already answered

  const values = Array.isArray(value) ? value : [value];
  for (const v of values) {
    const vLower = v.toLowerCase();
    for (const radio of radios) {
      const radioLabel = (labelTextFor(radio) || radio.value || "").toLowerCase().trim();
      if (radioLabel === vLower || radioLabel.includes(vLower) || vLower.includes(radioLabel)) {
        radio.click();
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
  }
  return false;
}

// Date input handling — sets value in YYYY-MM-DD format
function fillDateInput(el, value) {
  if (el.value) return false;
  // Try to parse common date formats and normalize to YYYY-MM-DD
  const normalized = value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2");
  setNativeValue(el, normalized);
  return true;
}

// Fill contenteditable elements (rich text editors)
function fillContentEditable(el, value) {
  if (el.textContent.trim()) return false;
  el.focus();
  el.innerHTML = value.replace(/\n/g, "<br>");
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
  return true;
}

// Mapping from question keys to fallback answer variants (for selects/radios
// that may label the same answer differently across ATS platforms)
const ANSWER_VARIANTS = {
  gender: ["Prefer not to disclose", "Decline to self-identify", "Prefer not to say", "Decline", "I don't wish to answer", "Not specified", "Rather not say"],
  pronouns: ["Prefer not to say", "Prefer not to disclose", "They/them", "Decline to self-identify", "Not specified"],
  ethnicity: ["Decline to self-identify", "Prefer not to say", "Prefer not to disclose", "I don't wish to answer", "Two or more races", "Decline"],
  veteranStatus: ["I am not a protected veteran", "I don't wish to answer", "Prefer not to disclose", "Decline to self-identify", "Prefer not to say", "No"],
  disabilityStatus: ["Prefer not to disclose", "I don't wish to answer", "Prefer not to answer", "Decline to self-identify", "No, I don't have a disability", "Prefer not to say"],
  heardAbout: ["LinkedIn", "Job board", "Online search", "Internet", "Other"],
  educationLevel: ["Bachelor's degree", "Bachelor", "Bachelors", "BA", "BS", "Undergraduate"],
  willingToTravel: ["Yes", "Ja"],
  workAuthorized: ["No", "Nein", "No, I need visa support"],
  visaSponsorship: ["Yes", "Ja", "Yes, I need visa sponsorship", "Yes, I require sponsorship"],
  euPassportVisa: ["No", "Nein", "No, I need visa support", "No, I don't have an EU passport"],
  noticePeriod: ["None", "Immediately", "Less than 2 weeks", "Available immediately"],
  availableFrom: ["01.11.2026"],
  germanProficiency: ["Beginner", "A1", "A2", "Basic", "Grundkenntnisse", "Anfänger"],
  officeRelocate: ["Yes", "Ja"],
  age: ["Prefer not to disclose", "Prefer not to say", "Decline to self-identify", "I don't wish to answer"],
  parentCaretaker: ["Prefer not to disclose", "Prefer not to say", "Decline to self-identify", "I don't wish to answer", "No"],
};

// Fields that should overwrite browser-autofilled values when our profile
// has a value — browser autofill often fills wrong city/state from old addresses.
const OVERWRITE_KEYS = new Set(["city", "country", "state", "zip", "fullName"]);

function isEmpty(el) {
  return !el.value || !el.value.trim();
}

async function autofill(profile, overwrite = false) {
  let filled = 0;
  const elements = querySelectorAllDeep("input, select, textarea");

  // Track radio groups we've already processed
  const processedRadioGroups = new Set();

  for (const el of elements) {
    if (el.type === "file" || el.type === "hidden" || el.type === "submit" || el.type === "button" || el.disabled || el.readOnly) continue;

    // --- Checkboxes ---
    if (el.type === "checkbox") {
      if (fillCheckboxConsent(el)) filled++;
      continue;
    }

    // --- Radio buttons ---
    if (el.type === "radio") {
      if (el.name && processedRadioGroups.has(el.name)) continue;
      if (el.name) processedRadioGroups.add(el.name);

      const qKey = matchQuestion(el);
      if (qKey) {
        const value = profile[qKey] || ANSWER_VARIANTS[qKey];
        if (value) {
          const variants = Array.isArray(value) ? value : (ANSWER_VARIANTS[qKey] ? [value, ...ANSWER_VARIANTS[qKey]] : [value]);
          if (fillRadioGroup(el, variants)) filled++;
        }
      }
      continue;
    }

    // --- Date inputs ---
    if (el.type === "date") {
      const qKey = matchQuestion(el);
      if (qKey && profile[qKey]) {
        if (fillDateInput(el, profile[qKey])) filled++;
      }
      continue;
    }

    // --- Standard field matching (name, email, phone, etc.) ---
    const key = matchField(el);
    if (key && (profile[key] || (key === "fullName" && (profile.firstName || profile.lastName)))) {
      if (el.tagName === "SELECT") {
        if (fillSelect(el, profile[key])) filled++;
      } else if (el.tagName === "TEXTAREA") {
        if (isEmpty(el) || (overwrite && OVERWRITE_KEYS.has(key))) {
          setNativeValue(el, profile[key]);
          filled++;
        }
      } else if (el.getAttribute("role") === "combobox" || el.getAttribute("aria-expanded") !== null) {
        // React Select / custom combobox for Country, Location, etc.
        if (isEmpty(el) || (overwrite && OVERWRITE_KEYS.has(key))) {
          const val = key === "fullName"
            ? (profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim())
            : profile[key];
          if (await fillCombobox(el, val)) filled++;
        }
      } else if (isEmpty(el) || (overwrite && OVERWRITE_KEYS.has(key))) {
        // Handle fullName = firstName + lastName
        if (key === "fullName") {
          setNativeValue(el, profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim());
        } else {
          setNativeValue(el, profile[key]);
        }
        filled++;
      }
      continue;
    }

    // --- Question matching ---
    const qKey = matchQuestion(el);
    if (qKey) {
      const value = profile[qKey];
      const variants = ANSWER_VARIANTS[qKey];
      const attempts = [];
      if (value) attempts.push(value);
      if (variants) attempts.push(...variants);
      if (attempts.length === 0) continue;

      // Detect actual element type at runtime (don't rely on hardcoded config)
      const isNativeSelect = el.tagName === "SELECT";
      const isCombo = el.getAttribute("role") === "combobox" || el.getAttribute("aria-expanded") !== null;

      // Sort attempts: longer (more specific) values first for better matching
      attempts.sort((a, b) => b.length - a.length);

      if (isNativeSelect) {
        if (fillSelectMultiAttempt(el, attempts)) filled++;
      } else if (isCombo) {
        if (isEmpty(el)) {
          if (await fillComboboxMultiAttempt(el, attempts)) filled++;
        }
      } else if (isEmpty(el)) {
        // Plain text input — use first available value
        setNativeValue(el, attempts[0]);
        filled++;
      }
    }
  }

  // --- Contenteditable elements (rich text editors for cover letter etc.) ---
  const editables = querySelectorAllDeep('[contenteditable="true"]');
  for (const el of editables) {
    const sig = signatureFor(el) + " | " + groupLabelFor(el);
    for (const [key, pattern] of Object.entries(PATTERNS)) {
      if (pattern.test(sig) && profile[key]) {
        if (fillContentEditable(el, profile[key])) filled++;
        break;
      }
    }
  }

  // --- Custom div-based dropdowns (React Select, Lever, Workable, etc.) ---
  // Look for elements with dropdown/listbox roles, or common dropdown class patterns
  const customDropdowns = Array.from(
    document.querySelectorAll(
      '[class*="react-select" i], [class*="css-"][class*="container" i], ' +
      '[class*="select-wrapper" i], [class*="custom-select" i], ' +
      '[class*="dropdown" i][class*="select" i], ' +
      '[role="listbox"], [role="combobox"]:not(input), ' +
      '[class*="select"][class*="field" i], [class*="select"][class*="group" i]'
    )
  ).filter((el) => {
    // Only process if it doesn't contain a native select that was already handled
    // and is visible on page
    return !el.querySelector("select") && el.offsetParent !== null;
  });

  for (const container of customDropdowns) {
    const sig = signatureFor(container) + " | " + groupLabelFor(container) + " | " + (container.textContent || "").slice(0, 200);
    for (const [qKey, meta] of Object.entries(QUESTIONS)) {
      if (meta.pattern.test(sig)) {
        const value = profile[qKey];
        const variants = ANSWER_VARIANTS[qKey];
        const attempts = [];
        if (value) attempts.push(value);
        if (variants) attempts.push(...variants);
        for (const v of attempts) {
          if (await fillCustomDropdown(container, v)) {
            filled++;
            break;
          }
        }
        break;
      }
    }
    for (const [key, pattern] of Object.entries(PATTERNS)) {
      if (pattern.test(sig) && profile[key]) {
        if (await fillCustomDropdown(container, profile[key])) {
          filled++;
          break;
        }
      }
    }
  }

  return filled;
}

// --- AI-powered form fill: extract fields for Gemini, then fill from AI response ---

// Stored references to extracted elements so AI fill can target them by index
let _extractedFields = [];

function extractFormFields() {
  _extractedFields = [];
  const processedRadioGroups = new Set();
  const elements = querySelectorAllDeep("input, select, textarea");
  const fields = [];

  for (const el of elements) {
    if (el.type === "file" || el.type === "hidden" || el.type === "submit" || el.type === "button" || el.disabled || el.readOnly) continue;

    if (el.type === "radio") {
      if (el.name && processedRadioGroups.has(el.name)) continue;
      if (el.name) processedRadioGroups.add(el.name);
      const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`));
      const options = radios.map((r) => ({ value: r.value, label: (labelTextFor(r) || r.value).trim() }));
      const questionLabel = groupLabelFor(el) || labelTextFor(el) || "";
      _extractedFields.push({ type: "radio", name: el.name });
      fields.push({ index: fields.length, type: "radio", label: questionLabel.trim().slice(0, 200), options });
      continue;
    }

    if (el.type === "checkbox") {
      const context = (
        el.closest("fieldset")?.textContent || el.closest("[class*='field' i]")?.textContent ||
        el.closest("div")?.parentElement?.textContent || ""
      ).trim().slice(0, 200);
      _extractedFields.push({ type: "checkbox", el });
      fields.push({ index: fields.length, type: "checkbox", label: (labelTextFor(el) || "").trim(), context, checked: el.checked });
      continue;
    }

    const label = (labelTextForDeep(el) || groupLabelFor(el) || "").trim();
    const field = {
      index: fields.length,
      type: el.getAttribute("role") === "combobox" ? "combobox" : (el.type || el.tagName.toLowerCase()),
      label: label.slice(0, 200),
    };
    if (el.placeholder) field.placeholder = el.placeholder;
    if (el.getAttribute("aria-label")) field.ariaLabel = el.getAttribute("aria-label");
    if (el.value) field.currentValue = el.value.slice(0, 100);
    if (el.tagName === "SELECT") {
      field.options = Array.from(el.options).filter((o) => o.textContent.trim()).map((o) => o.textContent.trim());
    }
    _extractedFields.push({ type: field.type, el, tag: el.tagName });
    fields.push(field);
  }

  // Also extract contenteditable elements (rich text editors, custom textareas)
  const editables = querySelectorAllDeep('[contenteditable="true"]');
  const seenEditables = new Set();
  for (const el of editables) {
    // Skip tiny or hidden elements, and dedup
    if (el.offsetParent === null && !el.closest('[style*="position: fixed"]')) continue;
    if (seenEditables.has(el)) continue;
    seenEditables.add(el);
    // Skip if already captured as a regular textarea/input
    if (_extractedFields.some(f => f.el === el)) continue;

    const label = (labelTextForDeep(el) || groupLabelFor(el) || "").trim();
    const content = (el.textContent || "").trim();
    const field = {
      index: fields.length,
      type: "contenteditable",
      label: label.slice(0, 300),
    };
    if (content) field.currentValue = content.slice(0, 100);
    if (el.getAttribute("aria-label")) field.ariaLabel = el.getAttribute("aria-label");
    if (el.getAttribute("placeholder") || el.dataset.placeholder) {
      field.placeholder = (el.getAttribute("placeholder") || el.dataset.placeholder);
    }
    _extractedFields.push({ type: "contenteditable", el, tag: "CONTENTEDITABLE" });
    fields.push(field);
  }

  return fields;
}

async function aiAutofill(mappings) {
  let filled = 0;
  for (const [idxStr, value] of Object.entries(mappings)) {
    const field = _extractedFields[parseInt(idxStr)];
    if (!field || !value || value === "skip") continue;

    if (field.type === "radio") {
      const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`));
      // Match by value attribute or by label text
      const target = radios.find((r) => r.value === value) ||
        radios.find((r) => (labelTextFor(r) || "").toLowerCase().trim() === value.toLowerCase());
      if (target && !target.checked) {
        target.click();
        target.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      }
    } else if (field.type === "checkbox") {
      if (value === "check" && !field.el.checked) { field.el.click(); filled++; }
    } else if (field.tag === "SELECT") {
      if (fillSelect(field.el, value)) filled++;
    } else if (field.type === "combobox" || field.el.getAttribute("role") === "combobox" || field.el.getAttribute("aria-expanded") !== null) {
      if (await fillCombobox(field.el, value)) filled++;
    } else if (field.tag === "CONTENTEDITABLE") {
      if (fillContentEditable(field.el, value)) filled++;
    } else if (field.tag === "TEXTAREA") {
      setNativeValue(field.el, value);
      filled++;
    } else {
      setNativeValue(field.el, value);
      filled++;
    }
  }
  return filled;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "AUTOFILL") {
    autofill(msg.profile, msg.overwrite).then((filled) => sendResponse({ filled }));
    return true;
  }
  if (msg.type === "EXTRACT_FORM") {
    sendResponse({ fields: extractFormFields() });
    return false;
  }
  if (msg.type === "AUTOFILL_AI") {
    aiAutofill(msg.mappings).then((filled) => sendResponse({ filled }));
    return true;
  }
  return true;
});
