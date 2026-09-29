const FIELDS = [
  "firstName", "lastName", "email", "phone",
  "city", "country", "state", "zip", "address",
  "linkedin", "github", "website",
  "currentCompany", "currentTitle",
  "workAuthorized", "visaSponsorship", "salaryExpectation", "officeRelocate",
  "yearsExperience", "noticePeriod", "availableFrom", "heardAbout", "languages",
  "germanProficiency", "willingToTravel", "educationLevel",
  "coverLetter", "summary",
];

const DEFAULTS = {
  firstName: "Oguzhan",
  lastName: "Ozturk",
  email: "ozturkoguzhan95@gmail.com",
  phone: "+49 178 356 4204",
  city: "Berlin",
  country: "Germany",
  state: "Berlin",
  zip: "",
  address: "",
  linkedin: "https://linkedin.com/in/oguzozturkk",
  github: "https://github.com/ozturkoguzz",
  website: "https://oguzhanozturk.dev",
  currentCompany: "",
  currentTitle: "Senior Data Engineer",
  workAuthorized: "No",
  visaSponsorship: "Yes",
  salaryExpectation: "75000",
  officeRelocate: "Yes",
  yearsExperience: "8",
  noticePeriod: "Immediately available",
  availableFrom: "01.11.2026",
  germanProficiency: "Beginner",
  heardAbout: "LinkedIn",
  languages: "English (Fluent), Turkish (Native), German (Basic)",
  willingToTravel: "Yes",
  educationLevel: "Bachelor's degree",
  coverLetter: "",
  summary: "I am excited about the opportunity to bring my 6+ years of data engineering experience across fintech, mobility, and telecom into a team where I can grow technically and contribute to building scalable, impactful data systems.",
};

function status(text) {
  document.getElementById("status").textContent = text;
}

function getProfile() {
  const profile = {};
  FIELDS.forEach((f) => {
    const el = document.getElementById(f);
    if (el) profile[f] = el.value;
  });
  return profile;
}

function load() {
  chrome.storage.local.get(["profile", "geminiKey", "geminiModel", "geminiEndpoint"], (data) => {
    const profile = data.profile || DEFAULTS;
    FIELDS.forEach((f) => {
      const el = document.getElementById(f);
      if (el) el.value = profile[f] || "";
    });
    if (data.geminiKey) document.getElementById("geminiKey").value = data.geminiKey;
    if (data.geminiModel) document.getElementById("geminiModel").value = data.geminiModel;
    if (data.geminiEndpoint) document.getElementById("geminiEndpoint").value = data.geminiEndpoint;
  });
}

function save() {
  const profile = getProfile();
  const geminiKey = document.getElementById("geminiKey").value.trim();
  const geminiModel = document.getElementById("geminiModel").value;
  const geminiEndpoint = document.getElementById("geminiEndpoint").value;
  chrome.storage.local.set({ profile, geminiKey, geminiModel, geminiEndpoint }, () => {
    status("Saved.");
    setTimeout(() => status(""), 1500);
  });
}

function fill() {
  save();
  const profile = getProfile();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
      const targets = frames && frames.length ? frames : [{ frameId: 0 }];
      let total = 0;
      let pending = targets.length;
      targets.forEach((frame) => {
        const overwrite = document.getElementById("overwrite")?.checked || false;
        chrome.tabs.sendMessage(tabId, { type: "AUTOFILL", profile, overwrite }, { frameId: frame.frameId }, (response) => {
          void chrome.runtime.lastError;
          if (response && response.filled) total += response.filled;
          pending--;
          if (pending === 0) {
            status(`Filled ${total} field${total === 1 ? "" : "s"}.`);
          }
        });
      });
    });
  });
}

// --- AI Fill: extract form → Gemini API → fill fields ---

function buildPrompt(profile, fields) {
  const profileStr = Object.entries(profile)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  const fieldsStr = JSON.stringify(
    fields.map((f) => {
      const d = { index: f.index, label: f.label || f.ariaLabel || f.placeholder || "" };
      if (f.type) d.type = f.type;
      if (f.options) d.options = f.options;
      if (f.placeholder) d.placeholder = f.placeholder;
      if (f.currentValue) d.filled = f.currentValue;
      if (f.checked !== undefined) d.checked = f.checked;
      if (f.context) d.context = f.context;
      return d;
    }),
    null,
    2
  );

  return `You fill job application forms. Given the candidate profile and form fields, return a JSON object mapping each field index (as string) to the value to fill.

CANDIDATE PROFILE:
${profileStr}

EXTRA CONTEXT:
- Candidate has a valid work permit in Germany (not tied to an employer)
- For demographic/EEO questions (gender, age, disability, veteran, ethnicity, parent/caretaker): select "Prefer not to disclose" or "Decline to self-identify" — whichever option exists
- For consent/privacy/terms checkboxes: return "check"
- For "how did you hear" questions: select "LinkedIn"
- Candidate full name: ${profile.firstName || ""} ${profile.lastName || ""}

FORM FIELDS:
${fieldsStr}

RULES:
- For SELECT fields, return the EXACT text of one of the listed options
- For RADIO groups, return the exact "value" attribute string (e.g. "true" or "false")
- For CHECKBOX: "check" to check, "skip" to leave unchecked
- For COMBOBOX (search-select): return the text to search/type
- For TEXT/TEL/EMAIL: return the text value
- Omit fields you cannot determine or that are already correctly filled
- Return ONLY valid JSON, no explanation`;
}

async function callGemini(apiKey, model, prompt) {
  const endpoint = document.getElementById("geminiEndpoint").value;
  let url;
  if (endpoint === "vertex") {
    // Vertex AI Express Mode — uses v1beta1 + different path
    url = `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${model}:generateContent?key=${apiKey}`;
  } else {
    // AI Studio — standard path
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text);
}

async function aiFill() {
  const profile = getProfile();
  const apiKey = document.getElementById("geminiKey").value.trim();
  const model = document.getElementById("geminiModel").value;
  if (!apiKey) { status("Enter Gemini API key first."); return; }
  chrome.storage.local.set({ geminiKey: apiKey, geminiModel: model });

  const btn = document.getElementById("aiFill");
  btn.disabled = true;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0].id;
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const targets = frames?.length ? frames : [{ frameId: 0 }];

    // Step 1: Run pattern fill first to handle known fields
    status("Pattern filling known fields...");
    const overwrite = document.getElementById("overwrite")?.checked || false;
    for (const frame of targets) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: "AUTOFILL", profile, overwrite }, { frameId: frame.frameId });
      } catch (e) { void chrome.runtime.lastError; }
    }

    // Brief pause for DOM to settle after pattern fill
    await new Promise(r => setTimeout(r, 300));

    // Step 2: Re-extract fields — only send EMPTY ones to AI
    let bestFields = [];
    let bestFrameId = 0;
    for (const frame of targets) {
      try {
        const resp = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_FORM" }, { frameId: frame.frameId });
        if (resp?.fields?.length > bestFields.length) {
          bestFields = resp.fields;
          bestFrameId = frame.frameId;
        }
      } catch (e) { void chrome.runtime.lastError; }
    }

    // Filter to only unfilled fields (keep index mapping intact for content.js)
    const emptyFields = bestFields.filter(f => {
      if (f.type === "checkbox") return !f.checked;
      if (f.type === "radio") return true; // radio groups need checking by content script
      if (f.type === "contenteditable") return !f.currentValue || !f.currentValue.trim();
      return !f.currentValue || !f.currentValue.trim();
    });

    if (emptyFields.length === 0) { status("All fields already filled!"); return; }
    status(`${bestFields.length - emptyFields.length} filled by patterns, ${emptyFields.length} remaining → Gemini ${model}...`);

    // Step 3: Send only empty fields to Gemini
    const prompt = buildPrompt(profile, emptyFields);
    const aiMappings = await callGemini(apiKey, model, prompt);

    // Remap AI response indices back to original field indices
    // Gemini returns keys matching the `index` property we sent, not array positions
    const mappings = {};
    for (const [aiIdx, value] of Object.entries(aiMappings)) {
      const idx = parseInt(aiIdx);
      // Find the field whose `index` property matches what Gemini returned
      const originalField = emptyFields.find(f => f.index === idx);
      if (originalField) mappings[String(originalField.index)] = value;
    }

    const mappedCount = Object.keys(mappings).length;
    status(`Gemini mapped ${mappedCount} custom fields → filling...`);

    // Step 4: Apply AI values only to empty fields
    const resp = await chrome.tabs.sendMessage(tabId, { type: "AUTOFILL_AI", mappings }, { frameId: bestFrameId });
    status(`Done: patterns + AI filled ${resp?.filled || 0} custom fields.`);
  } catch (err) {
    status(`Error: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("fill").addEventListener("click", fill);
document.getElementById("aiFill").addEventListener("click", aiFill);
load();
