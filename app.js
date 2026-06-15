let initializeApp;
let getFirestore;
let collection;
let addDoc;
let deleteDoc;
let doc;
let getDocs;
let query;
let updateDoc;
let where;
let serverTimestamp;
let getAuth;
let GoogleAuthProvider;
let signInWithPopup;
let signOut;

const firebaseConfig = {
  apiKey: "AIzaSyDEf4NV_vg8GYX0IhvdNouT4PR2orhD3So",
  authDomain: "mallem-6b76d.firebaseapp.com",
  projectId: "mallem-6b76d",
  storageBucket: "mallem-6b76d.firebasestorage.app",
  messagingSenderId: "13653837388",
  appId: "1:13653837388:web:ad0cb8ef7e64b5140696e9",
  measurementId: "G-3G72T2Z3Y4"
};

let db = null;
let auth = null;
let googleProvider = null;
let firebaseReady = false;
let firebaseLoading = null;

const CITIES = [
  "الدار البيضاء","الرباط","فاس","مراكش","طنجة","أكادير","مكناس","وجدة","القنيطرة","تطوان","سلا","تمارة",
  "آسفي","الجديدة","الناظور","خريبكة","بني ملال","تازة","المحمدية","الخميسات","العرائش","القصر الكبير",
  "سطات","برشيد","سيدي سليمان","سيدي قاسم","تاوريرت","جرسيف","الحسيمة","شفشاون","وزان","تارودانت",
  "تزنيت","كلميم","طانطان","العيون","الداخلة","السمارة","بوجدور","طرفاية","الرشيدية","ورزازات",
  "زاكورة","تنغير","ميدلت","إفران","صفرو","الحاجب","أزرو","مولاي يعقوب","تاونات","بولمان",
  "سيدي بنور","اليوسفية","قلعة السراغنة","الصويرة","شيشاوة","الحوز","الرحامنة","بن جرير","الفقيه بن صالح",
  "أزيلال","خنيفرة","قصبة تادلة","وادي زم","أبي الجعد","بنسليمان","بوزنيقة","مديونة","النواصر","الدروة",
  "تيط مليل","الهراويين","عين عودة","الصخيرات","المنصورية","مرتيل","المضيق","الفنيدق","أصيلة","تيفلت",
  "سوق الأربعاء الغرب","مولاي بوسلهام","سيدي يحيى الغرب","أولاد تايمة","أيت ملول","الدشيرة الجهادية",
  "إنزكان","القليعة","بيوكرى","اشتوكة آيت باها","أيت باها","سيدي إفني","أسا","الزاك","فكيك","بوعرفة",
  "بركان","السعيدية","أحفير","زايو","دريوش","ميضار","ابن الطيب","إمزورن","بني بوعياش","تارجيست",
  "كتامة","أجدير","تامسنا","عين حرودة","الوليدية","سبت جزولة","جمعة سحيم","حد السوالم","أولاد عياد",
  "سوق السبت أولاد النمة","دمنات","بزو","مريرت","أجلموس","تاهلة","أكنول","أولاد برحيل","تافراوت",
  "أيت أورير","تحناوت","أمزميز","إمنتانوت","تامنصورت","سيدي رحال","حد كورت","تيسة","غفساي",
  "قرية با محمد","رباط الخير","أرفود","الريصاني","تنجداد","بودنيب","أوفوس","سكورة","أيت بن حدو",
  "قلعة مكونة","أمسمرير","بومالن دادس","محاميد الغزلان","تازارين","أكدز"
];

const JOBS = [
  "كهربائي","بلومبي","صباغ","زلايجي","جباص","نجار","حداد","بناء","ترصيص صحي","مكيفات","ألمنيوم",
  "زجاج","كاميرات مراقبة","إصلاح أجهزة منزلية","تنظيف","حدائق","نقل أثاث","ديكور","رخام","بارابول"
];

const ARABIC_INPUT_PATTERN = "[\\u0600-\\u06FF\\s،.-]+";
const ICONS = { home: "⌂", history: "◷", favorite: "♡", account: "◉", requests: "☷", notes: "✎" };
const memoryStore = {};

const state = {
  screen: "welcome",
  user: normalizeCurrentUser(load("mallem_user", null)),
  users: load("mallem_users", []).map(normalizeUser).filter(isModernUser),
  requests: load("mallem_requests", []),
  favorites: load("mallem_favorites", []),
  history: load("mallem_history", []),
  notes: load("mallem_notes", ""),
  isOnline: navigator.onLine !== false,
  editingAccount: false,
  pendingGoogleUser: load("mallem_pending_google", null),
  register: { step: 1, role: "", data: {} },
  filters: { city: "", job: "الكل", search: "" }
};

const app = document.querySelector("#app");
const toastEl = document.querySelector("#toast");

window.addEventListener("hashchange", () => {
  const page = location.hash.replace("#", "");
  if (page) setScreen(page);
});

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  const value = action.dataset.value;
  const id = action.dataset.id;
  const actions = {
    welcome: () => setScreen("welcome"),
    googleLogin: () => loginWithGoogle(),
    register: () => startRegister(),
    logout: () => logout(),
    deleteAccount: () => deleteAccount(),
    editAccount: () => { state.editingAccount = true; render(); },
    cancelEdit: () => { state.editingAccount = false; render(); },
    saveAccount: () => saveAccount(),
    back: () => backStep(),
    next: () => nextStep(),
    home: () => setScreen("home"),
    history: () => setScreen("history"),
    favorite: () => setScreen("favorite"),
    account: () => setScreen("account"),
    requests: () => setScreen("requests"),
    notes: () => setScreen("notes"),
    role: () => selectRole(value),
    saveRegister: () => saveRegister(),
    toggleFav: () => toggleFavorite(id),
    call: () => registerContact(id, () => window.location.href = `tel:${value}`),
    whatsapp: () => registerContact(id, () => window.open(`https://wa.me/212${value.replace(/^0/, "")}`, "_blank")),
    request: () => createRequest(id),
    saveNotes: () => saveNotes(),
    saveRequestNote: () => saveRequestNote(id),
    filterJob: () => { state.filters.job = value; render(); },
    clearFilters: () => { state.filters = { city: "", job: "الكل", search: "" }; render(); }
  };
  const result = actions[action.dataset.action]?.();
  if (result?.catch) {
    result.catch((error) => {
      console.error(error);
      fail("وقع خطأ غير متوقع. رجع جرّب مرة أخرى.");
    });
  }
});

document.addEventListener("input", (event) => {
  const el = event.target;
  if (!el.name) return;
  if (el.name === "search") state.filters.search = el.value;
  if (el.name === "cityFilter") state.filters.city = el.value;
  if (el.name === "notes") state.notes = el.value;
  if (el.name?.startsWith("requestNote:")) updateRequestNoteDraft(el.name.replace("requestNote:", ""), el.value);
  if (el.closest("#register-form")) state.register.data[el.name] = el.type === "checkbox" ? el.checked : el.value;
  if (state.screen === "home") render();
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
});

init();

async function init() {
  purgeLegacyLocalAccounts();
  registerOfflineCache();
  bindNetworkStatus();
  render();
  if (!state.isOnline) toast("ما كاينش اتصال إنترنت. تقدر تستعمل المعلومات المحفوظة فالجهاز.");
  initFirebase().then((ready) => {
    if (ready) syncUsers().then(() => render());
  });
}

function registerOfflineCache() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("service-worker.js").catch((error) => {
    console.warn("Offline cache registration failed.", error);
  });
}

function bindNetworkStatus() {
  window.addEventListener("online", () => {
    state.isOnline = true;
    toast("رجع الاتصال بالإنترنت.");
    initFirebase().then((ready) => {
      if (ready) syncUsers().then(() => render());
    });
    render();
  });
  window.addEventListener("offline", () => {
    state.isOnline = false;
    toast("ما كاينش اتصال إنترنت. الصفحة خدامة بالمعلومات المحفوظة فالجهاز.");
    render();
  });
}

async function initFirebase() {
  if (firebaseReady) return true;
  if (!state.isOnline) return false;
  if (firebaseLoading) return firebaseLoading;
  firebaseLoading = (async () => {
    try {
      const [appModule, firestoreModule, authModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")
      ]);
      ({ initializeApp } = appModule);
      ({ getFirestore, collection, addDoc, deleteDoc, doc, getDocs, query, updateDoc, where, serverTimestamp } = firestoreModule);
      ({ getAuth, GoogleAuthProvider, signInWithPopup, signOut } = authModule);

      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp);
      auth = getAuth(firebaseApp);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
      auth.languageCode = "ar";
      firebaseReady = true;
      return true;
    } catch (error) {
      console.warn("Firebase unavailable, local mode is active.", error);
      firebaseLoading = null;
      return false;
    }
  })();
  return firebaseLoading;
}

function render() {
  const publicScreens = ["welcome", "register"];
  if (!state.user && !publicScreens.includes(state.screen)) state.screen = "welcome";
  app.innerHTML = publicScreens.includes(state.screen) ? renderPublic() : renderPrivate();
}

function renderPublic() {
  if (state.screen === "register") return registerScreen();
  return `
    <main class="welcome">
      <section class="welcome-panel pop">
        <img src="icon.png" alt="Mallem" class="brand-logo" onerror="this.style.display='none'">
        <h1>مرحبا بك في منصة "معلم"</h1>
        <p>وسيط مغربي بسيط كيربط الزبناء بالحرفيين فمدينتهم بسرعة وبطريقة منظمة.</p>
        <div class="actions">
          <button class="btn primary" data-action="googleLogin">الدخول بواسطة Gmail</button>
          <p class="muted small">أول مرة؟ دخل بـ Gmail ومن بعد كمل معلومات الحساب ديالك.</p>
        </div>
      </section>
    </main>`;
}

function registerScreen() {
  const step = state.register.step;
  return `
    <main class="welcome">
      <section class="welcome-panel pop">
        <img src="icon.png" alt="Mallem" class="brand-logo" onerror="this.style.display='none'">
        <div class="steps">${[1,2,3,4].map(n => `<span class="step ${n < step ? "done" : n === step ? "current" : ""}"></span>`).join("")}</div>
        <h1>إنشاء حساب</h1>
        ${registerStep()}
      </section>
    </main>`;
}

function registerStep() {
  const role = state.register.role;
  if (state.register.step === 1) {
    return `
      <div class="form">
        <p class="muted">اختار نوع الحساب ديالك.</p>
        <div class="role-grid">
          <button class="radio-card ${role === "client" ? "selected" : ""}" data-action="role" data-value="client">زبون كنقلب على معلم</button>
          <button class="radio-card ${role === "pro" ? "selected" : ""}" data-action="role" data-value="pro">أنا حرفي</button>
        </div>
        <button class="btn primary" data-action="next">متابعة</button>
        <button class="btn ghost" data-action="welcome">رجوع</button>
      </div>`;
  }
  if (state.register.step === 2) {
    return `
      <form id="register-form" class="form">
        <div class="field"><label>Gmail</label><input value="${esc(state.pendingGoogleUser?.email || val("email") || "")}" disabled></div>
        <div class="field"><label>الإسم الكامل</label><input name="fullName" required value="${esc(val("fullName"))}" placeholder="الإسم والنسب" pattern="${ARABIC_INPUT_PATTERN}" title="كتب بالعربية فقط"></div>
        <div class="grid two">
          <div class="field"><label>رقم الهاتف للتواصل</label><input name="phone" inputmode="tel" required value="${esc(val("phone"))}" placeholder="06XXXXXXXX"></div>
          <div class="field"><label>المدينة</label><input name="city" list="cities" required value="${esc(val("city"))}" placeholder="بحث عن المدينة"></div>
        </div>
        ${role === "pro" ? `<div class="field"><label>رقم واتساب</label><input name="whatsapp" inputmode="tel" required value="${esc(val("whatsapp"))}" placeholder="06XXXXXXXX"></div>` : ""}
        ${role === "pro" ? `<div class="field"><label>الحرفة</label><select name="job" required>${JOBS.map(j => `<option ${val("job") === j ? "selected" : ""}>${j}</option>`).join("")}</select></div>` : ""}
        <datalist id="cities">${CITIES.map(city => `<option value="${city}"></option>`).join("")}</datalist>
        <div class="field"><label>العنوان</label><input name="address" required value="${esc(val("address"))}" placeholder="الحي، الشارع" pattern="${ARABIC_INPUT_PATTERN}" title="كتب بالعربية فقط"></div>
        ${role === "pro" ? diplomaFields() : ""}
        <div class="actions">
          <button class="btn primary" type="button" data-action="next">متابعة</button>
          <button class="btn ghost" type="button" data-action="back">رجوع</button>
        </div>
      </form>`;
  }
  if (state.register.step === 3) {
    return `
      <form id="register-form" class="form">
        <div class="empty">الحساب غادي يتربط بـ Gmail ديالك. رقم الهاتف غادي يبقى غير للتواصل ويمكن تبدلو من صفحة الحساب.</div>
        <div class="actions">
          <button class="btn primary" type="button" data-action="next">متابعة</button>
          <button class="btn ghost" type="button" data-action="back">رجوع</button>
        </div>
      </form>`;
  }
  return `
    <form id="register-form" class="form">
      <div class="empty">جاهز تبدأ؟ صورة gmail ديالك هاتبان كبروفايل (إلى غاية الإصدار الثاني).</div>
      <button class="btn green" type="button" data-action="saveRegister">بدء الاستخدام</button>
      <button class="btn ghost" type="button" data-action="back">رجوع</button>
    </form>`;
}

function diplomaFields() {
  const checked = val("hasDiploma") === true || val("hasDiploma") === "on";
  return `
    <label class="checkbox">
      <input name="hasDiploma" type="checkbox" ${checked ? "checked" : ""}>
      <span>أنا أملك شهادة ديبلوم</span>
    </label>
    <label class="checkbox">
      <input name="terms" type="checkbox" ${val("terms") ? "checked" : ""}>
      <span>أوافق على ظهور معلوماتي المهنية وموقعي التقريبي لمستخدمي المنصة.</span>
    </label>
    <small class="muted">ملاحظة: باقي مازدناش ميزة التحقق من الديبلوم اللي هانضيفوها قريبا إن شاء الله, إلا حددتي "أملك ديبلوم" غادي تكون عليك علامة (قيد المراجعة) إلى غاية إضافة ميزة التحقق. الموافقة على الشروط و الأحكام ضروريين!</small>`;
}

function renderPrivate() {
  return `<div class="app-shell">${topbar()}${pageContent()}${bottomNav()}</div>`;
}

function topbar() {
  return `
    <header class="topbar">
      <div class="topbrand"><img src="icon.png" alt="Mallem" onerror="this.style.display='none'"><span>منصة معلم</span></div>
      <nav class="desktop-nav">${navButtons()}</nav>
    </header>`;
}

function navItems() {
  const items = [
    { key: "history", label: "السجل", short: "السجل", icon: ICONS.history },
    { key: "favorite", label: "المفضلة", short: "مفضلة", icon: ICONS.favorite },
    { key: "home", label: "الرئيسية", short: "الرئيسية", icon: ICONS.home },
    { key: "account", label: "الحساب", short: "حساب", icon: ICONS.account }
  ];
  items.push(state.user?.role === "pro"
    ? { key: "requests", label: "الطلبات", short: "طلبات", icon: ICONS.requests }
    : { key: "notes", label: "دفتر الملاحظات", short: "ملاحظات", icon: ICONS.notes });
  return items;
}

function navButtons() {
  return navItems().map(item => `<button class="nav-btn ${state.screen === item.key ? "active" : ""}" data-action="${item.key}">${item.label}</button>`).join("");
}

function bottomNav() {
  return `<nav class="bottom-nav">${navItems().map(item => `
    <button class="${state.screen === item.key ? "active" : ""} ${item.key === "home" ? "home-special" : ""}" data-action="${item.key}" title="${item.label}">
      <span class="ico">${item.icon}</span><span>${item.short}</span>
    </button>`).join("")}</nav>`;
}

function pageContent() {
  if (state.screen === "history") return historyPage();
  if (state.screen === "favorite") return favoritePage();
  if (state.screen === "account") return accountPage();
  if (state.screen === "requests") return requestsPage();
  if (state.screen === "notes") return notesPage();
  return homePage();
}

function homePage() {
  const pros = filteredPros();
  return `
    <main class="page grid fade-in">
      ${offlineNotice()}
      <section class="panel hero-strip">
        <div>
          <h2 class="section-title">الحرفيون القريبون منك</h2>
          <p class="muted">قلب بالمدينة والحرفة وتواصل مباشرة مع المعلم المناسب.</p>
        </div>
      </section>
      <section class="panel">
        <div class="searchbar">
          <div class="field"><label>بحث</label><input name="search" value="${esc(state.filters.search)}" placeholder="إسم، حرفة، حي..."></div>
          <div class="field"><label>المدينة</label><input name="cityFilter" list="cities2" value="${esc(state.filters.city)}" placeholder="اختار المدينة"></div>
          <div class="field"><label>الحرفة</label><select onchange="window.__setJob(this.value)">${["الكل", ...JOBS].map(j => `<option ${state.filters.job === j ? "selected" : ""}>${j}</option>`).join("")}</select></div>
          <button class="btn ghost" data-action="clearFilters">مسح</button>
        </div>
        <datalist id="cities2">${CITIES.map(city => `<option value="${city}"></option>`).join("")}</datalist>
      </section>
      <section class="filters">${["الكل", ...JOBS].map(job => `<button class="chip ${state.filters.job === job ? "active" : ""}" data-action="filterJob" data-value="${job}">${job}</button>`).join("")}</section>
      <section class="grid three">${pros.length ? pros.map(proCard).join("") : `<div class="empty">ما لقيناش حرفيين بهاد البحث.</div>`}</section>
    </main>`;
}

function offlineNotice() {
  if (state.isOnline) return "";
  return `<section class="offline-banner">ما كاينش اتصال إنترنت. كتشوف دابا غير المعلومات اللي محفوظة فالجهاز.</section>`;
}

window.__setJob = (job) => { state.filters.job = job; render(); };

function proCard(pro) {
  const fav = state.favorites.includes(pro.id);
  const name = displayName(pro);
  return `
    <article class="card pro-card lift">
      <div class="pro-head">
        ${pro.avatarUrl ? `<img class="avatar" src="${esc(pro.avatarUrl)}" alt="${esc(name)}">` : `<div class="avatar">${esc(name[0] || "م")}</div>`}
        <div>
          <strong>${esc(name)}</strong>
          <div class="muted small">${esc(pro.job || "حرفي")} في ${esc(pro.city || "غير محدد")}</div>
        </div>
      </div>
      <div class="meta">
        <span>★ ${esc(pro.rating || "جديد")}</span>
        <span>${esc(pro.address || "")}</span>
        ${pro.hasDiploma ? `<span class="badge">معتمد (قيد المراجعة)</span>` : `<span class="badge badge-warn">حرفي تقليدي</span>`}
      </div>
      <div class="card-actions">
        <button class="btn primary" data-action="call" data-id="${esc(pro.id)}" data-value="${esc(pro.phone)}">اتصال</button>
        <button class="btn green" data-action="whatsapp" data-id="${esc(pro.id)}" data-value="${esc(pro.whatsapp || pro.phone)}">واتساب</button>
        <button class="btn icon light" data-action="toggleFav" data-id="${esc(pro.id)}">${fav ? "♥" : "♡"}</button>
      </div>
      ${state.user?.role === "client" ? `<button class="btn ghost" data-action="request" data-id="${esc(pro.id)}">إرسال طلب</button>` : ""}
    </article>`;
}

function historyPage() {
  const rows = state.history.map(id => allPros().find(p => p.id === id)).filter(Boolean);
  return pageList("السجل", rows, "مازال ما تواصلتي مع حتى معلم.");
}

function favoritePage() {
  const rows = state.favorites.map(id => allPros().find(p => p.id === id)).filter(Boolean);
  return pageList("المفضلة", rows, "مازال ما زدتي حتى حرفي للمفضلة.");
}

function pageList(title, rows, empty) {
  return `<main class="page grid fade-in"><h2 class="section-title">${title}</h2><section class="grid three">${rows.length ? rows.map(proCard).join("") : `<div class="empty">${empty}</div>`}</section></main>`;
}

function requestsPage() {
  const myRequests = state.requests.filter(r => r.proId === state.user.id);
  return `
    <main class="page grid fade-in">
      <h2 class="section-title">الطلبات</h2>
      ${myRequests.length ? myRequests.map(r => `
        <article class="panel lift request-card">
          <strong>${esc(r.clientName)}</strong>
          <p class="muted">رقم الهاتف: ${esc(r.clientPhone)}</p>
          <p>طلب خدمة ${esc(r.job)} في ${esc(r.city)}</p>
          <div class="field">
            <label>الملاحظات</label>
            <textarea name="requestNote:${r.id}" placeholder="زيد أي ملاحظة على هاد الطلب...">${escapeHtml(r.note || "")}</textarea>
          </div>
          <button class="btn primary" data-action="saveRequestNote" data-id="${r.id}">حفظ الملاحظات</button>
        </article>`).join("") : `<div class="empty">ما كاين حتى طلب جديد حاليا.</div>`}
    </main>`;
}

function notesPage() {
  return `
    <main class="page fade-in">
      <section class="panel form">
        <h2 class="section-title">دفتر الملاحظات</h2>
        <div class="field"><textarea name="notes" placeholder="كتب أي ملاحظة بغيتي تحفظها...">${esc(state.notes)}</textarea></div>
        <button class="btn primary" data-action="saveNotes">حفظ الملاحظات</button>
      </section>
    </main>`;
}

function accountPage() {
  const u = state.user;
  return `
    <main class="page grid two fade-in">
      <section class="panel account-card">
        <h2 class="section-title">الحساب</h2>
        ${state.editingAccount ? accountForm(u) : accountInfo(u)}
      </section>
      <section class="panel form settings-card">
        <h2 class="section-title">إعدادات</h2>
        <button class="btn primary" data-action="editAccount">تعديل المعلومات</button>
        <div class="danger-zone">
          <button class="btn danger" data-action="logout">تسجيل الخروج</button>
          <button class="btn danger solid" data-action="deleteAccount">حذف الحساب</button>
        </div>
      </section>
    </main>`;
}

function accountInfo(u) {
  const name = displayName(u);
  return `
    <div class="profile-head">
      ${u.avatarUrl ? `<img class="avatar big" src="${esc(u.avatarUrl)}" alt="${esc(name)}">` : `<div class="avatar big">${esc(name[0] || "م")}</div>`}
      <div>
        <strong>${esc(name)}</strong>
        <p class="muted">${esc(u.email || "")}</p>
        <p class="muted">${u.role === "pro" ? "حرفي" : "زبون"} ${u.job ? `- ${esc(u.job)}` : ""}</p>
      </div>
    </div>
    <div class="info-list">
      <p><span>الهاتف:</span> ${esc(u.phone || "غير محدد")}</p>
      ${u.role === "pro" ? `<p><span>واتساب:</span> ${esc(u.whatsapp || "غير محدد")}</p>` : ""}
      <p><span>المدينة:</span> ${esc(u.city || "غير محددة")}</p>
      <p><span>العنوان:</span> ${esc(u.address || "غير محدد")}</p>
      ${u.role === "pro" ? `<p><span>التوثيق:</span> ${u.hasDiploma ? "موثق بديبلوم" : "حرفي بدون ديبلوم"}</p>` : ""}
    </div>`;
}

function accountForm(u) {
  const name = displayName(u);
  return `
    <form id="account-form" class="form">
      <div class="field"><label>الإسم الكامل</label><input name="fullName" value="${esc(name)}" required pattern="${ARABIC_INPUT_PATTERN}" title="كتب بالعربية فقط"></div>
      <div class="field"><label>Gmail</label><input value="${esc(u.email || "")}" disabled><small class="muted">Gmail هو هوية الحساب.</small></div>
      <div class="field"><label>رقم الهاتف للتواصل</label><input name="phone" value="${esc(u.phone || "")}" inputmode="tel" required></div>
      ${u.role === "pro" ? `<div class="field"><label>رقم واتساب</label><input name="whatsapp" value="${esc(u.whatsapp || "")}" inputmode="tel"></div>
      <div class="field"><label>الحرفة</label><select name="job">${JOBS.map(j => `<option ${u.job === j ? "selected" : ""}>${j}</option>`).join("")}</select></div>` : ""}
      <div class="field"><label>المدينة</label><input name="city" list="account-cities" value="${esc(u.city || "")}" required></div>
      <datalist id="account-cities">${CITIES.map(city => `<option value="${city}"></option>`).join("")}</datalist>
      <div class="field"><label>العنوان</label><input name="address" value="${esc(u.address || "")}" required pattern="${ARABIC_INPUT_PATTERN}" title="كتب بالعربية فقط"></div>
      <div class="actions inline">
        <button class="btn primary" type="button" data-action="saveAccount">حفظ التعديلات</button>
        <button class="btn ghost" type="button" data-action="cancelEdit">إلغاء</button>
      </div>
    </form>`;
}

function startRegister() {
  if (!state.pendingGoogleUser) {
    toast("دخل بواسطة Gmail أولا.");
    return loginWithGoogle();
  }
  state.register = {
    step: 1,
    role: "",
    data: {
      fullName: state.pendingGoogleUser.displayName || "",
      email: state.pendingGoogleUser.email || ""
    }
  };
  setScreen("register");
}

function selectRole(role) {
  state.register.role = role;
  render();
}

async function loginWithGoogle() {
  await initFirebase();
  if (!auth || !googleProvider) return fail("Firebase Auth ما متصلش. تأكد من إعدادات Firebase.");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const googleUser = {
      googleUid: result.user.uid,
      email: result.user.email || "",
      fullName: result.user.displayName || "",
      avatarUrl: result.user.photoURL || ""
    };
    await syncUsers();
    const existing = findUserByEmail(googleUser.email) || state.users.find(u => u.googleUid === googleUser.googleUid);
    if (existing) {
      const merged = normalizeUser({ ...existing, googleUid: googleUser.googleUid, email: googleUser.email, avatarUrl: existing.avatarUrl || googleUser.avatarUrl });
      state.user = merged;
      await persistUser(merged);
      save("mallem_user", merged);
      toast("مرحبا بك.");
      setScreen("home");
      return;
    }
    state.pendingGoogleUser = googleUser;
    save("mallem_pending_google", googleUser);
    state.register = { step: 1, role: "", data: { fullName: googleUser.fullName, email: googleUser.email } };
    toast("كمل معلومات الحساب ديالك.");
    setScreen("register");
  } catch (error) {
    console.error(error);
    fail(googleAuthErrorMessage(error));
  }
}

async function nextStep() {
  if (!validateStep()) return;
  state.register.step = Math.min(4, state.register.step + 1);
  render();
}

function backStep() {
  state.register.step = Math.max(1, state.register.step - 1);
  render();
}

function validateRegisterData() {
  const d = state.register.data;
  if (!state.register.role) return fail("اختار واش أنت زبون ولا حرفي.");
  if (!d.fullName || !d.phone || !d.city || !d.address) return fail("كمل جميع المعلومات الضرورية.");
  if (!validateArabicFields(d, ["fullName", "address"])) return false;
  if (!CITIES.includes(d.city)) return fail("اختار مدينة من لائحة مدن المغرب.");
  if (state.register.role === "pro") {
    if (!d.whatsapp || !d.job) return fail("كمل معلومات الحرفي.");
    if ((d.hasDiploma === true || d.hasDiploma === "on") && !d.terms) return fail("خاصك توافق على الشروط.");
  }
  return true;
}

function validateStep() {
  if (state.register.step === 1 && !state.register.role) return fail("اختار واش أنت زبون ولا حرفي.");
  if (state.register.step === 2) return validateRegisterData();
  return true;
}

async function saveRegister() {
  await syncUsers();
  if (!validateRegisterData()) return;
  if (!state.pendingGoogleUser?.email) return fail("دخل بواسطة Gmail أولا.");
  if (findUserByEmail(state.pendingGoogleUser.email)) return existingAccount();
  const data = normalizeUser({
    ...state.register.data,
    role: state.register.role,
    email: state.pendingGoogleUser.email,
    googleUid: state.pendingGoogleUser.googleUid,
    avatarUrl: state.pendingGoogleUser.avatarUrl || state.register.data.avatarUrl
  });
  data.id = crypto.randomUUID();
  data.createdAt = new Date().toISOString();
  data.hasDiploma = data.hasDiploma === true || data.hasDiploma === "on";
  data.rating = data.role === "pro" ? 4.5 : undefined;

  try {
    const remote = await addRemote("users", data);
    data.docId = remote?.id || data.docId;
  } catch (error) {
    console.warn(error);
    toast("تعذر الحفظ في Firebase، غادي يتحفظ محليا مؤقتا.");
  }

  state.users.push(data);
  save("mallem_users", state.users);
  state.user = data;
  save("mallem_user", data);
  state.pendingGoogleUser = null;
  remove("mallem_pending_google");
  toast("تم إنشاء الحساب بنجاح.");
  setScreen("home");
}

async function saveAccount() {
  const form = document.querySelector("#account-form");
  const formData = new FormData(form);
  const updated = {
    ...state.user,
    fullName: formData.get("fullName")?.trim(),
    phone: formData.get("phone")?.trim(),
    city: formData.get("city")?.trim(),
    address: formData.get("address")?.trim()
  };
  if (state.user.role === "pro") {
    updated.whatsapp = formData.get("whatsapp")?.trim();
    updated.job = formData.get("job");
  }
  if (!updated.fullName || !updated.phone || !updated.city || !updated.address) return fail("كمل المعلومات الضرورية.");
  if (!validateArabicFields(updated, ["fullName", "address"])) return;
  if (!CITIES.includes(updated.city)) return fail("اختار مدينة من اللائحة.");
  await persistUser(updated);
  state.user = normalizeUser(updated);
  state.editingAccount = false;
  save("mallem_user", state.user);
  toast("تحفظات التعديلات.");
  render();
}

async function deleteAccount() {
  const ok = confirm("واش متأكد باغي تحذف الحساب؟ هاد العملية مايمكنش ترجعها.");
  if (!ok) return;
  try {
    await deleteRemoteUser(state.user);
  } catch (error) {
    console.warn(error);
    toast("تعذر حذف الحساب من Firebase، تحذف محليا مؤقتا.");
  }
  state.users = state.users.filter(u => u.id !== state.user.id && u.email !== state.user.email);
  save("mallem_users", state.users);
  remove("mallem_user");
  remove("mallem_pending_google");
  state.user = null;
  state.pendingGoogleUser = null;
  if (auth) await signOut(auth).catch(() => {});
  toast("تم حذف الحساب.");
  setScreen("welcome");
}

function logout() {
  state.user = null;
  state.pendingGoogleUser = null;
  remove("mallem_user");
  remove("mallem_pending_google");
  if (auth) signOut(auth).catch(() => {});
  setScreen("welcome");
}

function filteredPros() {
  return allPros().filter(pro => {
    const text = `${displayName(pro)} ${pro.job} ${pro.city} ${pro.address}`.toLowerCase();
    const q = state.filters.search.trim().toLowerCase();
    return (!q || text.includes(q))
      && (!state.filters.city || pro.city === state.filters.city)
      && (state.filters.job === "الكل" || pro.job === state.filters.job);
  });
}

function allPros() {
  return state.users.filter(u => isModernUser(u) && u.role === "pro");
}

function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(x => x !== id) : [...state.favorites, id];
  save("mallem_favorites", state.favorites);
  render();
}

function registerContact(id, callback) {
  if (id) {
    state.history = [id, ...state.history.filter(x => x !== id)].slice(0, 30);
    save("mallem_history", state.history);
  }
  callback();
}

async function createRequest(id) {
  const pro = allPros().find(p => p.id === id);
  if (!pro) return;
  const request = {
    id: crypto.randomUUID(),
    proId: id,
    clientId: state.user.id,
    clientName: displayName(state.user),
    clientPhone: state.user.phone,
    city: state.user.city,
    job: pro.job,
    createdAt: new Date().toISOString()
  };
  state.requests.push(request);
  state.history = [id, ...state.history.filter(x => x !== id)].slice(0, 30);
  save("mallem_requests", state.requests);
  save("mallem_history", state.history);
  try {
    const remote = await addRemote("requests", request);
    request.docId = remote?.id || request.docId;
    save("mallem_requests", state.requests);
  } catch (error) { console.warn(error); }
  toast("تم إرسال الطلب للحرفي.");
  render();
}

function saveNotes() {
  save("mallem_notes", state.notes);
  toast("تحفظات الملاحظات.");
}

function updateRequestNoteDraft(id, note) {
  state.requests = state.requests.map(request => request.id === id ? { ...request, note } : request);
}

async function saveRequestNote(id) {
  const field = [...document.querySelectorAll("textarea[name^='requestNote:']")].find(item => item.name === `requestNote:${id}`);
  const note = field?.value || "";
  updateRequestNoteDraft(id, note);
  save("mallem_requests", state.requests);
  const request = state.requests.find(item => item.id === id);
  if (request?.docId && db) {
    try {
      await updateDoc(doc(db, "requests", request.docId), { note });
    } catch (error) {
      console.warn(error);
      toast("تحفظات الملاحظات محليا. تعذر الحفظ فـ Firebase.");
      return;
    }
  }
  toast("تحفظات ملاحظات الطلب.");
}

async function syncUsers() {
  if (!db) return;
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const remoteUsers = snapshot.docs.map(item => normalizeUser({ ...item.data(), docId: item.id, id: item.data().id || item.id })).filter(isModernUser);
    const merged = new Map([...state.users, ...remoteUsers].filter(Boolean).map(u => [u.email || u.googleUid || u.id, u]));
    state.users = [...merged.values()];
    save("mallem_users", state.users);
    if (state.user) {
      const fresh = findUserByEmail(state.user.email);
      if (fresh) {
        state.user = fresh;
        save("mallem_user", fresh);
      }
    }
  } catch (error) {
    console.warn("Could not sync users.", error);
  }
}

async function persistUser(user) {
  const normalized = normalizeUser(user);
  state.users = state.users.map(u => (u.id === normalized.id || u.email === normalized.email || u.googleUid === normalized.googleUid) ? normalized : u);
  save("mallem_users", state.users);
  if (!db) return;
  const payload = forFirestore(normalized);
  if (normalized.docId) {
    await updateDoc(doc(db, "users", normalized.docId), payload);
    syncCurrentUserRecord(normalized);
    return;
  }
  const remote = await findRemoteUser(normalized.email);
  if (remote) {
    normalized.docId = remote.id;
    await updateDoc(doc(db, "users", remote.id), payload);
    syncCurrentUserRecord(normalized);
    return;
  }
  const created = await addRemote("users", normalized);
  normalized.docId = created?.id;
  state.users = state.users.map(u => (u.id === normalized.id || u.email === normalized.email || u.googleUid === normalized.googleUid) ? normalized : u);
  save("mallem_users", state.users);
  syncCurrentUserRecord(normalized);
}

async function addRemote(name, data) {
  if (!db) throw new Error("Firestore is not available.");
  return addDoc(collection(db, name), { ...forFirestore(data), serverCreatedAt: serverTimestamp() });
}

async function findRemoteUser(email) {
  if (!db || !email) return null;
  const snapshot = await getDocs(query(collection(db, "users"), where("email", "==", email)));
  return snapshot.empty ? null : snapshot.docs[0];
}

async function deleteRemoteUser(user) {
  if (!db) throw new Error("Firestore is not available.");
  if (user.docId) {
    await deleteDoc(doc(db, "users", user.docId));
    return;
  }
  const snapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
  await Promise.all(snapshot.docs.map(item => deleteDoc(doc(db, "users", item.id))));
}

function existingAccount() {
  toast("هاد Gmail عندو حساب من قبل. دخل بواسطة Gmail.");
  setScreen("welcome");
  return false;
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return state.users.find(u => normalizeEmail(u.email) === normalized);
}

function normalizeLocalPhone(phone) {
  return String(phone || "").replace(/\s|-/g, "").replace(/^\+212/, "0");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isArabicText(value) {
  return /^[\u0600-\u06FF\s،.-]+$/.test(String(value || "").trim());
}

function validateArabicFields(data, fields) {
  const labels = { fullName: "الإسم الكامل", address: "العنوان" };
  const invalid = fields.find(field => !isArabicText(data[field]));
  if (!invalid) return true;
  return fail(`${labels[invalid] || "هاد الخانة"} خاصو يتكتب بالعربية فقط.`);
}

function normalizeUser(user) {
  if (!user) return null;
  const fullName = user.fullName || user.name || user.displayName || "";
  return { ...user, fullName, email: normalizeEmail(user.email), phone: normalizeLocalPhone(user.phone), whatsapp: normalizeLocalPhone(user.whatsapp || "") };
}

function normalizeCurrentUser(user) {
  const normalized = normalizeUser(user);
  return isModernUser(normalized) ? normalized : null;
}

function isModernUser(user) {
  return Boolean(user && (normalizeEmail(user.email) || user.googleUid));
}

function purgeLegacyLocalAccounts() {
  const cleanUsers = load("mallem_users", []).map(normalizeUser).filter(isModernUser);
  save("mallem_users", cleanUsers);
  state.users = cleanUsers;
  if (!isModernUser(state.user)) {
    state.user = null;
    remove("mallem_user");
  }
  state.favorites = state.favorites.filter(id => !String(id).startsWith("seed-"));
  state.history = state.history.filter(id => !String(id).startsWith("seed-"));
  save("mallem_favorites", state.favorites);
  save("mallem_history", state.history);
}

function displayName(user) {
  return user?.fullName || user?.name || "مستخدم معلم";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function esc(value) {
  return escapeHtml(value);
}

function forFirestore(data) {
  const out = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function syncCurrentUserRecord(user) {
  if (!state.user || !user) return;
  if (state.user.id !== user.id && normalizeEmail(state.user.email) !== normalizeEmail(user.email) && state.user.googleUid !== user.googleUid) return;
  state.user = user;
  save("mallem_user", user);
}

function setScreen(screen) {
  state.screen = screen;
  if (["home", "history", "favorite", "account", "requests", "notes"].includes(screen)) location.hash = screen;
  render();
}

function val(key) {
  return state.register.data[key] ?? "";
}

function googleAuthErrorMessage(error) {
  const code = error?.code || "";
  const messages = {
    "auth/popup-closed-by-user": "تسدات نافذة Gmail قبل ما تكمل الدخول.",
    "auth/cancelled-popup-request": "كاينة نافذة دخول مفتوحة من قبل. سدها وعاود جرّب.",
    "auth/popup-blocked": "المتصفح منع نافذة Gmail. سمح بالـ popups وعاود جرّب.",
    "auth/operation-not-allowed": "خاصك تفعّل Google من Firebase Authentication > Sign-in providers.",
    "auth/unauthorized-domain": "هاد الدومين مازال ما مضافش في Firebase Authentication > Settings > Authorized domains.",
    "auth/network-request-failed": "كاين مشكل اتصال مع Firebase. جرّب من دومين منشور أو اتصال آخر."
  };
  return messages[code] || `تعذر الدخول بواسطة Gmail. ${code ? `(${code})` : ""}`;
}

function fail(message) {
  toast(message);
  return false;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl.timer);
  toastEl.timer = setTimeout(() => toastEl.classList.remove("show"), 4200);
}

function load(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key) ?? memoryStore[key];
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  const raw = JSON.stringify(value);
  memoryStore[key] = raw;
  try { globalThis.localStorage?.setItem(key, raw); } catch { memoryStore[key] = raw; }
}

function remove(key) {
  delete memoryStore[key];
  try { globalThis.localStorage?.removeItem(key); } catch { delete memoryStore[key]; }
}
