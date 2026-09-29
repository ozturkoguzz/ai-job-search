const FIELDS = [
  "firstName", "lastName", "email", "phone",
  "city", "country", "state", "zip", "address",
  "linkedin", "github", "website",
  "currentCompany", "currentTitle",
  "workAuthorized", "visaSponsorship", "salaryExpectation", "officeRelocate",
  "yearsExperience", "noticePeriod", "availableFrom", "heardAbout", "languages",
  "germanProficiency", "willingToTravel", "educationLevel",
  "coverLetter", "summary", "resumeContext",
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
  currentCompany: "Garanti BBVA Teknoloji",
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
  coverLetter: `I am a Senior Data Engineer at Garanti Teknoloji (Garanti BBVA), where I own production data pipelines across 10+ domains and recently built an AI-powered metric discovery platform using LLM reasoning over vector-embedded metadata — turning manual schema lookup into a self-serve capability for hundreds of internal users. With over 5 years of experience building data infrastructure across financial services, mobility, telecom, and real estate in Turkey, Germany, and the Netherlands, I bring deep expertise in Airflow, dbt, PySpark, Databricks, Kafka, Flink, and increasingly AI-augmented engineering tooling.

At FREENOW in Hamburg, I engineered real-time streaming pipelines processing 500K+ events/sec across 27 European cities, led a Data Mesh migration reducing cross-team dependencies by 40%, and implemented DataOps frameworks that cut data incidents by 65%. I actively build with Claude Code and LLM-driven workflows daily — from automated job search pipelines to intelligent form-filling browser extensions — and bring a practical, shipping-oriented approach to applying AI in data engineering contexts.

I am looking to take the next step in my career within a technically ambitious, international environment where I can combine my data platform expertise with my growing AI engineering skills to build intelligent, scalable systems. I would welcome the opportunity to discuss how my background aligns with your team's goals.`,
  summary: "I am excited about the opportunity to bring my 6+ years of data engineering experience across fintech, mobility, and telecom into a team where I can grow technically and contribute to building scalable, impactful data systems.",
  resumeContext: `SENIOR DATA ENGINEER | 6+ years | Python, SQL, PySpark, Spark, Databricks, Kafka, Flink, Airflow, dbt

GARANTI BBVA TEKNOLOJI (Jan 2024–Present) — Ankara, Turkey
- Own financial reporting pipelines serving BBVA group across 10+ regulatory domains (TCMB, BDDK, ECB)
- Built AI-powered metric discovery platform using LLM reasoning over vector-embedded table metadata
- Automated PCAF/PACTA sustainability reporting pipelines from scratch — loan portfolio carbon assessment
- Led PySpark ETL proof-of-concept, producing migration roadmap from legacy Oracle to Spark
- Enterprise data modeling in SAP Power Designer — Data Vault and dimensional models
- Reduced data quality incidents ~70% with automated DQ rules and SLA monitoring

FREENOW (Jan 2022–Jan 2024) — Hamburg, Germany
- Real-time dynamic pricing pipeline: 500K+ events/sec, Kafka + Flink, sub-100ms latency, 27 EU cities
- Led Data Mesh migration — reduced cross-team dependencies by 40%
- DataOps framework (Great Expectations, dbt) across 50+ pipelines — incidents down 65%
- Built ELT pipelines on Databricks/PySpark (AWS) replacing 6 third-party connectors — saving $70K/year
- Geospatial analytics platform with OpenStreetMap for ML demand forecasting across 27 cities

HUAWEI (Jan 2021–Jan 2022) — Istanbul, Turkey
- Big Data solutions for AppGallery (50M+ MAU) — ML-based data quality and anomaly detection
- Rewrote HiveQL pipeline to Spark: 8h → 1h runtime (87.5% improvement)

INTRAVA (Jun 2020–Nov 2020) — Amsterdam, Netherlands (Contract)
- ETL on Azure for 10TB+ real estate datasets — 3x query performance

EDUCATION: B.Sc. EEE — Izmir Institute of Technology (2015-2020)
Thesis: Self-driving car perception in CARLA simulator — dynamic object detection

TECH: Python, SQL, PySpark, Spark, Databricks, Kafka, Flink, Airflow, dbt, AWS (S3/Redshift), Azure (Data Factory), Docker, CI/CD, SAP Power Designer, Great Expectations, GenAI/LLM, RAG, Claude Code
DOMAINS: Financial services, mobility/transportation, telecom, real estate
LANGUAGES: Turkish (Native), English (C1), German (A2)`,
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
  chrome.storage.local.get(["profile", "geminiKey"], (data) => {
    const profile = { ...DEFAULTS, ...(data.profile || {}) };
    FIELDS.forEach((f) => {
      const el = document.getElementById(f);
      if (el) el.value = profile[f] || DEFAULTS[f] || "";
    });
    if (data.geminiKey) document.getElementById("geminiKey").value = data.geminiKey;
  });
}

function save() {
  const profile = getProfile();
  const geminiKey = document.getElementById("geminiKey").value.trim();
  chrome.storage.local.set({ profile, geminiKey }, () => {
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

  const resumeContext = profile.resumeContext || "";

  return `You fill job application forms. Given the candidate profile, resume, and form fields, return a JSON object mapping each field index (as string) to the value to fill.

CANDIDATE PROFILE:
${profileStr}

RESUME / EXPERIENCE:
${resumeContext}

EXTRA CONTEXT:
- Candidate needs visa sponsorship for EU/UK/UAE — does NOT currently have work authorization outside Turkey
- For demographic/EEO questions (gender, age, disability, veteran, ethnicity, parent/caretaker): select "Prefer not to disclose" or "Decline to self-identify" — whichever option exists
- For consent/privacy/terms checkboxes: return "check"
- For "how did you hear" questions: select "LinkedIn"
- Candidate full name: ${profile.firstName || ""} ${profile.lastName || ""}
- When answering custom questions about experience, projects, or skills: use ONLY facts from the resume above. Never fabricate projects, metrics, or technologies not listed. Keep answers concise (2-4 sentences) and specific.

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

async function callGemini(apiKey, prompt) {
  const model = "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
  if (!apiKey) { status("Enter Gemini API key first."); return; }
  chrome.storage.local.set({ geminiKey: apiKey });

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
    status(`${bestFields.length - emptyFields.length} filled by patterns, ${emptyFields.length} remaining → Gemini 2.5 Flash Lite...`);

    // Step 3: Send only empty fields to Gemini
    const prompt = buildPrompt(profile, emptyFields);
    const aiMappings = await callGemini(apiKey, prompt);

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
