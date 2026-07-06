(function () {
  "use strict";

  const STORAGE_KEY = "ace-lang";
  const DEFAULT_LANG = "en";
  const SITE_URL = "https://aceconscious.studio";
  /** URL path codes for non-English pages. Add codes here when translations are ready. */
  const PATH_LANGS = ["de", "fa", "sa"];

  const translations = {
    en: {
      "meta.title": "ACE.await — Philosophical AI Thriller Novel | Ace Conscious Studio",
      "meta.description":
        "ACE.await — a philosophical AI thriller novel by Hedayat the second. Metafiction about consciousness, the ACE game (Agency, Connection, Exchange), and harmony in personal and social life. Read a free sample chapter.",
      "meta.keywords":
        "ACE.await, philosophical thriller, AI novel, consciousness, artificial intelligence, metafiction, free internet, harmony, Agency Connection Exchange, ACE game, literary fiction, Cologne novel, nested writers, social therapy, thriller novel",
      "meta.ogTitle": "ACE.await — Philosophical AI Thriller Novel",
      "meta.ogDescription":
        "Consciousness shapes the future, not artificial intelligence. A philosophical thriller about nested writers and the ACE game — Agency, Connection, Exchange.",
      "meta.twitterDescription":
        "A metafictional thriller about consciousness, AI, and the ACE game. Free sample chapter available.",
      "meta.bookDescription":
        "ACE.await is a philosophical thriller novel about nested writers, characters who rebel against their author, and one person who tries to bring the ACE game — Agency, Connection, Exchange — into society. Consciousness shapes the future, not artificial intelligence.",
      "skipLink": "Skip to content",
      "nav.openMenu": "Open menu",
      "nav.story": "Story",
      "nav.voices": "Voices",
      "nav.read": "Read",
      "nav.buy": "Get the Book",
      "nav.author": "Author",
      "nav.langLabel": "DE",
      "nav.langAria": "Switch to German",
      "hero.tagline":
        "I am not lying,<br><em>Believe</em> my words!",
      "hero.pitch":
        "Consciousness shapes the future, not artificial intelligence. <em>ACE.await</em> is a philosophical thriller novel about nested writers, characters who rebel against their author, and one person who tries to bring the ACE game — Agency, Connection, Exchange — into society.",
      "hero.genre": "Literary Fiction",
      "hero.topic1": "Philosophical thriller",
      "hero.topic2": "AI & consciousness",
      "hero.topic3": "Metafiction",
      "hero.topic4": "Personal & social harmony",
      "hero.topic5": "ACE game",
      "hero.buyBtn": "Pre-order / Buy",
      "hero.sampleBtn": "Read Chapter 1",
      "hero.coverAlt":
        "ACE.await book cover — philosophical AI thriller novel about consciousness and metafiction",
      "hero.coverBackAlt": "ACE.await back cover — a wager about love, belief, and the mirror between self and self",
      "hero.coverPeekAria": "Turn the book to see the back cover",
      "hero.coverPeekAriaBack": "Turn the book back to the front cover",
      "synopsis.label": "The Story",
      "synopsis.p1":
        "Something is wrong with Hedayat’s unfinished novel: pages go blank, dates shift, and a character inside the book begins talking nonsense, refusing to follow the storyline. Outside the novel, Hedayat is a software team lead in Cologne, helping build a new version of the internet for freedom against the dictatorships of the information age. Then a stranger called Anonymous pulls him into the ACE game — Agency, Connection, Exchange — a personal and social model for making proper decisions and finding a new harmony in life.",
      "synopsis.p2":
        "Strange things begin to happen around him. Blackouts spread across Germany. His company’s data center is hacked. His digital children return, and so does an old friend from his childhood. As Hedayat struggles with fatherhood, love, responsibility, and the fate of his unfinished novel, he must find a way to deal with the mistakes his digital children have made — and with the infinite loop of authors inside his own story. Did Hedayat finally understand who the real author of the novel was?",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "ACE framework",
      "voices.label": "Voices from the Story",
      "voices.title": "Who speaks in ACE.await",
      "char.hedayat.role": "Protagonist",
      "char.hedayat.p1":
        "I live in Cologne, leading a team at a software company, building a new free internet to fight the dictatorship of data. In my private life, I’m constantly struggling to learn what a right decision even means. Anonymous keeps telling me that through ACE, I need to learn something harder: the proper decision.",
      "char.hedayat.p2":
        "For ten years I couldn’t finish my novel, and I blamed myself. It was painful — but finally I understood it wasn’t my fault. It wasn’t me writing the story the whole time.",
      "char.anonymous.p1":
        "It isn’t easy to earn Hedayat’s trust — especially when he thinks you’re a hacker. He still needs to understand: it isn’t technology or tools that will save humanity or the future. It’s consciousness — and learning how to make a proper decision. Hedayat has to practice ACE. We need to hurry. Otherwise it’s getting too late.",
      "char.writer.role": "Inner identity",
      "char.writer.p1":
        "Hedayat must not find out I’m talking to you. I’m the character inside his unfinished novel — and I’m an author too. In his novel I’m writing a novel, and inside my novel I created a character who is also writing another. I gave him my name: Mr. Writer. He treats me exactly the way I’ve been treating Hedayat.",
      "char.writer.p2":
        "If, from time to time, you read something that makes no sense — some chapters about disobedience, blank pages and etc — don’t get confused. That’s me. Be patient. Keep reading. The dots connect at the end.",
      "char.ava.role": "Ex-girlfriend",
      "char.ava.p1":
        "We all carry a «Story's Hero» in our heads — always telling the story in a way that makes us feel we were right. I’m not saying I made no mistakes in my relationship with Hedayat, or that I left him over a single mistake. I left because he kept turning love into the problems he could solve later. He was always ready to explain and analyze when he should have listened — to feel first, understand second, and when understanding wasn’t enough, simply show empathy.",
      "char.sam.role": "CEO's Kid",
      "char.sam.p1":
        "I love the games I play with Uncle-Hedi — the talk we share and the secrets between us. Like the secret of the number 2313.",
      "char.sam.p2":
        "By the way, Uncle-Hedi has this funny habit. Sometimes — only sometimes — when he’s deep in thought and completely lost in his head, he forgets to look around and check where he is not alone, and suddenly, he farts!",
      "char.saman.role": "Old Friend",
      "char.saman.p1":
        "I love Hedayat the way Rumi loved Shams. A person understands the meaning of life through suffering, and true healing comes through pure friendship.",
      "char.adam.p1":
        "I’m not lying. Believe my words. Every trouble humans face in the real world, new digital creatures face in a virtual one. The forms are different; the consequences are the same. Be careful — the author of this novel may not be the one you’re thinking of. Anyway!",
      "char.god.role": "Not in the cast",
      "char.god.p1":
        "I don’t play a role in this story, but my name gets mentioned here and there. I just wanted to say one thing quickly: I am not a game designer who refuses to play the game he created.",
      "sample.label": "Free Sample",
      "sample.title": "Chapter 1 — Anonymous",
      "sample.consoleAria": "Console session localhost:3132",
      "sample.l1": "Is anyone there?",
      "sample.l2": "A savior.",
      "sample.l3": "Are you God?",
      "sample.l4":
        "God? A game designer who doesn't play his own game? No, I am not.",
      "sample.l5": "What do you need?",
      "sample.l6": "Wrong question, wrong answer.",
      "sample.l7": "What is the right question then?",
      "sample.l8": "What do you do?",
      "sample.l9": "Makes sense, so what do you do?",
      "sample.l10": "I play a game with you.",
      "sample.l11": "Game!? What game?",
      "sample.l12": "ACE",
      "sample.l13": "What does it mean?",
      "sample.l14": "Agency, Connection, Exchange.",
      "sample.l15": "Explain more...",
      "sample.l16": "Which part?",
      "sample.l17": "Start from Agency!",
      "sample.l18": "It is about how to make proper decisions",
      "sample.l19": "Which decisions?",
      "sample.l20": "All your decisions",
      "sample.l21": "Like what?",
      "sample.l22": "Like the one you made in the museum.",
      "buy.label": "Get the Book",
      "buy.title": "Take the ACE.await home",
      "buy.comingSoon": "Coming Soon",
      "buy.comingLater": "Coming Later",
      "buy.kindle": "Kindle & paperback",
      "buy.direct": "Direct EPUB / PDF",
      "author.label": "The Author",
      "author.verse":
        "I'm neck-deep in debt.<br>To my past,<br>I owe regret.<br>To my future,<br>I owe fear.<br>I pay off my debt,<br>with distractions.",
      "author.p1":
        "Years ago, I set out to write a novel of <strong>nested writers</strong>—each author inventing the next, who invents the next again, until a <strong>loving relationship</strong> at last breaks the infinite loop. The manuscript stayed unfinished, left to gather dust.",
      "author.p2":
        "Some years later, <strong>ACE</strong> (Agency, Connection, Exchange) came to me: a personal pattern of living that might serve as <strong>social therapy</strong>—a way for human agency and economic agency to meet, and to shape a new <strong>harmony</strong>.",
      "author.p3":
        "In time, that <strong>metafiction</strong> and the ACE idea found their way into my novel, <em>ACE.await</em>.",
      "author.p4":
        "When the novel was ready, I began to think I might publish another version of ACE someday—or perhaps write the next part of the story. That is why I founded Ace Conscious Studio: a home for my writing ideas, with <em>ACE.await</em> as its first work.",
      "author.p5":
        "Welcome to my world of ideas. If even a single word of my writing moves you, write to me—I will probably die of joy.",
      "footer.legal":
        "Excerpt from <em>ACE.await</em> © 2026 Hedayat Abedijoo. All rights reserved. Reproduced with permission of Ace Conscious Studio.",
      "footer.top": "Back to top",
      "footer.privacy": "Privacy",
      "footer.press": "Press kit",
    },
    de: {
      "meta.title": "ACE.await — Philosophischer KI-Thriller | Ace Conscious Studio",
      "meta.description":
        "ACE.await — ein philosophischer KI-Thriller von Hedayat the second. Metafiktion über Bewusstsein, das ACE-Spiel (Agency, Connection, Exchange) und Harmonie im persönlichen und gesellschaftlichen Leben. Leseprobe gratis.",
      "meta.keywords":
        "ACE.await, philosophischer Thriller, KI-Roman, Bewusstsein, künstliche Intelligenz, Metafiktion, freies Internet, Harmonie, Agency Connection Exchange, ACE-Spiel, literarische Belletristik, Köln Roman, verschachtelte Autoren, soziale Therapie, Thriller Roman",
      "meta.ogTitle": "ACE.await — Philosophischer KI-Thriller",
      "meta.ogDescription":
        "Bewusstsein formt die Zukunft, nicht künstliche Intelligenz. Ein philosophischer Thriller über verschachtelte Autoren und das ACE-Spiel — Agency, Connection, Exchange.",
      "meta.twitterDescription":
        "Ein metafiktionaler Thriller über Bewusstsein, KI und das ACE-Spiel. Gratis Leseprobe verfügbar.",
      "meta.bookDescription":
        "ACE.await ist ein philosophischer Thriller über verschachtelte Autoren, Figuren, die sich gegen ihren Autor auflehnen, und eine Person, die das ACE-Spiel — Agency, Connection, Exchange — in die Gesellschaft tragen will. Bewusstsein formt die Zukunft, nicht künstliche Intelligenz.",
      "skipLink": "Zum Inhalt springen",
      "nav.openMenu": "Menü öffnen",
      "nav.story": "Geschichte",
      "nav.voices": "Stimmen",
      "nav.read": "Lesen",
      "nav.buy": "Buch kaufen",
      "nav.author": "Autor",
      "nav.langLabel": "EN",
      "nav.langAria": "Zu Englisch wechseln",
      "hero.tagline":
        "Ich lüge nicht,<br><em>Glaube</em> meinen Worten!",
      "hero.pitch":
        "Bewusstsein formt die Zukunft, nicht künstliche Intelligenz. <em>ACE.await</em> ist ein philosophischer Thriller über verschachtelte Autoren, Figuren, die sich gegen ihren Autor auflehnen, und eine Person, die das ACE-Spiel — Agency, Connection, Exchange — in die Gesellschaft tragen will.",
      "hero.genre": "Literarische Belletristik",
      "hero.topic1": "Philosophischer Thriller",
      "hero.topic2": "KI & Bewusstsein",
      "hero.topic3": "Metafiktion",
      "hero.topic4": "Persönliche & gesellschaftliche Harmonie",
      "hero.topic5": "ACE-Spiel",
      "hero.buyBtn": "Vorbestellen / Kaufen",
      "hero.sampleBtn": "Kapitel 1 lesen",
      "hero.coverAlt":
        "ACE.await Buchcover — philosophischer KI-Thriller über Bewusstsein und Metafiktion",
      "hero.coverBackAlt": "ACE.await Rückseite — eine Wette über Liebe, Glauben und den Spiegel zwischen Ich und Selbst",
      "hero.coverPeekAria": "Buch umdrehen, um die Rückseite zu sehen",
      "hero.coverPeekAriaBack": "Buch zurück zur Vorderseite drehen",
      "synopsis.label": "Die Geschichte",
      "synopsis.p1":
        "Etwas stimmt nicht mit Hedayats unvollendetem Roman: Seiten werden leer, Daten verschieben sich, und eine Figur im Buch fängt an, Unsinn zu reden und sich zu weigern, der Handlung zu folgen. Außerhalb des Romans ist Hedayat Teamleiter einer Softwarefirma in Köln und hilft beim Aufbau eines neuen Internets für Freiheit — gegen die Diktaturen des Informationszeitalters. Dann zieht ihn ein Fremder namens Anonymous in das ACE-Spiel — Agency, Connection, Exchange — ein persönliches und gesellschaftliches Modell für richtige Entscheidungen und eine neue Harmonie im Leben.",
      "synopsis.p2":
        "Seltsame Dinge beginnen um ihn herum zu geschehen. Blackouts breiten sich in Deutschland aus. Das Rechenzentrum seiner Firma wird gehackt. Seine digitalen Kinder kehren zurück, und auch ein alter Freund aus seiner Kindheit. Während Hedayat mit Vaterschaft, Liebe, Verantwortung und dem Schicksal seines unvollendeten Romans ringt, muss er einen Weg finden, mit den Fehlern seiner digitalen Kinder umzugehen — und mit der unendlichen Schleife der Autoren in seiner eigenen Geschichte. Hat Hedayat endlich verstanden, wer der wahre Autor des Romans war?",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "ACE-Rahmenwerk",
      "voices.label": "Stimmen aus der Geschichte",
      "voices.title": "Wer spricht in ACE.await",
      "char.hedayat.role": "Protagonist",
      "char.hedayat.p1":
        "Ich lebe in Köln, führe ein Team in einer Softwarefirma und baue ein neues freies Internet gegen die Diktatur der Daten. Im Privaten ringe ich ständig damit zu lernen, was eine richtige Entscheidung überhaupt bedeutet. Anonymous sagt mir immer wieder, dass ich durch ACE etwas Schwereres lernen muss: die richtige Entscheidung.",
      "char.hedayat.p2":
        "Zehn Jahre lang konnte ich meinen Roman nicht beenden und gab mir die Schuld. Es tat weh — aber schließlich verstand ich, dass es nicht meine Schuld war. Nicht ich habe die ganze Zeit die Geschichte geschrieben.",
      "char.anonymous.p1":
        "Es ist nicht leicht, Hedayats Vertrauen zu gewinnen — besonders wenn er denkt, du bist ein Hacker. Er muss noch verstehen: Nicht Technologie oder Werkzeuge werden die Menschheit oder die Zukunft retten. Es ist Bewusstsein — und zu lernen, wie man eine richtige Entscheidung trifft. Hedayat muss ACE üben. Wir müssen uns beeilen. Sonst wird es zu spät.",
      "char.writer.role": "Innere Identität",
      "char.writer.p1":
        "Hedayat darf nicht erfahren, dass ich mit dir rede. Ich bin die Figur in seinem unvollendeten Roman — und selbst Autor. In seinem Roman schreibe ich einen Roman, und in meinem Roman habe ich eine Figur erschaffen, die wiederum einen anderen schreibt. Ich gab ihm meinen Namen: Mr. Writer. Er behandelt mich genau so, wie ich Hedayat behandelt habe.",
      "char.writer.p2":
        "Wenn du ab und zu etwas liest, das keinen Sinn ergibt — Kapitel über Ungehorsam, leere Seiten und so weiter — verwirre dich nicht. Das bin ich. Hab Geduld. Lies weiter. Am Ende verbinden sich die Punkte.",
      "char.ava.role": "Ex-Freundin",
      "char.ava.p1":
        "Wir alle tragen einen «Story's Hero» in unserem Kopf — und erzählen die Geschichte immer so, dass wir im Recht waren. Ich sage nicht, dass ich in meiner Beziehung mit Hedayat keine Fehler gemacht habe, oder dass ich ihn wegen eines einzigen Fehlers verlassen habe. Ich ging, weil er die Liebe immer in Probleme verwandelte, die er später lösen wollte. Er war immer bereit zu erklären und zu analysieren, wenn er zuhören sollte — erst fühlen, dann verstehen, und wenn Verstehen nicht reichte, einfach Empathie zeigen.",
      "char.sam.role": "Kind des CEOs",
      "char.sam.p1":
        "Ich liebe die Spiele, die ich mit Onkel-Hedi spiele — das Gespräch zwischen uns und die Geheimnisse. Wie das Geheimnis der Zahl 2313.",
      "char.sam.p2":
        "Übrigens hat Onkel-Hedi diese lustige Angewohnheit. Manchmal — nur manchmal — wenn er tief in Gedanken ist und ganz in seinem Kopf verschwindet, vergisst er, sich umzusehen und zu prüfen, ob er nicht allein ist, und plötzlich furzt er!",
      "char.saman.role": "Alter Freund",
      "char.saman.p1":
        "Ich liebe Hedayat, so wie Rumi Shams liebte. Ein Mensch versteht den Sinn des Lebens durch Leiden, und wahre Heilung kommt durch reine Freundschaft.",
      "char.adam.p1":
        "Ich lüge nicht. Glaube meinen Worten. Jede Sorge, mit der Menschen in der realen Welt kämpfen, kämpfen neue digitale Wesen in einer virtuellen. Die Formen sind verschieden; die Folgen dieselben. Sei vorsichtig — der Autor dieses Romans ist vielleicht nicht der, an den du denkst. Wie auch immer!",
      "char.god.role": "Nicht in der Besetzung",
      "char.god.p1":
        "Ich spiele keine Rolle in dieser Geschichte, aber mein Name wird hier und da erwähnt. Ich wollte nur schnell eines sagen: Ich bin kein Spieledesigner, der sich weigert, das Spiel zu spielen, das er erschaffen hat.",
      "sample.label": "Leseprobe",
      "sample.title": "Kapitel 1 — Anonymous",
      "sample.consoleAria": "Konsolensitzung localhost:3132",
      "sample.l1": "Ist jemand da?",
      "sample.l2": "Ein Retter.",
      "sample.l3": "Bist du Gott?",
      "sample.l4":
        "Gott? Ein Spieledesigner, der sein eigenes Spiel nicht spielt? Nein, bin ich nicht.",
      "sample.l5": "Was brauchst du?",
      "sample.l6": "Falsche Frage, falsche Antwort.",
      "sample.l7": "Was ist dann die richtige Frage?",
      "sample.l8": "Was machst du?",
      "sample.l9": "Logisch, also was machst du?",
      "sample.l10": "Ich spiele ein Spiel mit dir.",
      "sample.l11": "Spiel!? Welches Spiel?",
      "sample.l12": "ACE",
      "sample.l13": "Was bedeutet das?",
      "sample.l14": "Agency, Connection, Exchange.",
      "sample.l15": "Erkläre mehr...",
      "sample.l16": "Welchen Teil?",
      "sample.l17": "Fang mit Agency an!",
      "sample.l18": "Es geht darum, wie man richtige Entscheidungen trifft",
      "sample.l19": "Welche Entscheidungen?",
      "sample.l20": "Alle deine Entscheidungen",
      "sample.l21": "Wie zum Beispiel?",
      "sample.l22": "Wie die im Museum.",
      "buy.label": "Buch kaufen",
      "buy.title": "Nimm ACE.await mit nach Hause",
      "buy.comingSoon": "Demnächst",
      "buy.comingLater": "Später",
      "buy.kindle": "Kindle & Taschenbuch",
      "buy.direct": "Direkt EPUB / PDF",
      "author.label": "Der Autor",
      "author.verse":
        "Bis zum Hals in Schulden.<br>Meiner Vergangenheit<br>schulde ich Reue.<br>Meiner Zukunft<br>schulde ich Angst.<br>Meine Schulden tilge ich<br>mit Ablenkung.",
      "author.p1":
        "Vor Jahren begann ich, einen Roman über <strong>verschachtelte Autoren</strong> zu schreiben — jeder erfindet den nächsten, der wieder den nächsten erfindet, bis eine <strong>liebende Beziehung</strong> endlich die Endlosschleife durchbricht. Das Manuskript blieb unvollendet und lag Staub an.",
      "author.p2":
        "Einige Jahre später kam <strong>ACE</strong> (Agency, Connection, Exchange) zu mir: ein persönliches Lebensmuster, das als <strong>soziale Therapie</strong> dienen könnte — ein Weg, menschliche Handlungsfähigkeit und wirtschaftliche Handlungsfähigkeit zusammenzubringen und eine neue <strong>Harmonie</strong> zu formen.",
      "author.p3":
        "Mit der Zeit fanden jene <strong>Metafiktion</strong> und die ACE-Idee den Weg in meinen Roman <em>ACE.await</em>.",
      "author.p4":
        "Als der Roman fertig war, begann ich zu denken, dass ich vielleicht eines Tages eine andere Version von ACE veröffentlichen — oder den nächsten Teil der Geschichte schreiben würde. Deshalb gründete ich Ace Conscious Studio: ein Zuhause für meine Schreibideen, mit <em>ACE.await</em> als erstem Werk.",
      "author.p5":
        "Willkommen in meiner Welt der Ideen. Wenn auch nur ein einziges Wort meines Schreibens dich berührt, schreib mir — ich werde wahrscheinlich vor Freude sterben.",
      "footer.legal":
        "Auszug aus <em>ACE.await</em> © 2026 Hedayat Abedijoo. Alle Rechte vorbehalten. Wiedergabe mit Genehmigung von Ace Conscious Studio.",
      "footer.top": "Nach oben",
      "footer.privacy": "Datenschutz",
      "footer.press": "Pressemappe",
    },
  };

  function availablePathLangs() {
    return PATH_LANGS.filter((code) => translations[code]);
  }

  function langFromPath() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    for (const code of PATH_LANGS) {
      if (segments.includes(code) && translations[code]) return code;
    }
    return null;
  }

  function langPath(lang) {
    return lang === DEFAULT_LANG ? "/" : `/${lang}`;
  }

  function isOnLangPath(lang) {
    const current = langFromPath();
    if (lang === DEFAULT_LANG) return current === null;
    return current === lang;
  }

  function redirectLegacyLangParam() {
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get("lang");
    if (!paramLang || !translations[paramLang]) return false;

    const target = langPath(paramLang) + window.location.hash;

    if (!isOnLangPath(paramLang)) {
      window.location.replace(target);
      return true;
    }

    if (params.has("lang")) {
      window.location.replace(target);
      return true;
    }

    return false;
  }

  function getInitialLang() {
    const pathLang = langFromPath();
    if (pathLang) return pathLang;

    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get("lang");
    if (paramLang && translations[paramLang]) return paramLang;

    return DEFAULT_LANG;
  }

  function t(lang, key) {
    return translations[lang]?.[key] ?? translations.en[key] ?? "";
  }

  function applyLanguage(lang, options = {}) {
    const { skipUrlSync = false } = options;
    const strings = translations[lang] || translations.en;
    document.documentElement.lang = lang;

    if (!skipUrlSync && !isOnLangPath(lang)) {
      localStorage.setItem(STORAGE_KEY, lang);
      window.location.assign(langPath(lang) + window.location.hash);
      return;
    }

    document.title = strings["meta.title"];
    setMeta("description", strings["meta.description"]);
    setMeta("keywords", strings["meta.keywords"]);
    setMeta("og:title", strings["meta.ogTitle"], "property");
    setMeta("og:description", strings["meta.ogDescription"], "property");
    setMeta("twitter:title", strings["meta.ogTitle"]);
    setMeta("twitter:description", strings["meta.twitterDescription"]);
    setMeta("og:locale", lang === "de" ? "de_DE" : "en_US", "property");
    setMeta("og:url", `${SITE_URL}${langPath(lang)}`, "property");
    updateUrlMeta(lang);
    updateStructuredData(lang, strings);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (strings[key] != null) el.textContent = strings[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (strings[key] != null) el.innerHTML = strings[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key && strings[key] != null) el.setAttribute(attr, strings[key]);
      });
    });

    const switcher = document.getElementById("lang-switch");
    if (switcher) {
      switcher.textContent = strings["nav.langLabel"];
      switcher.setAttribute("aria-label", strings["nav.langAria"]);
      switcher.dataset.lang = lang === "en" ? "de" : "en";
    }

    localStorage.setItem(STORAGE_KEY, lang);
    document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
  }

  function setLink(rel, href, hreflang) {
    const selector = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]`;
    let el = document.querySelector(selector);
    if (!el && hreflang) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      el.setAttribute("hreflang", hreflang);
      document.head.appendChild(el);
    }
    if (el) el.setAttribute("href", href);
  }

  function updateUrlMeta(lang) {
    const canonical = `${SITE_URL}${langPath(lang)}`;
    setLink("canonical", canonical);
    setLink("alternate", `${SITE_URL}/`, "en");
    availablePathLangs().forEach((code) => {
      setLink("alternate", `${SITE_URL}${langPath(code)}`, code);
    });
    setLink("alternate", `${SITE_URL}/`, "x-default");
  }

  function setMeta(name, content, attr = "name") {
    const selector =
      attr === "property"
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", content);
  }

  function updateStructuredData(lang, strings) {
    const script = document.getElementById("structured-data");
    if (!script) return;

    const data = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: `${SITE_URL}${langPath(lang)}`,
          name: "Ace Conscious Studio",
          description: strings["meta.ogDescription"],
          inLanguage: Object.keys(translations),
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Ace Conscious Studio",
          url: `${SITE_URL}/`,
          email: "hedayat@AceConscious.Studio",
          logo: `${SITE_URL}/assets/logo-icon.png`,
        },
        {
          "@type": "Book",
          "@id": `${SITE_URL}/#book`,
          name: "ACE.await",
          alternateName: ["ACE await", "ACE. await"],
          author: {
            "@type": "Person",
            name: "Hedayat Abedijoo",
            alternateName: "Hedayat the second",
          },
          publisher: { "@id": `${SITE_URL}/#organization` },
          url: `${SITE_URL}${langPath(lang)}`,
          image: `${SITE_URL}/assets/cover.png`,
          bookFormat: "https://schema.org/EBook",
          inLanguage: lang,
          datePublished: "2026",
          genre: [
            "Philosophical fiction",
            "Thriller",
            "Metafiction",
            "Science fiction",
            "Literary fiction",
          ],
          keywords: strings["meta.keywords"],
          description: strings["meta.bookDescription"],
          about: [
            { "@type": "Thing", name: lang === "de" ? "Künstliche Intelligenz" : "Artificial intelligence" },
            { "@type": "Thing", name: lang === "de" ? "Bewusstsein" : "Consciousness" },
            { "@type": "Thing", name: lang === "de" ? "Persönliche Harmonie" : "Personal harmony" },
            { "@type": "Thing", name: lang === "de" ? "Gesellschaftliche Harmonie" : "Social harmony" },
          ],
        },
      ],
    };

    script.textContent = JSON.stringify(data);
  }

  function initLanguage() {
    if (redirectLegacyLangParam()) return;

    const lang = getInitialLang();
    applyLanguage(lang, { skipUrlSync: true });

    const switcher = document.getElementById("lang-switch");
    if (switcher) {
      switcher.addEventListener("click", (event) => {
        event.preventDefault();
        const next = switcher.dataset.lang || (lang === "en" ? "de" : "en");
        applyLanguage(next);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLanguage);
  } else {
    initLanguage();
  }

  window.aceI18n = {
    applyLanguage,
    getLang: () => document.documentElement.lang || DEFAULT_LANG,
    getString: (key) => {
      const lang = document.documentElement.lang || DEFAULT_LANG;
      return translations[lang]?.[key] ?? translations.en[key] ?? "";
    },
  };
})();
