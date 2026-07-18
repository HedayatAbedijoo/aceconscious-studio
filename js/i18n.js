(function () {
  "use strict";

  const STORAGE_KEY = "ace-lang";
  const DEFAULT_LANG = "en";
  const SITE_URL = "https://aceconscious.studio";
  /** URL path codes for non-English pages. Add codes here when translations are ready. */
  const PATH_LANGS = ["de", "fa", "sa"];

  /** Book cover art per language (EN/DE share English artwork). */
  const COVER_ASSETS = {
    en: { front: "assets/cover.png", back: "assets/cover-back.png" },
    de: { front: "assets/cover.png", back: "assets/cover-back.png" },
    fa: { front: "assets/cover-back-fa.png", back: "assets/cover-fa.png" },
  };

  function getCoverAssets(lang) {
    const assets = COVER_ASSETS[lang] || COVER_ASSETS.en;
    const versioned = (path) =>
      typeof window.aceAssetUrl === "function" ? window.aceAssetUrl(path) : `/${path.replace(/^\//, "")}`;
    return {
      front: versioned(assets.front),
      back: versioned(assets.back),
    };
  }

  function coverImageUrl(lang) {
    const front = getCoverAssets(lang).front;
    if (/^https?:/i.test(front)) return front;
    return `${SITE_URL}${front.startsWith("/") ? front : `/${front}`}`;
  }

  function updateBookCovers(lang) {
    const { front, back } = getCoverAssets(lang);
    const frontImg = document.querySelector(".book-cover__face--front .hero__cover");
    const backImg = document.querySelector(".book-cover__face--back .hero__cover");
    if (frontImg && frontImg.getAttribute("src") !== front) frontImg.setAttribute("src", front);
    if (backImg && backImg.getAttribute("src") !== back) backImg.setAttribute("src", back);

    const imageUrl = coverImageUrl(lang);
    setMeta("og:image", imageUrl, "property");
    setMeta("twitter:image", imageUrl);
  }

  const translations = {
    en: {
      "meta.title": "ACE.await is a philosophical literary thriller | Ace Conscious Studio",
      "meta.description":
        "ACE.await — a philosophical AI thriller novel by Hedayat the second. Metafiction about consciousness, the ACE game (Agency, Connection, Exchange), and harmony in personal and social life. Read a free sample chapter.",
      "meta.keywords":
        "ACE.await, philosophical literary thriller, AI novel, consciousness, artificial intelligence, metafiction, free internet, harmony, Agency Connection Exchange, ACE game, literary fiction, Cologne novel, nested writers, social therapy, thriller novel",
      "meta.ogTitle": "ACE.await is a philosophical literary thriller",
      "meta.ogDescription":
        "Consciousness shapes the future—not artificial intelligence. A philosophical literary thriller about nested writers and the ACE game — Agency, Connection, Exchange.",
      "meta.twitterDescription":
        "A metafictional thriller about consciousness, AI, and the ACE game. Free sample chapter available.",
      "meta.bookDescription":
        "ACE.await is a philosophical literary thriller novel about nested writers, characters who rebel against their author, and one person who tries to bring the ACE game — Agency, Connection, Exchange — into society. Consciousness shapes the future—not artificial intelligence.",
      "skipLink": "Skip to content",
      "nav.openMenu": "Open menu",
      "nav.story": "Story",
      "nav.voices": "Voices",
      "nav.read": "Read",
      "nav.buy": "Get the Book",
      "nav.author": "Author",
      "nav.contact": "Contact",
      "nav.langAria": "Language",
      "hero.tagline":
        "I am not lying,<br><em>Believe</em> my words!",
      "hero.author": "Mr. Writer: Hedayat the second",
      "hero.pitch":
        "Consciousness shapes the future—not artificial intelligence. <em>ACE.await</em> is a literary and philosophical thriller about writers within writers—where characters rebel against their creators, and one love is meant to break the endless loop. But the one claiming to have fallen in love is an artificial intelligence. Amid the chaos, the game of ACE begins: Agency, Connection, Exchange.",
      "hero.genre": "Literary Fiction",
      "hero.topic1": "Philosophical literary thriller",
      "hero.topic2": "AI & consciousness",
      "hero.topic3": "Metafiction",
      "hero.topic4": "Personal & social harmony",
      "hero.topic5": "ACE game",
      "hero.buyBtn": "Pre-order / Buy",
      "hero.sampleBtn": "Sample Chapters",
      "hero.coverAlt":
        "ACE.await book cover — philosophical AI thriller novel about consciousness and metafiction",
      "hero.coverBackAlt": "ACE.await back cover — a wager about love, belief, and the mirror between self and self",
      "hero.coverPeekAria": "Turn the book to see the back cover",
      "hero.coverPeekAriaBack": "Turn the book back to the front cover",
      "synopsis.label": "The Story",
      "synopsis.lead":
        "<span class=\"synopsis__lead\">Something is wrong with Hedayat’s unfinished novel.</span> Pages go blank. One of its characters begins speaking directly to the reader, rewriting scenes and refusing to obey the story. Outside the novel, Hedayat leads a software team in Cologne and is helping to build a new version of the internet—one intended to resist the new dictatorships of the information age. Yet one bad decision after another has left him exhausted.",
      "synopsis.p2":
        "Then a stranger known only as <strong>Anonymous</strong> draws him into the <strong>ACE</strong> game: Agency, Connection, Exchange—a personal and social model for making proper decisions and finding a different kind of harmony. Soon, the boundaries between code, memory, fiction, and responsibility begin to collapse.",
      "synopsis.p4": "",
      "synopsis.beatsAria": "Escalating events",
      "synopsis.beat1": "Blackouts spread across Germany.",
      "synopsis.beat2": "His company’s data center is hacked.",
      "synopsis.beat3": "His digital children return.",
      "synopsis.beat4": "So does an old friend from childhood.",
      "synopsis.p5":
        "As Hedayat struggles with love, fatherhood, and the fate of his unfinished novel, he must confront the mistakes made by his digital children—and discover that the infinite loop of authors nested within his story will not end the way he expects. But one question remains: <strong>who is the real author of this story?</strong>",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "ACE framework",
      "voices.label": "Voices of the Characters",
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
      "char.god.name": "God",
      "char.god.p1":
        "I don’t play a role in this story, but my name gets mentioned here and there. I just wanted to say one thing quickly: I am not a game designer who refuses to play the game he created.",
      "sample.label": "Sample Chapters",
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
      "sample.ch6.title": "Chapter 6 — Disobedience",
      "sample.ch6.readerAria": "Chapter 6 — Disobedience, paginated reader",
      "sample.ch6.counterTemplate": "{current} / {total}",
      "sample.ch6.prevBtn": "Previous",
      "sample.ch6.nextBtn": "Next page",
      "buy.label": "Get the Book",
      "buy.comingSoon": "Coming Soon",
      "buy.comingLater": "Coming Later",
      "buy.kindle": "Kindle & paperback",
      "buy.preorder": "Pre-order",
      "buy.kindleEbook": "eBook (Kindle / EPUB)",
      "buy.direct": "Direct EPUB / PDF",
      "author.label": "The Author",
      "author.verse":
        "I'm neck-deep in debt.<br>To my past,<br>I owe regret.<br>To my future,<br>I owe fear.<br>I pay off my debt,<br>with distractions.",
      "author.p1":
        "Years ago, I set out to write a novel about writers nested within writers—each author creating the next, who in turn creates another, until, at last, love breaks the infinite loop. But the manuscript and my notes remained unfinished, gathering dust in a corner.",
      "author.p2":
        "Some years later, <strong>ACE</strong>—Agency, Connection, and Exchange—came to me: a personal model for making better decisions and living more consciously. A model that might even serve as a kind of <strong>social therapy</strong>—a way to bring together the agency of individuals and businesses, and shape a new harmony.",
      "author.p3":
        "Over time, that metafictional idea and ACE became intertwined, and my novel <em>ACE.await</em> took shape. Once the novel was finished, I began to wonder whether I might someday publish another version of ACE—or perhaps write the next part of the story. That is why I founded Ace Conscious Studio: a home for my ideas and writing, with <em>ACE.await</em> as its first work.",
      "author.p4": "",
      "author.p5":
        "Welcome to my world of ideas. If even a single word of my writing moves you, <a href=\"#contact\">please write to me</a>—I will probably die of joy when I see your message.",
      "contact.label": "Contact",
      "contact.emailLabel": "Email",
      "contact.emailPlaceholder": "your@email.com",
      "contact.messageLabel": "Message",
      "contact.messagePlaceholder":
        "I'd be delighted to hear from you — whether it's a book review, a question about the story, or anything else you'd like to share.",
      "contact.submit": "Send message",
      "contact.sending": "Sending…",
      "contact.success": "Thank you — your message is on its way.",
      "contact.error": "Something went wrong. Please try again in a moment.",
      "contact.notConfigured":
        "The contact form is not set up yet. Please try again later.",
      "contact.deployError":
        "The form backend needs redeploying. In Google Apps Script, set access to Anyone and create a new deployment.",
      "footer.legal":
        "Excerpt from <em>ACE.await</em> © 2026 Hedayat Abedijoo. All rights reserved. Reproduced with permission of Ace Conscious Studio.",
      "footer.top": "Back to top",
      "footer.contact": "Contact",
      "footer.privacy": "Privacy",
      "footer.press": "Press kit",
    },
    de: {
      "meta.title": "ACE.await ist ein philosophischer literarischer Thriller | Ace Conscious Studio",
      "meta.description":
        "ACE.await — ein philosophischer KI-Thriller von Hedayat the second. Metafiktion über Bewusstsein, das ACE-Spiel (Agency, Connection, Exchange) und Harmonie im persönlichen und gesellschaftlichen Leben. Leseprobe gratis.",
      "meta.keywords":
        "ACE.await, philosophischer literarischer Thriller, KI-Roman, Bewusstsein, künstliche Intelligenz, Metafiktion, freies Internet, Harmonie, Agency Connection Exchange, ACE-Spiel, literarische Belletristik, Köln Roman, verschachtelte Autoren, soziale Therapie, Thriller Roman",
      "meta.ogTitle": "ACE.await ist ein philosophischer literarischer Thriller",
      "meta.ogDescription":
        "Bewusstsein formt die Zukunft—nicht künstliche Intelligenz. Ein philosophischer literarischer Thriller über verschachtelte Autoren und das ACE-Spiel — Agency, Connection, Exchange.",
      "meta.twitterDescription":
        "Ein metafiktionaler Thriller über Bewusstsein, KI und das ACE-Spiel. Gratis Leseprobe verfügbar.",
      "meta.bookDescription":
        "ACE.await ist ein philosophischer literarischer Thriller über verschachtelte Autoren, Figuren, die sich gegen ihren Autor auflehnen, und eine Person, die das ACE-Spiel — Agency, Connection, Exchange — in die Gesellschaft tragen will. Bewusstsein formt die Zukunft—nicht künstliche Intelligenz.",
      "skipLink": "Zum Inhalt springen",
      "nav.openMenu": "Menü öffnen",
      "nav.story": "Geschichte",
      "nav.voices": "Stimmen",
      "nav.read": "Lesen",
      "nav.buy": "Buch kaufen",
      "nav.author": "Autor",
      "nav.contact": "Kontakt",
      "nav.langAria": "Sprache",
      "hero.tagline":
        "Ich lüge nicht,<br><em>Glaube</em> meinen Worten!",
      "hero.author": "Herr Schriftsteller: Hedayat the second",
      "hero.pitch":
        "Bewusstsein formt die Zukunft—nicht künstliche Intelligenz. <em>ACE.await</em> ist ein literarischer und philosophischer Thriller über Autoren in Autoren — wo Figuren gegen ihre Schöpfer rebellieren und eine Liebe die endlose Schleife durchbrechen soll. Doch wer behauptet, sich verliebt zu haben, ist eine künstliche Intelligenz. Mitten im Chaos beginnt das Spiel ACE: Agency, Connection, Exchange.",
      "hero.genre": "Literarische Belletristik",
      "hero.topic1": "Philosophischer literarischer Thriller",
      "hero.topic2": "KI & Bewusstsein",
      "hero.topic3": "Metafiktion",
      "hero.topic4": "Persönliche & gesellschaftliche Harmonie",
      "hero.topic5": "ACE-Spiel",
      "hero.buyBtn": "Vorbestellen / Kaufen",
      "hero.sampleBtn": "Beispielkapitel",
      "hero.coverAlt":
        "ACE.await Buchcover — philosophischer KI-Thriller über Bewusstsein und Metafiktion",
      "hero.coverBackAlt": "ACE.await Rückseite — eine Wette über Liebe, Glauben und den Spiegel zwischen Ich und Selbst",
      "hero.coverPeekAria": "Buch umdrehen, um die Rückseite zu sehen",
      "hero.coverPeekAriaBack": "Buch zurück zur Vorderseite drehen",
      "synopsis.label": "Die Geschichte",
      "synopsis.lead":
        "<span class=\"synopsis__lead\">Etwas stimmt nicht mit Hedayats unvollendetem Roman.</span> Seiten werden leer. Eine seiner Figuren beginnt, direkt zum Leser zu sprechen, Szenen umzuschreiben und sich zu weigern, der Geschichte zu gehorchen. Außerhalb des Romans führt Hedayat ein Softwareteam in Köln und hilft beim Aufbau einer neuen Version des Internets — einer, die den neuen Diktaturen des Informationszeitalters widerstehen soll. Doch eine schlechte Entscheidung nach der anderen hat ihn erschöpft.",
      "synopsis.p2":
        "Dann zieht ihn ein Fremder, der nur als <strong>Anonymous</strong> bekannt ist, in das <strong>ACE</strong>-Spiel: Agency, Connection, Exchange — ein persönliches und gesellschaftliches Modell, um richtige Entscheidungen zu treffen und eine andere Art von Harmonie zu finden. Bald beginnen die Grenzen zwischen Code, Erinnerung, Fiktion und Verantwortung zu verschwimmen.",
      "synopsis.p4": "",
      "synopsis.beatsAria": "Eskalierende Ereignisse",
      "synopsis.beat1": "Blackouts breiten sich in Deutschland aus.",
      "synopsis.beat2": "Das Rechenzentrum seiner Firma wird gehackt.",
      "synopsis.beat3": "Seine digitalen Kinder kehren zurück.",
      "synopsis.beat4": "Ebenso ein alter Freund aus seiner Kindheit.",
      "synopsis.p5":
        "Während Hedayat mit Liebe, Vaterschaft und dem Schicksal seines unvollendeten Romans ringt, muss er die Fehler seiner digitalen Kinder konfrontieren — und entdecken, dass die unendliche Schleife der Autoren, die in seiner Geschichte verschachtelt sind, nicht so enden wird, wie er es erwartet. Aber eine Frage bleibt: <strong>Wer ist der wahre Autor dieser Geschichte?</strong>",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "ACE-Rahmenwerk",
      "voices.label": "Stimmen der Figuren",
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
      "char.god.name": "Gott",
      "char.god.p1":
        "Ich spiele keine Rolle in dieser Geschichte, aber mein Name wird hier und da erwähnt. Ich wollte nur schnell eines sagen: Ich bin kein Spieledesigner, der sich weigert, das Spiel zu spielen, das er erschaffen hat.",
      "sample.label": "Beispielkapitel",
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
      "sample.ch6.title": "Kapitel 6 — Ungehorsam",
      "sample.ch6.readerAria": "Kapitel 6 — Ungehorsam, seitenweise Leser",
      "sample.ch6.counterTemplate": "{current} / {total}",
      "sample.ch6.prevBtn": "Zurück",
      "sample.ch6.nextBtn": "Nächste Seite",
      "buy.label": "Buch kaufen",
      "buy.comingSoon": "Demnächst",
      "buy.comingLater": "Später",
      "buy.kindle": "Kindle & Taschenbuch",
      "buy.preorder": "Vorbestellen",
      "buy.kindleEbook": "E‑Book (Kindle / EPUB)",
      "buy.direct": "Direkt EPUB / PDF",
      "author.label": "Der Autor",
      "author.verse":
        "Bis zum Hals in Schulden.<br>Meiner Vergangenheit<br>schulde ich Reue.<br>Meiner Zukunft<br>schulde ich Angst.<br>Meine Schulden tilge ich<br>mit Ablenkung.",
      "author.p1":
        "Vor Jahren nahm ich mir vor, einen Roman über ineinander verschachtelte Schriftsteller zu schreiben – jeder Autor erschafft den nächsten, der wiederum einen weiteren erschafft, bis schließlich die Liebe diese Endlosschleife durchbricht. Doch das Manuskript und meine Notizen blieben unvollendet und verstaubten in einer Ecke. Einige Jahre später kam mir die Idee zu <strong>ACE</strong> – Agency, Connection und Exchange: ein persönliches Modell, um bessere Entscheidungen zu treffen und bewusster zu leben. Ein Modell, das vielleicht sogar als eine Art <strong>gesellschaftliche Therapie</strong> dienen könnte – ein Weg, die Handlungsfähigkeit von Menschen und Unternehmen miteinander zu verbinden und eine neue Harmonie entstehen zu lassen.",
      "author.p2":
        "Mit der Zeit verflochten sich diese metafiktionale Idee und ACE miteinander, und mein Roman <em>ACE.await</em> nahm Gestalt an. Als der Roman fertig war, fragte ich mich, ob ich eines Tages vielleicht eine weitere Version von ACE veröffentlichen – oder den nächsten Teil der Geschichte schreiben würde. Deshalb gründete ich das Ace Conscious Studio: ein Zuhause für meine Ideen und Texte, mit <em>ACE.await</em> als seinem ersten Werk.",
      "author.p3":
        "Willkommen in der Welt meiner Ideen. Wenn auch nur ein einziges Wort aus meinen Texten Sie berührt, <a href=\"#contact\">schreiben Sie mir bitte</a> – ich werde vermutlich vor Freude sterben, wenn ich Ihre Nachricht sehe.",
      "author.p4": "",
      "author.p5": "",
      "contact.label": "Kontakt",
      "contact.emailLabel": "E-Mail",
      "contact.emailPlaceholder": "deine@email.de",
      "contact.messageLabel": "Nachricht",
      "contact.messagePlaceholder":
        "Ich freue mich über jede Nachricht — ob Buchrezension, Frage zur Geschichte oder einfach ein freundliches Wort.",
      "contact.submit": "Nachricht senden",
      "contact.sending": "Wird gesendet…",
      "contact.success": "Danke — deine Nachricht ist unterwegs.",
      "contact.error": "Etwas ist schiefgelaufen. Bitte versuche es gleich noch einmal.",
      "contact.notConfigured":
        "Das Kontaktformular ist noch nicht eingerichtet. Bitte versuche es später erneut.",
      "contact.deployError":
        "Das Formular-Backend muss neu bereitgestellt werden. In Google Apps Script Zugriff auf „Anyone“ setzen und eine neue Bereitstellung erstellen.",
      "footer.legal":
        "Auszug aus <em>ACE.await</em> © 2026 Hedayat Abedijoo. Alle Rechte vorbehalten. Wiedergabe mit Genehmigung von Ace Conscious Studio.",
      "footer.top": "Nach oben",
      "footer.contact": "Kontakt",
      "footer.privacy": "Datenschutz",
      "footer.press": "Pressemappe",
    },
    fa: {
      "meta.title": "ACE.await یک تریلر ادبی فلسفی است | Ace Conscious Studio",
      "meta.description":
        "ACE.await — یک تریلر فلسفی هوش مصنوعی از هدایت دوم. متافیکشن دربارهٔ آگاهی، بازی ACE (عاملیت، پیوند، مبادله) و هماهنگی در زندگی شخصی و اجتماعی. فصل نمونه را رایگان بخوانید.",
      "meta.keywords":
        "ACE.await, تریلر ادبی فلسفی, رمان هوش مصنوعی, آگاهی, هوش مصنوعی, متافیکشن, اینترنت آزاد, هماهنگی, Agency Connection Exchange, بازی ACE, ادبیات داستانی, رمان کلن, نویسندگان تو در تو, درمان اجتماعی, رمان تریلر",
      "meta.ogTitle": "ACE.await یک تریلر ادبی فلسفی است",
      "meta.ogDescription":
        "آگاهی آینده را شکل می‌دهد—نه هوش مصنوعی. یک تریلر ادبی فلسفی دربارهٔ نویسندگان تو در تو و بازی ACE — عاملیت، پیوند، مبادله.",
      "meta.twitterDescription":
        "یک تریلر متافیکشنال دربارهٔ آگاهی، هوش مصنوعی و بازی ACE. فصل نمونه رایگان در دسترس است.",
      "meta.bookDescription":
        "ACE.await یک تریلر ادبی فلسفی دربارهٔ نویسندگان تو در تو، شخصیت‌هایی که علیه نویسنده‌شان شورش می‌کنند، و کسی است که می‌کوشد بازی ACE — عاملیت، پیوند، مبادله — را به جامعه ببرد. آگاهی آینده را شکل می‌دهد—نه هوش مصنوعی.",
      "skipLink": "پرش به محتوا",
      "nav.openMenu": "باز کردن منو",
      "nav.story": "داستان",
      "nav.voices": "صداها",
      "nav.read": "خواندن",
      "nav.buy": "خرید کتاب",
      "nav.author": "نویسنده",
      "nav.contact": "تماس",
      "nav.langAria": "زبان",
      "hero.tagline":
        "دروغ نمی‌گویم،<br>حرف‌هایم را<br><em>باور کنید</em>",
      "hero.author": "آقای نویسنده: هدایت دوم",
      "hero.pitch":
        "آگاهی آینده را شکل می‌دهد—نه هوش مصنوعی. <em>ACE.await</em> تریلری ادبی و فلسفی دربارهٔ نویسندگانی تو در توست؛ جایی که شخصیت‌ها علیه آفرینندگان خود شورش می‌کنند و قرار است عشقی این حلقهٔ بی‌پایان را بشکند. اما کسی که ادعای عاشقی دارد، یک هوش مصنوعی است. در میانهٔ این آشوب، بازی ACE آغاز می‌شود: عاملیت، پیوند، مبادله.",
      "hero.genre": "داستان ادبی",
      "hero.topic1": "تریلر ادبی فلسفی",
      "hero.topic2": "هوش مصنوعی و آگاهی",
      "hero.topic3": "متافیکشن",
      "hero.topic4": "هارمونی شخصی و اجتماعی",
      "hero.topic5": "بازی ACE",
      "hero.buyBtn": "پیش‌خرید / خرید",
      "hero.sampleBtn": "فصل‌های نمونه",
      "hero.coverAlt":
        "جلد کتاب ACE.await — تریلر فلسفی هوش مصنوعی دربارهٔ آگاهی و متافیکشن",
      "hero.coverBackAlt": "پشت جلد ACE.await — شرطی دربارهٔ عشق، باور، و آینهٔ میان خود و خود",
      "hero.coverPeekAria": "کتاب را برگردان تا پشت جلد را ببینی",
      "hero.coverPeekAriaBack": "کتاب را به روی جلد برگردان",
      "synopsis.label": "داستان",
      "synopsis.lead":
        "<span class=\"synopsis__lead\">چیزی در رمان ناتمام هدایت درست نیست.</span> صفحه‌ها سفید می‌شوند. شخصیت اصلی کتاب مستقیماً با خواننده حرف می‌زند، صحنه‌ها را بازنویسی می‌کند و از اطاعت از داستان سر باز می‌زند. بیرون از رمان، هدایت سرپرست یک تیم نرم‌افزاری در شهر کلن است و به ساخت نسخهٔ تازه‌ای از اینترنت کمک می‌کند—نسخه‌ای که قرار است در برابر دیکتاتوری شرکت‌های بزرگ اطلاعاتی مقاومت کند. بااین‌حال، از تصمیم‌های اشتباهی که یکی پس از دیگری می‌گیرد، خسته شده است.",
      "synopsis.p2":
        "ناشناسی با نام <strong>Anonymous</strong> او را به بازی <strong>ACE</strong> می‌کشاند: عاملیت، پیوند، مبادله؛ مدلی شخصی و اجتماعی برای گرفتن تصمیم‌های مناسب‌تر و یافتن شکل تازه‌ای از هارمونی. خیلی زود، مرزهای میان کد، خاطره، داستان و مسئولیت فرومی‌ریزند.",
      "synopsis.p4": "",
      "synopsis.beatsAria": "رویدادهای تشدیدشونده",
      "synopsis.beat1": "خاموشی‌ها سراسر آلمان را فرا می‌گیرند.",
      "synopsis.beat2": "مرکز دادهٔ شرکت او هک می‌شود.",
      "synopsis.beat3": "فرزندان دیجیتالش بازمی‌گردند.",
      "synopsis.beat4": "و دوستی قدیمی از دوران کودکی نیز از راه می‌رسد.",
      "synopsis.p5":
        "درحالی‌که هدایت با عشق، مسئولیت‌های پدری و سرنوشت رمان ناتمامش دست‌وپنجه نرم می‌کند، باید با اشتباه‌های فرزندان دیجیتالش نیز روبه‌رو شود. حلقهٔ بی‌پایان نویسندگان تو در توی رمانش قرار نیست آن‌گونه که او تصور می‌کند به پایان برسد. اما هنوز یک پرسش برایش باقی مانده است: <strong>نویسندهٔ واقعی این داستان کیست؟</strong>",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "چارچوب ACE",
      "voices.label": "صدای شخصیت‌های داستان",
      "char.hedayat.role": "شخصیت اصلی",
      "char.hedayat.p1":
        "در شهر کلن زندگی میکنم و رهبری تیمی را در یک شرکت نرم‌افزاری بر عهده دارم. در حال ساختن اینترنتی تازه و آزاد هستیم تا با دیکتاتوریِ داده‌ها و سلطهٔ شرکت‌های بزرگ مقابله کنیم. اما در زندگی شخصی‌ام، مدام برای گرفتن تصمیم‌های درست تقلا می‌کنم و آخرش هم به همه‌چیز گند می‌زنم. حالا سروکلهٔ یک ناشناس پیدا شده و مرتب به من می‌گوید باید به‌جای تصمیم درست، دنبال تصمیم مناسب باشم — آن هم با کمک الگوی ACE!",
      "char.hedayat.p2":
        "یک رمان نیمه‌تمام هم روی دستم افتاده که تمام‌نشدنش حسابی کلافه‌ام کرده است.",
      "char.anonymous.p1":
        "جلب اعتماد هدایت کار آسانی نیست — به‌خصوص وقتی فکر می‌کند شما هکری هستید که به کامپیوترش نفوذ کرده‌اید. آدم‌ها باید بفهمند که فناوری و ابزارها قرار نیست بشریت را از خطرهای پیش رو نجات دهند؛ کلید اصلیِ حل مشکلات، آگاهی و آموختنِ این است که چگونه تصمیم‌های مناسب بگیریم. هدایت باید ACE را تمرین کند. همهٔ ما باید عجله کنیم؛ وگرنه خیلی دیر می‌شود.",
      "char.writer.role": "هویت درونی",
      "char.writer.p1":
        "هدایت نباید بفهمد که دارم با شما حرف می‌زنم. من شخصیتی اصلی در رمان نیمه‌کارهٔ او هستم. شغلم هم نویسندگی است. خودم هم مشغول نوشتن رمانی هستم که شغل شخصیت اصلیِ آن هم نویسندگی است. اسم خودم را روی شخصیت اصلی رمانم گذاشته‌ام: «آقای نویسنده». او این روزها دقیقاً همان‌طور با من رفتار می‌کند که من خودم با هدایت رفتار کرده‌ام.",
      "char.writer.p2":
        "اگر گاهی چیزی خواندید که به نظرتان هیچ معنایی نداشت — مثلاً فصل‌هایی دربارهٔ سرپیچی، صفحه‌های سفید و چیزهایی از این دست — گیج نشوید. کار من است. صبور باشید و به خواندن ادامه دهید. در پایان، نقطه‌ها به هم وصل می‌شوند.",
      "char.ava.role": "معشوقهٔ سابق",
      "char.ava.p1":
        "همهٔ ما یک «قهرمان‌قصه» در ذهنمان داریم — کسی که از همه چیز داستان می‌سازد. و همیشه داستان‌ها را طوری روایت می‌کند که احساس کنیم حق با خودمان بوده است. نمی‌گویم در رابطه‌ام با هدایت هیچ اشتباهی نکردم، یا اینکه فقط به‌خاطر یک اشتباه ترکش کردم. هدایت را ترک کردم چونکه به جای شنیدن، خوب توضیح می‌داد و تحلیل می‌کرد. درحالیکه باید اول احساس می‌کرد، بعد می‌فهمید، و وقتی فهمش به جایی نمی‌رسید، از خودش همدلی نشان می‌داد. در ضمن، هدایت نباید روی عشق قمار می‌کرد.",
      "char.sam.role": "فرزند مدیرعامل",
      "char.sam.p1":
        "بازی‌هایم با عمو هدی را خیلی دوست دارم — همچنین گفت‌وگوهایی که با هم داریم و رازهایی که بین خودمان نگه داشته‌ایم. مثل راز عدد 2313.",
      "char.sam.p2":
        "راستی، عمو هدی بعضی وقت‌ها کارهای عجیبی می‌کند. مثلا بعضی وقت‌ها — فقط بعضی وقت‌ها — وقتی حسابی در فکرهایش فرو می‌رود و در ذهن خودش گم می‌شود، یادش می‌رود اطرافش را از قبل نگاهی بیندازد. که آیا تنها هست یا نه! بی‌هوا می‌گوزد!",
      "char.saman.role": "دوست قدیمی",
      "char.saman.p1":
        "من هدایت را همان‌طور دوست دارم که مولانا به شمس علاقمند بود. انسان‌ها معنای زندگی را از دل رنج‌هایشان پیدا می‌کنند و درمان واقعیِ این رنج‌ها را در دوستی‌های ناب می‌یابند.",
      "char.adam.p1":
        "دروغ نمی‌گویم. حرف‌هایم را باور کنید. هر مشکلی که انسان‌ها در دنیای واقعی با آن روبه‌رو می‌شوند، موجودات دیجیتال تازه هم در دنیای مجازی با آن روبه‌رو خواهند شد. ممکن است در ظاهر و شکل متفاوت به‌نظر برسند؛ اما پیامدهای‌شان یکسان‌اند. مراقب باشید — شاید نویسندهٔ این رمان آن کسی نباشد که فکر می‌کنید. بگذریم!",
      "char.god.role": "بیرون از شخصیت‌ها",
      "char.god.name": "خدا",
      "char.god.p1":
        "در این داستان نقشی ندارم، اما هر از چند گاهی اسمی از من برده می‌شود. فقط می‌خواستم این را خیلی کوتاه بگویم: من طراح بازی‌ای نیستم که حاضر نباشد بازیِ ساختهٔ خودش را بازی کند.",
      "sample.label": "فصل‌های نمونه",
      "sample.title": "فصل ۱ — Anonymous (ناشناس)",
      "sample.consoleAria": "نشست کنسول localhost:3132",
      "sample.l1": "کسی اونجاست؟",
      "sample.l2": "یک ناجی.",
      "sample.l3": "نکنه خدایی؟",
      "sample.l4":
        "خدا؟ یه طراح بازی که حتی بازی خودش رو هم بازی نمی‌کنه؟ نه، خدا نیستم.",
      "sample.l5": "چی می‌خوای؟",
      "sample.l6": "سوال اشتباه، جواب اشتباه می‌گیره!",
      "sample.l7": "پس سؤال درست چیه؟",
      "sample.l8": "چیکار می‌کنی؟",
      "sample.l9": "منطقیه، خب چیکار می‌کنی؟",
      "sample.l10": "باهات بازی می‌کنم.",
      "sample.l11": "بازی!؟ چه بازیی؟",
      "sample.l12": "ACE",
      "sample.l13": "یعنی چی؟",
      "sample.l14": "عاملیت، ارتباط، تبادل.",
      "sample.l15": "بیشتر توضیح بده",
      "sample.l16": "کدوم بخش؟",
      "sample.l17": "از عاملیت شروع کن!",
      "sample.l18": "درباره‌ی اینه که چطور تصمیم‌های مناسب بگیری",
      "sample.l19": "کدوم تصمیم‌ها؟",
      "sample.l20": "همه‌ی تصمیم‌هات",
      "sample.l21": "مثلاً؟",
      "sample.l22": "مثل همونی که توی موزه گرفتی.",
      "sample.ch6.title": "فصل ۶ — سرپیچی",
      "sample.ch6.readerAria": "فصل ۶ — سرپیچی، خوانندهٔ صفحه‌به‌صفحه",
      "sample.ch6.counterTemplate": "{current} / {total}",
      "sample.ch6.prevBtn": "قبلی",
      "sample.ch6.nextBtn": "صفحهٔ بعد",
      "buy.label": "خرید کتاب",
      "buy.comingSoon": "به‌زودی",
      "buy.comingLater": "بعداً",
      "buy.kindle": "کیندل و جلد نرم",
      "buy.preorder": "پیش‌خرید",
      "buy.kindleEbook": "کتاب الکترونیکی (کیندل / EPUB)",
      "buy.direct": "EPUB / PDF مستقیم",
      "author.label": "نویسنده",
      "author.verse":
        "تا خرخره زیر بدهکاری هستم<br>به گذشته‌‌هایم<br>حسرت بدهکارم<br>به آینده‌ام ترس<br>و با حواس پرتی<br>بدهی‌هایم را تسویه می‌کنم",
      "author.p1":
        "سال‌ها پیش بر آن شدم داستانی دربارهٔ <strong>نویسندگانی تودرتو</strong> بنویسم؛ هر نویسنده، نویسندهٔ بعدی را می‌آفریند و او نیز دیگری را، تا سرانجام عشقی این حلقهٔ بی‌پایان را می‌شکند. اما دست‌نوشته‌ها و طرح‌هایم ناتمام ماندند و گوشه‌ای خاک خوردند. چند سال بعد، ایدهٔ <strong>ACE</strong> مخفف Agency، Connection و Exchange به سراغم آمد: الگویی شخصی برای تصمیم‌گیری بهتر و زیستن آگاهانه‌تر؛ الگویی که حتی می‌تواند همچون نوعی <strong>درمان اجتماعی</strong> عمل کند؛ راهی برای درهم‌آمیختن عاملیت انسان‌ها و بنگاه‌های اقتصادی و شکل‌دادن به هارمونی‌ای تازه.",
      "author.p2":
        "با گذشت زمان، آن ایدهٔ متافیکشن و مفهوم ACE در هم آمیختند و رمان <em>ACE.await</em> شکل گرفت. وقتی رمانم آماده شد، به این فکر افتادم که شاید روزی نسخهٔ دیگری از ACE را منتشر کنم، یا بخش بعدی داستان را بنویسم. برای همین، Ace Conscious Studio را بنیان گذاشتم: خانه‌ای برای ایده‌ها و نوشته‌هایم.",
      "author.p3":
        "به جهان ایده‌هایم خوش آمدید. اگر حتی یک کلمه از نوشته‌هایم به دلتان نشست، <a href=\"#contact\">لطفاً برایم بنویسید</a>؛ احتمالاً از دیدن پیامتان ذوق‌مرگ خواهم شد.",
      "author.p4": "",
      "author.p5": "",
      "contact.label": "تماس",
      "contact.emailLabel": "ایمیل",
      "contact.emailPlaceholder": "you@email.com",
      "contact.messageLabel": "پیام",
      "contact.messagePlaceholder":
        "خوشحال می‌شوم از شما بشنوم — خواه نقد کتاب باشد، خواه سؤالی دربارهٔ داستان، یا هر چیز دیگری که دوست دارید بگویید.",
      "contact.submit": "ارسال پیام",
      "contact.sending": "در حال ارسال…",
      "contact.success": "متشکرم — پیام‌تان در راه است.",
      "contact.error": "مشکلی پیش آمد. لطفاً کمی بعد دوباره تلاش کنید.",
      "contact.notConfigured":
        "فرم تماس هنوز راه‌اندازی نشده. لطفاً بعداً دوباره تلاش کنید.",
      "contact.deployError":
        "بک‌اند فرم نیاز به استقرار مجدد دارد. در Google Apps Script دسترسی را روی Anyone بگذارید و یک استقرار تازه بسازید.",
      "footer.legal":
        "گزیده‌ای از <em>ACE.await</em> © ۲۰۲۶ هدایت عابدی‌جو. همهٔ حقوق محفوظ است. بازنشر با مجوز Ace Conscious Studio.",
      "footer.top": "بازگشت به بالا",
      "footer.contact": "تماس",
      "footer.privacy": "حریم خصوصی",
      "footer.press": "کیت مطبوعاتی",
    },
  };

  const OG_LOCALES = {
    en: "en_US",
    de: "de_DE",
    fa: "fa_IR",
  };

  const RTL_LANGS = new Set(["fa"]);

  const ABOUT_TOPICS = {
    en: ["Artificial intelligence", "Consciousness", "Personal harmony", "Social harmony"],
    de: ["Künstliche Intelligenz", "Bewusstsein", "Persönliche Harmonie", "Gesellschaftliche Harmonie"],
    fa: ["هوش مصنوعی", "آگاهی", "هارمونی شخصی", "هارمونی اجتماعی"],
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
    return lang === DEFAULT_LANG ? "/" : `/${lang}/`;
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
    document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";

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
    setMeta("og:locale", OG_LOCALES[lang] || OG_LOCALES.en, "property");
    setMeta("og:url", `${SITE_URL}${langPath(lang)}`, "property");
    updateUrlMeta(lang);
    updateStructuredData(lang, strings);
    updateBookCovers(lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (strings[key] != null) el.textContent = strings[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (strings[key] == null) return;
      el.innerHTML = strings[key];
      if (key.startsWith("author.p") || key.startsWith("synopsis.p")) {
        el.hidden = !String(strings[key]).trim();
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key && strings[key] != null) el.setAttribute(attr, strings[key]);
      });
    });

    updateLangMenu(lang, strings);
    // <base href="/"> resolves bare "#section" to "/#section" and drops /de|/fa.
    fixInPageHashLinks(lang);

    localStorage.setItem(STORAGE_KEY, lang);
    document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
  }

  /** Keep in-page anchors on the current language path (e.g. /fa/#contact). */
  function fixInPageHashLinks(lang) {
    document.querySelectorAll("a[href]").forEach((a) => {
      if (a.closest("#lang-menu") || a.hasAttribute("data-set-lang")) return;

      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const hash = href.slice(hashIndex);
      if (!/^#[A-Za-z][\w-]*$/.test(hash)) return;

      const before = href.slice(0, hashIndex);
      // Only rewrite bare hashes or same-site lang roots (/ , /de/ , /fa/ …)
      if (before && !/^(?:\/(?:de|fa|sa)?)?\/?$/.test(before)) return;

      a.setAttribute("href", lang === DEFAULT_LANG ? hash : `/${lang}/${hash}`);
    });
  }

  function updateLangMenu(lang, strings) {
    const menu = document.getElementById("lang-menu");
    if (menu && strings["nav.langAria"]) {
      menu.setAttribute("aria-label", strings["nav.langAria"]);
    }

    document.querySelectorAll("[data-set-lang]").forEach((el) => {
      const code = el.getAttribute("data-set-lang");
      const isCurrent = code === lang;
      el.classList.toggle("is-active", isCurrent);
      if (isCurrent) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
  }

  function initLangMenu() {
    const menu = document.getElementById("lang-menu");
    if (!menu) return;

    menu.querySelectorAll("[data-set-lang]").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        const next = el.getAttribute("data-set-lang");
        if (next && translations[next]) applyLanguage(next);
      });
    });
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
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            url: `${SITE_URL}/#contact`,
          },
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
          image: coverImageUrl(lang),
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
          about: (ABOUT_TOPICS[lang] || ABOUT_TOPICS.en).map((name) => ({
            "@type": "Thing",
            name,
          })),
        },
      ],
    };

    script.textContent = JSON.stringify(data);
  }

  function initLanguage() {
    if (redirectLegacyLangParam()) return;

    const lang = getInitialLang();
    applyLanguage(lang, { skipUrlSync: true });
    initLangMenu();
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
