const smallBookletText = [
  "Chapter 1: A company is running thousands of AI conversations every hour. Each support answer repeats policy language, product context, customer intent, and routing instructions. The old path keeps paying for the same meaning again and again.",
  "Chapter 2: The compression proof separates stable meaning from unstable wording. Names, numbers, negation, causality, quote attribution, and route lineage stay visible to the audit layer. Anything risky becomes residual support instead of being forced into a false one-token claim.",
  "Chapter 3: The public lab is intentionally conservative. It estimates BPE-style token load, folds stable meaning into root handles, counts residual tokens against the ratio, and marks the output as a public estimate. Private audits replace estimates with workload-specific reports.",
  "Chapter 4: A buyer does not need a speech about magic. A buyer needs to know how many tokens they send today, how many equivalent 16xVS tokens remain after folding, how often residual support is needed, and what the monthly cost gap looks like.",
  "Chapter 5: The business path is simple. Public demo creates attention. Company audit creates trust. Private pilot creates revenue. Infrastructure follows only after the evidence survives pressure.",
].join("\n\n").repeat(5);
const examples = [
  {
    label: "Short phrase",
    text: "Book a solar consultation for tomorrow afternoon.",
  },
  {
    label: "Support request",
    text: "My order arrived damaged and I need a replacement before Friday. Please check the shipping photos and send the safest next step.",
  },
  {
    label: "Quote",
    text: "The future belongs to those who can reduce complexity without losing meaning.",
  },
  {
    label: "Long quote",
    text: "Any sufficiently advanced technology is indistinguishable from magic, but any truly useful infrastructure eventually disappears into the background.",
  },
  {
    label: "Mini booklet",
    text: smallBookletText,
  },
  {
    label: "Hindi",
    text: "मुझे कल दोपहर के लिए सौर ऊर्जा परामर्श बुक करना है। कृपया लागत, समय और अगले सुरक्षित कदम बताएं।",
  },
  {
    label: "Arabic",
    text: "أحتاج إلى حجز استشارة للطاقة الشمسية بعد ظهر الغد. يرجى توضيح التكلفة والخطوة التالية بأمان.",
  },
  {
    label: "Japanese",
    text: "明日の午後に太陽光発電の相談を予約したいです。費用と次の安全な手順を教えてください。",
  },
  {
    label: "Russian",
    text: "Клиент хочет перенести встречу на пятницу, сохранить номер заказа 48291 и получить безопасный следующий шаг.",
  },
  {
    label: "Code-safe",
    text: "Explain this API error and suggest the safest fix without changing production or exposing secrets: request failed because the worker binding was missing.",
  },
  {
    label: "Bring your own",
    text: "Paste your own prompt, quote, product document, chatbot script, RAG chunk, or multilingual text here.",
  },
];

const localizedExamples = {
  hindi: [
    {
      label: "Hindi support",
      text: "मेरा ऑर्डर खराब हालत में पहुंचा है। कृपया तस्वीरें जांचें, शुक्रवार से पहले replacement भेजें, और मुझे सुरक्षित अगला कदम बताएं।",
    },
    {
      label: "Hinglish chatbot",
      text: "Customer bol raha hai ki bill zyada aa raha hai. Unko Hindi aur English mix mein simple explanation do, savings estimate batao, aur appointment book karne ka next step do.",
    },
    {
      label: "India business",
      text: "An Indian AI support company processes thousands of Hindi, English, and Hinglish conversations every hour. The goal is to reduce repeated meaning, keep names and numbers visible, and audit token savings before any production claim.",
    },
    {
      label: "Fintech safety",
      text: "ग्राहक ने पूछा कि EMI payment fail क्यों हुआ। उत्तर में negation, amount, date, customer name, and complaint reason preserve रहना चाहिए।",
    },
  ],
  russian: [
    {
      label: "Russian support",
      text: "Клиент пишет, что заказ пришел поврежденным. Нужно проверить фотографии, сохранить номер заказа, объяснить следующий шаг и не терять отрицание или даты.",
    },
    {
      label: "SaaS prompt",
      text: "A Russian-speaking SaaS support team wants to reduce repeated policy text across billing, onboarding, and troubleshooting prompts while keeping names, numbers, causality, and route lineage auditable.",
    },
    {
      label: "Quote",
      text: "Сложность становится дорогой, когда одна и та же мысль оплачивается снова и снова.",
    },
    {
      label: "Operations",
      text: "Проверь обращение клиента, найди причину задержки, сохрани номер счета 48291, дату 14 августа и не обещай возврат без проверки.",
    },
  ],
  arabic: [
    {
      label: "Arabic support",
      text: "وصل طلب العميل تالفا ويحتاج إلى استبدال قبل يوم الجمعة. يجب حفظ رقم الطلب والتاريخ والسبب وعدم فقدان النفي أو أسماء الأشخاص.",
    },
    {
      label: "Business audit",
      text: "شركة دعم عربية تعالج آلاف محادثات الذكاء الاصطناعي يوميا. الهدف هو تقليل المعنى المكرر مع الحفاظ على الأرقام والأسماء والسببية قبل أي ادعاء إنتاجي.",
    },
    {
      label: "Quote",
      text: "خفض التكلفة لا يعني حذف المعنى. الاختبار الحقيقي هو ضغط النص مع بقاء القرار الصحيح قابلا للتدقيق.",
    },
    {
      label: "Bilingual",
      text: "The customer needs Arabic and English support. احفظ المبلغ 3500، تاريخ الموعد، وسبب الطلب، ثم اعرض الخطوة التالية بأمان.",
    },
  ],
};

const fallbackCounters = {
  totalRuns: 0,
  totalBpeTokens: 0,
  total16xvsTokens: 0,
  totalTokensReduced: 0,
  averageReductionPercent: 0,
  bestRatio: 0,
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

async function analyzeText(text) {
  const response = await fetch("/api/lab/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body?.error?.message || "Public lab service unavailable");
  return body;
}

async function fetchCounters() {
  try {
    const response = await fetch("/api/lab/counters");
    const body = await response.json();
    if (!response.ok || !body.ok) throw new Error("counter unavailable");
    return body.counters;
  } catch {
    return fallbackCounters;
  }
}

function activeExamples() {
  const locale = document.body?.dataset.locale || "";
  return localizedExamples[locale] || examples;
}

function setText(selector, value, root = document) {
  for (const element of root.querySelectorAll(selector)) element.textContent = value;
}

function renderResult(result) {
  const metrics = result.metrics;
  setText("[data-bpe-count]", formatNumber(metrics.bpeTokens));
  setText("[data-vs-count]", formatNumber(metrics.equivalent16xvsTokens));
  setText("[data-root-count]", formatNumber(metrics.rootTokens));
  setText("[data-residual-count]", formatNumber(metrics.residualTokens));
  setText("[data-reduction]", formatPercent(metrics.reductionPercent));
  setText("[data-ratio]", `${metrics.ratio.toFixed(2)}x`);

  const risk = document.querySelector("[data-risk-card]");
  if (risk) {
    risk.dataset.tone = metrics.confidence === "strong" ? "strong" : metrics.confidence === "guarded" ? "warn" : "neutral";
    const warning = result.warnings?.length ? ` ${result.warnings.join(" ")}` : "";
    risk.textContent = `Route confidence: ${metrics.confidence}. Effective public model: ${formatNumber(metrics.effectiveRatio)}x. Residual tokens: ${metrics.residualTokens}.${warning}`;
  }

  const share = document.querySelector("[data-share-box]");
  if (share) {
    share.textContent = `16xVS public lab: BPE estimate ${formatNumber(metrics.bpeTokens)} -> ${formatNumber(metrics.equivalent16xvsTokens)} equivalent tokens, ${formatPercent(metrics.reductionPercent)} modeled reduction. Public estimate, audit required for production claims.`;
  }
}

function renderLabUnavailable() {
  setText("[data-bpe-count]", "Service offline");
  setText("[data-vs-count]", "--");
  setText("[data-root-count]", "--");
  setText("[data-residual-count]", "--");
  setText("[data-reduction]", "--");
  setText("[data-ratio]", "--");

  const risk = document.querySelector("[data-risk-card]");
  if (risk) {
    risk.dataset.tone = "warn";
    risk.textContent = "The public lab API is unavailable. The browser does not run private 16xVS proof logic locally.";
  }

  const share = document.querySelector("[data-share-box]");
  if (share) {
    share.textContent = "16xVS public lab is unavailable. Retry on 16xVS.com or request a private compression audit.";
  }
}

async function refreshCounters() {
  const counters = await fetchCounters();
  setText('[data-counter="totalBpeTokens"]', formatNumber(counters.totalBpeTokens));
  setText('[data-counter="total16xvsTokens"]', formatNumber(counters.total16xvsTokens));
  setText('[data-counter="totalTokensReduced"]', formatNumber(counters.totalTokensReduced));
  setText('[data-counter="averageReductionPercent"]', formatPercent(counters.averageReductionPercent));
  setText('[data-counter="totalRuns"]', formatNumber(counters.totalRuns));
  setText('[data-counter="bestRatio"]', `${Number(counters.bestRatio || 0).toFixed(2)}x`);
}

function seedExamples() {
  const bars = document.querySelectorAll("[data-example-bar]");
  const active = activeExamples();
  for (const bar of bars) {
    bar.innerHTML = "";
    for (const example of active.slice(0, 8)) {
      const button = document.createElement("button");
      button.className = "example-button";
      button.type = "button";
      button.textContent = example.label;
      button.addEventListener("click", () => {
        const input = document.querySelector("[data-lab-input]");
        if (input) input.value = example.text;
      });
      bar.appendChild(button);
    }
  }

  const list = document.querySelector("[data-example-list]");
  if (list) {
    list.innerHTML = "";
    for (const example of active) {
      const card = document.createElement("article");
      card.className = "example-card";
      const preview = example.text.length > 150 ? `${example.text.slice(0, 150)}...` : example.text;
      card.innerHTML = `<h3>${example.label}</h3><p>${preview}</p>`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button ghost";
      button.textContent = "Use example";
      button.addEventListener("click", () => {
        const input = document.querySelector("[data-lab-input]");
        if (input) input.value = example.text;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      card.appendChild(button);
      list.appendChild(card);
    }
  }
}

function bindLab() {
  const runButtons = document.querySelectorAll("[data-run-lab]");
  for (const button of runButtons) {
    button.addEventListener("click", async () => {
      const input = document.querySelector("[data-lab-input]");
      const text = input?.value || "";
      if (!text.trim()) {
        input?.focus();
        return;
      }
      button.disabled = true;
      button.textContent = "Running...";
      try {
        const result = await analyzeText(text);
        renderResult(result);
        await refreshCounters();
      } catch {
        renderLabUnavailable();
      } finally {
        button.disabled = false;
        button.textContent = button.closest("body")?.dataset.page === "lab" ? "Run Compression Test" : "Run 16xVS Count";
      }
    });
  }

  const copyButton = document.querySelector("[data-copy-result]");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const share = document.querySelector("[data-share-box]");
      if (!share) return;
      await navigator.clipboard?.writeText(share.textContent || "").catch(() => {});
      copyButton.textContent = "Copied";
      setTimeout(() => { copyButton.textContent = "Copy Result"; }, 1200);
    });
  }
}

function bindSavingsCalculator() {
  const form = document.querySelector("[data-savings-form]");
  if (!form) return;

  function calculate() {
    const data = new FormData(form);
    const monthlyCalls = Math.max(0, Number(data.get("monthlyCalls")) || 0);
    const avgTokens = Math.max(0, Number(data.get("avgTokens")) || 0);
    const costPerMillion = Math.max(0, Number(data.get("costPerMillion")) || 0);
    const ratio = Math.max(1, Number(data.get("ratio")) || 350);
    const currentTokens = monthlyCalls * avgTokens;
    const vsTokens = Math.ceil(currentTokens / ratio);
    const removedTokens = Math.max(0, currentTokens - vsTokens);
    const currentSpend = (currentTokens / 1_000_000) * costPerMillion;
    const vsSpend = (vsTokens / 1_000_000) * costPerMillion;
    const savings = Math.max(0, currentSpend - vsSpend);

    setText("[data-current-tokens]", formatNumber(currentTokens));
    setText("[data-vs-monthly]", formatNumber(vsTokens));
    setText("[data-removed-tokens]", formatNumber(removedTokens));
    setText("[data-current-spend]", formatMoney(currentSpend));
    setText("[data-vs-spend]", formatMoney(vsSpend));
    setText("[data-monthly-savings]", formatMoney(savings));
  }

  form.addEventListener("input", calculate);
  calculate();
}

function seedDefaultPrompt() {
  const input = document.querySelector("[data-lab-input]");
  if (input && !input.value) input.value = activeExamples()[0].text;
}

seedExamples();
seedDefaultPrompt();
bindLab();
bindSavingsCalculator();
refreshCounters();


