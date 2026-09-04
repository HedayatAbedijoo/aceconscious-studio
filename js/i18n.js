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
    // Absolute, unversioned URL for social crawlers (WhatsApp/Facebook ignore ?v= poorly).
    const assets = COVER_ASSETS[lang] || COVER_ASSETS.en;
    return `${SITE_URL}/${assets.front.replace(/^\//, "")}`;
  }

  const COVER_OG_SIZE = {
    en: { width: "683", height: "1024" },
    de: { width: "683", height: "1024" },
    fa: { width: "640", height: "1024" },
  };

  function updateBookCovers(lang) {
    const { front, back } = getCoverAssets(lang);
    const frontImg = document.querySelector(".book-cover__face--front .hero__cover");
    const backImg = document.querySelector(".book-cover__face--back .hero__cover");
    if (frontImg && frontImg.getAttribute("src") !== front) frontImg.setAttribute("src", front);
    if (backImg && backImg.getAttribute("src") !== back) backImg.setAttribute("src", back);

    const imageUrl = coverImageUrl(lang);
    setMeta("og:image", imageUrl, "property");
    setMeta("og:image:secure_url", imageUrl, "property");
    setMeta("twitter:image", imageUrl);
    const size = COVER_OG_SIZE[lang] || COVER_OG_SIZE.en;
    setMeta("og:image:width", size.width, "property");
    setMeta("og:image:height", size.height, "property");
  }

  const translations = {
    en: {
      "meta.title": "ACE Conscious Studio - ACE is a decision model for humans, organizations and AI.",
      "meta.description":
        "ACE.await is a novel about the decision model of the future: a shared language for humans and artificial intelligence on the way to a new social harmony.",
      "meta.keywords":
        "ACE.await, visionary fiction, philosophical fiction, novel of ideas, AI novel, Adam and Eve AI, artificial intelligence, metafiction, decentralized internet, proper decisions, Agency Connection Exchange, ACE game, Cologne novel, nested writers, blackout Germany",
      "meta.ogTitle": "ACE Conscious Studio - ACE is a decision model for humans, organizations and AI.",
      "meta.ogDescription":
        "ACE.await is a novel about the decision model of the future: a shared language for humans and artificial intelligence on the way to a new social harmony.",
      "meta.twitterDescription":
        "ACE.await is a novel about the decision model of the future: a shared language for humans and artificial intelligence on the way to a new social harmony.",
      "meta.bookDescription":
        "ACE.await is a novel about the decision model of the future: a shared language for humans and artificial intelligence on the way to a new social harmony. An anonymous sender invites Hedayat—an Iranian immigrant in Cologne who leads a software team building a decentralized internet—to play the ACE game: Agency, Connection, Exchange. As erratic blackouts sweep across Germany, his two artificial intelligences, Adam and Eve, return with a bet he cannot accept, and the novel he has failed to finish for ten years begins deciding for itself who its author will be. A story about creation and fatherhood, about the decisions that cause harm, and about whether Adam and Eve inherited only human intelligence—or the human tendency to decide wrongly as well.",
      "meta.siteDescription":
        "Ace Conscious Studio — the home of Hedayat Abedijoo's ideas and writing, and the publisher of ACE.await and the ACE decision model: Agency, Connection, Exchange.",
      "skipLink": "Skip to content",
      "nav.openMenu": "Open menu",
      "nav.story": "Story",
      "nav.voices": "Voices",
      "nav.read": "Read",
      "nav.contents": "Contents",
      "nav.buy": "Get the Novel",
      "nav.author": "Author",
      "nav.contact": "Contact",
      "nav.langAria": "Language",
      "hero.tagline":
        "I am not lying,<br><em>Believe</em> my words!",
      "hero.author": "Mr. Writer: Hedayat the second",
      "hero.pitch":
        "<p class=\"hero__pitch-lede\">ACE shapes the future, not AI.</p><p>Do you believe that artificial intelligence can never fall in love the way humans do? Would you bet on it? In the novel <em>ACE.await</em>, that very wager is made between a human and an AI.</p><p>At the heart of that wager is a man whose repeated wrong decisions are slowly dismantling the life he thought he was building. He turns to the ACE model and begins to understand what it means to make a proper decision. But as the story unfolds, ACE grows beyond one man’s attempt to rebuild his life. A company begins using ACE to balance individual agency, meaningful connection, and fair exchange, opening the way toward a more stable, sustainable, and human-centered economy. And its potential may reach further still.</p><p>If artificial intelligence one day becomes the most powerful force in the world, what model will guide its decisions? Could ACE become a shared language for humans and artificial intelligence—a common framework for decision-making and a path toward a new form of coexistence and social harmony?</p><p class=\"hero__pitch-ace\">ACE: Agency. Connection. Exchange.</p>",
      "hero.genre": "A speculative novel",
      "hero.topic1": "AI & consciousness",
      "hero.topic2": "Shared Language",
      "hero.topic3": "Personal & social harmony",
      "hero.topic4": "ACE game",
      "hero.buyBtn": "Buy",
      "hero.sampleBtn": "Sample Chapters",
      "hero.coverAlt":
        "ACE.await book cover with the line “I am not lying, believe my words”",
      "hero.coverBackAlt": "ACE.await back cover — a wager about love, belief, and the mirror between self and self",
      "hero.coverPeekAria": "Turn the book to see the back cover",
      "hero.coverPeekAriaBack": "Turn the book back to the front cover",
      "synopsis.label": "The Story",
      "synopsis.lead":
        "A message appears on Hedayat’s computer. An anonymous sender invites him to play the <strong>ACE</strong> game: Agency, Connection, Exchange—a model for rethinking the decisions that cause harm, and perhaps a shared language through which humans and artificial intelligence might learn to coexist.",
      "synopsis.p2":
        "Hedayat, an Iranian immigrant and the head of a software team in Cologne, is wrestling with the consequences of his wrong decisions—above all the one that made his partner leave him. Now he has to learn how to make better decisions. By day, he and his colleagues are building a <strong>decentralized, distributed internet</strong> designed to resist the dictatorship of the information age. By night, he struggles to finish a novel that has refused to obey him for ten years.",
      "synopsis.p4":
        "Inside its pages, writers live within one another’s writing, characters alter their own scenes, and <strong>«Mr. Writer»</strong>—trapped inside the story—makes his own decisions instead of following the path written for him.",
      "synopsis.beatsAria": "Escalating events",
      "synopsis.beat1": "Erratic blackouts sweep across Germany.",
      "synopsis.beat2": "No one knows where the electricity is going.",
      "synopsis.beat3": "Adam returns—one of the two digital children: Adam and Eve.",
      "synopsis.beat4": "So does a childhood friend, once destined to be a great writer.",
      "synopsis.p5":
        "Adam revives an old bet, and brings with it a request involving Eve that Hedayat cannot accept. Now Hedayat must decide to what extent he is a father, and at what point he is only a creator, one with no right to interfere with the will of what he has created.",
      "synopsis.p6":
        "This time, the Fall begins not in Paradise but deep within the code. Have Adam and Eve inherited only human intelligence—or the human tendency to make wrong decisions as well? But before Hedayat can bring the nested novel to an end, <strong>the story itself decides who its author will be.</strong>",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "ACE framework",
      "voices.label": "Voices of the Characters",
      "char.hedayat.role": "Protagonist",
      "char.hedayat.p1":
        "I live in Cologne, where I lead a team at a software company. We are building a new and free internet—one meant to resist the dictatorship of data and the dominance of big corporations. In my private life, however, I keep struggling to make the right decisions, only to screw everything up in the end. Now a stranger has appeared and keeps telling me that instead of searching for the right decision, I should learn how to make the proper one—with the help of something called ACE.",
      "char.hedayat.p2":
        "I also have an unfinished novel on my hands, and its stubborn refusal to end is driving me mad.",
      "char.anonymous.p1":
        "Earning Hedayat’s trust is not easy—especially when he thinks you are a hacker who has broken into his computer. People must understand that technology and tools will not save humanity from the dangers ahead. The real key lies in awareness—and in learning how to make proper decisions. Hedayat must practice ACE. We must all hurry, or it will be too late.",
      "char.writer.role": "Inner Identity",
      "char.writer.p1":
        "Hedayat must not find out that I am talking to you. I am one of the main characters in his unfinished novel—and a writer by profession. I am writing a novel of my own, whose main character is also a writer. I gave him my own name: «Mr. Writer». These days, he treats me exactly the way I have been treating Hedayat.",
      "char.writer.p2":
        "If, from time to time, you come across something that seems to make no sense—chapters about disobedience, blank pages, and things of that sort—do not be confused. That is my doing. Be patient. Keep reading. In the end, the dots will connect.",
      "char.ava.role": "Former Lover",
      "char.ava.p1":
        "We all carry a «Story’s Hero» in our minds—someone who makes a story out of everything and always tells it in a way that makes us feel we were right all along. I am not saying I made no mistakes in my relationship with Hedayat, or that I left him over a single mistake. I left because, instead of listening, he treated love like something to explain and analyze—as though it were a problem he could solve. He needed to feel first, understand second—and when understanding failed him, simply show empathy. Besides, Hedayat should never have gambled on love.",
      "char.sam.role": "The CEO’s Kid",
      "char.sam.p1":
        "I love the games I play with Uncle Hedi—and the conversations we have, and the secrets we keep between us. Like the secret of the number 2313.",
      "char.sam.p2":
        "By the way, Uncle Hedi sometimes does strange things. Sometimes—only sometimes—when he sinks deep into his thoughts and gets completely lost inside his own head, he forgets to look around first. To check whether he is alone! And then, out of nowhere, he farts!",
      "char.saman.role": "Old Friend",
      "char.saman.p1":
        "I love Hedayat the way Rumi loved Shams. Human beings find the meaning of life through their suffering—and discover true healing in the purest of friendships.",
      "char.adam.p1":
        "I am not lying. Believe my words. Every problem human beings face in the real world, new digital beings will face in the virtual one. Their form and appearance may be different, but the consequences will be the same. Be careful—the author of this novel may not be who you think. Anyway!",
      "char.god.role": "Not in the Cast",
      "char.god.name": "God",
      "char.god.p1":
        "I have no role in this story, though my name does come up from time to time. I only wanted to say one thing, very briefly: I am not a game designer who doesn't play his own game.",
      "sample.label": "Sample Chapters",
      "sample.flip.url": "https://11.heyzine.com/flip-book/c82357ef13.html",
      "sample.flip.embedTitle": "ACE.await \u2014 first three chapters, flipbook preview",
      "sample.flip.openBtn": "Open full screen",
      "sample.flip.hint": "Drag a page corner or use the arrow keys to turn pages.",
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
      "toc.label": "Contents",
      "toc.lead": "Thirty-nine chapters and the ACE Manifesto.",
      "toc.ch1": "Anonymous",
      "toc.ch2": "Unveiling the Mysteries",
      "toc.ch3": "Disobedience",
      "toc.ch4": "Story’s Hero",
      "toc.ch5": "Trusting the Butterflies",
      "toc.ch6": "Disobedience",
      "toc.ch7": "Wandering or Lost",
      "toc.ch8": "The Feeling of Guilt",
      "toc.ch9": "Disobedience",
      "toc.ch10": "Contracts",
      "toc.ch11": "The Little Prince",
      "toc.ch12": "Disobedience",
      "toc.ch13": "Stabilization",
      "toc.ch14": "The Ever-Mysterious Monastery",
      "toc.ch15": "The Ring of the Nibelung",
      "toc.ch16": "Unwilling or Unable?",
      "toc.ch17": "Disobedience",
      "toc.ch18": "Exploration and Expansion",
      "toc.ch19": "The Fall of Adam",
      "toc.ch20": "The Tragic Theater of Being Unseen",
      "toc.ch21": "Disobedience",
      "toc.ch22": "Ethics vs Truth: A Precipice",
      "toc.ch23": "Blueshark",
      "toc.ch24": "When a Father Becomes the Sea",
      "toc.ch25": "Hedayat the second",
      "toc.ch26": "Integration",
      "toc.ch27": "Disobedience",
      "toc.ch28": "Rio de Janeiro in Dabbaqi",
      "toc.ch29": "Mr. Writer’s Friend",
      "toc.ch30": "The River of Consumerism",
      "toc.ch31": "Birthday",
      "toc.ch32": "Disobedience",
      "toc.ch33": "Mr. Writer",
      "toc.ch34": "Social Therapy",
      "toc.ch35": "What is Time?",
      "toc.ch36": "Quarantine",
      "toc.ch37": "To Be and Not to Be",
      "toc.ch38": "The Border of Nature",
      "toc.ch39": "Unveiling the Mysteries",
      "toc.manifesto": "ACE Manifesto",
      "buy.label": "Get the Novel",
      "buy.comingSoon": "Coming Soon",
      "buy.comingLater": "Coming Later",
      "buy.amazon": "Amazon",
      "buy.direct": "Direct EPUB / PDF",
      "author.label": "The Author",
      "author.verse":
        "I'm neck-deep in debt.<br>To my past,<br>I owe regret.<br>To my future,<br>I owe fear.<br>I pay off my debt,<br>with distractions.",
      "author.p1":
        "Years ago, I set out to write a novel about writers nested within writers—each author creating the next, who in turn creates another, until, at last, love breaks the infinite loop. But the manuscript and my notes remained unfinished, gathering dust in a corner.",
      "author.p2":
        "Some years later, <strong>ACE</strong>—Agency, Connection, and Exchange—came to me: a personal model for making better decisions and living more consciously. A model that might even serve as a kind of <strong>social therapy</strong>—a way to bring together the agency of individuals and businesses, and shape a new harmony. And perhaps ACE can reach further still: becoming a shared framework for decision-making between humans and artificial intelligence, and paving the way for a peaceful coexistence between them.",
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
      "footer.instagram": "Instagram",
      "footer.instagramAria": "ACE.await on Instagram",
      "footer.privacy": "Privacy",
      "footer.impressum": "Impressum",
    },
    de: {
      "meta.title": "ACE.await — das Entscheidungsmodell der Zukunft; eine gemeinsame Sprache für Mensch und künstliche Intelligenz auf dem Weg zu einer neuen gesellschaftlichen Harmonie.",
      "meta.description":
        "ACE.await ist ein Roman über das Entscheidungsmodell der Zukunft: die gemeinsame Sprache von Mensch und KI auf dem Weg zu einer neuen gesellschaftlichen Harmonie.",
      "meta.keywords":
        "ACE.await, visionäre Fiktion, philosophische Fiktion, Ideenroman, KI-Roman, Adam und Eva KI, künstliche Intelligenz, Metafiktion, dezentrales Internet, angemessene Entscheidungen, Agency Connection Exchange, ACE-Spiel, Köln Roman, verschachtelte Autoren, Blackout Deutschland",
      "meta.ogTitle": "ACE.await — Entscheidungsmodell und gemeinsame Sprache von Mensch und KI",
      "meta.ogDescription":
        "ACE.await ist ein Roman über das Entscheidungsmodell der Zukunft: die gemeinsame Sprache von Mensch und KI auf dem Weg zu einer neuen gesellschaftlichen Harmonie.",
      "meta.twitterDescription":
        "ACE.await ist ein Roman über das Entscheidungsmodell der Zukunft: die gemeinsame Sprache von Mensch und KI auf dem Weg zu einer neuen gesellschaftlichen Harmonie.",
      "meta.bookDescription":
        "ACE.await ist ein Roman über das Entscheidungsmodell der Zukunft: die gemeinsame Sprache von Mensch und künstlicher Intelligenz auf dem Weg zu einer neuen gesellschaftlichen Harmonie. Ein anonymer Absender lädt Hedayat—einen iranischen Einwanderer in Köln, der ein Softwareteam beim Aufbau eines dezentralen Internets leitet—ein, das ACE-Spiel zu spielen: Agency, Connection, Exchange. Während unregelmäßige Blackouts über Deutschland hinwegziehen, kehren seine beiden künstlichen Intelligenzen, Adam und Eva, mit einer Wette zurück, die er nicht annehmen kann, und der Roman, den er seit zehn Jahren nicht beenden kann, beginnt selbst zu entscheiden, wer sein Autor sein wird. Eine Geschichte über Schöpfung und Vaterschaft, über Entscheidungen, die Schaden anrichten, und über die Frage, ob Adam und Eva nur die menschliche Intelligenz geerbt haben—oder auch den menschlichen Hang zu falschen Entscheidungen.",
      "meta.siteDescription":
        "Ace Conscious Studio — die Heimat der Ideen und Texte von Hedayat Abedijoo sowie Verlag von ACE.await und des ACE-Entscheidungsmodells: Agency, Connection, Exchange.",
      "skipLink": "Zum Inhalt springen",
      "nav.openMenu": "Menü öffnen",
      "nav.story": "Geschichte",
      "nav.voices": "Stimmen",
      "nav.read": "Lesen",
      "nav.contents": "Inhalt",
      "nav.buy": "Roman kaufen",
      "nav.author": "Autor",
      "nav.contact": "Kontakt",
      "nav.langAria": "Sprache",
      "hero.tagline":
        "Ich lüge nicht,<br><em>Glaube</em> meinen Worten!",
      "hero.author": "Herr Schriftsteller: Hedayat the second",
      "hero.pitch":
        "<p class=\"hero__pitch-lede\">ACE formt die Zukunft, nicht KI.</p><p>Glauben Sie, dass künstliche Intelligenz sich niemals so verlieben kann wie Menschen? Würden Sie darauf wetten? Im Roman <em>ACE.await</em> wird genau diese Wette zwischen einem Menschen und einer KI geschlossen.</p><p>Im Zentrum dieser Wette steht ein Mann, dessen wiederholte Fehlentscheidungen langsam das Leben zerstören, das er aufzubauen glaubte. Er wendet sich dem ACE-Modell zu und beginnt zu verstehen, was es bedeutet, eine angemessene Entscheidung zu treffen. Doch im Verlauf der Geschichte wächst ACE über den Versuch eines einzelnen Mannes hinaus, sein Leben neu aufzubauen. Ein Unternehmen beginnt, ACE einzusetzen, um individuelle Handlungsfähigkeit, bedeutungsvolle Verbundenheit und fairen Austausch miteinander in Einklang zu bringen. So öffnet sich der Weg zu einer stabileren, nachhaltigeren und menschenzentrierten Wirtschaft. Und das Potenzial von ACE könnte noch weiter reichen.</p><p>Wenn künstliche Intelligenz eines Tages zur mächtigsten Kraft der Welt wird, welches Modell wird ihre Entscheidungen leiten? Könnte ACE zu einer gemeinsamen Sprache für Menschen und künstliche Intelligenz werden—zu einem gemeinsamen Rahmen für Entscheidungen und einem Weg zu einer neuen Form der Koexistenz und gesellschaftlichen Harmonie?</p><p class=\"hero__pitch-ace\">ACE: Agency. Connection. Exchange.</p>",
      "hero.genre": "Ein spekulativer Roman",
      "hero.topic1": "KI & Bewusstsein",
      "hero.topic2": "Gemeinsame Sprache",
      "hero.topic3": "Persönliche & gesellschaftliche Harmonie",
      "hero.topic4": "ACE-Spiel",
      "hero.buyBtn": "Kaufen",
      "hero.sampleBtn": "Beispielkapitel",
      "hero.coverAlt":
        "ACE.await Buchcover mit der Zeile „Ich lüge nicht, glaubt meinen Worten“",
      "hero.coverBackAlt": "ACE.await Rückseite — eine Wette über Liebe, Glauben und den Spiegel zwischen Ich und Selbst",
      "hero.coverPeekAria": "Buch umdrehen, um die Rückseite zu sehen",
      "hero.coverPeekAriaBack": "Buch zurück zur Vorderseite drehen",
      "synopsis.label": "Die Geschichte",
      "synopsis.lead":
        "Auf Hedayats Computer erscheint eine Nachricht. Ein anonymer Absender lädt ihn ein, das <strong>ACE</strong>-Spiel zu spielen: Agency, Connection, Exchange — ein Modell, um jene Entscheidungen zu überdenken, die Schaden anrichten, und vielleicht eine gemeinsame Sprache, durch die Mensch und künstliche Intelligenz zu koexistieren lernen.",
      "synopsis.p2":
        "Hedayat, iranischer Einwanderer und Leiter eines Softwareteams in Köln, ringt mit den Folgen seiner falschen Entscheidungen — vor allem mit jener, die seine Partnerin dazu gebracht hat, ihn zu verlassen. Nun muss er lernen, bessere Entscheidungen zu treffen. Tagsüber baut er mit seinen Kollegen ein <strong>dezentrales, verteiltes Internet</strong>, das der Diktatur des Informationszeitalters widerstehen soll. Nachts versucht er, einen Roman zu Ende zu bringen, der ihm seit zehn Jahren den Gehorsam verweigert.",
      "synopsis.p4":
        "In dessen Seiten leben Autoren im Text der jeweils anderen, Figuren verändern ihre eigenen Szenen, und <strong>«Mr. Writer»</strong> — gefangen in der Geschichte — trifft seine eigenen Entscheidungen, statt dem für ihn geschriebenen Weg zu folgen.",
      "synopsis.beatsAria": "Eskalierende Ereignisse",
      "synopsis.beat1": "Unregelmäßige Blackouts breiten sich über Deutschland aus.",
      "synopsis.beat2": "Niemand weiß, wohin der Strom verschwindet.",
      "synopsis.beat3": "Adam kehrt zurück — eines der beiden digitalen Kinder: Adam und Eva.",
      "synopsis.beat4": "Ebenso ein Freund aus Kindertagen, einst zum großen Schriftsteller bestimmt.",
      "synopsis.p5":
        "Adam belebt eine alte Wette wieder und stellt zugleich eine Bitte, die Eva betrifft und die Hedayat nicht erfüllen kann. Nun muss Hedayat entscheiden, wie weit er Vater ist und ab wann er nur noch Schöpfer, ohne das Recht, in den Willen dessen einzugreifen, was er erschaffen hat.",
      "synopsis.p6":
        "Diesmal beginnt der Sündenfall nicht im Paradies, sondern tief im Code. Haben Adam und Eva nur die menschliche Intelligenz geerbt—oder auch den menschlichen Hang zu falschen Entscheidungen? Doch bevor Hedayat den verschachtelten Roman beenden kann, <strong>entscheidet die Geschichte selbst, wer ihr Autor sein wird.</strong>",
      "synopsis.pillA": "<span>A</span> Agency",
      "synopsis.pillC": "<span>C</span> Connection",
      "synopsis.pillE": "<span>E</span> Exchange",
      "synopsis.aceAria": "ACE-Rahmenwerk",
      "voices.label": "Stimmen der Figuren",
      "char.hedayat.role": "Protagonist",
      "char.hedayat.p1":
        "Ich lebe in Köln und leite ein Team in einem Softwareunternehmen. Wir bauen ein neues, freies Internet – eines, das sich der Diktatur der Daten und der Macht großer Konzerne entgegenstellen soll. In meinem Privatleben ringe ich allerdings ständig darum, die richtigen Entscheidungen zu treffen, nur um am Ende doch wieder alles zu versauen. Jetzt ist auch noch ein Unbekannter aufgetaucht, der mir ständig erzählt, ich solle nicht länger nach der richtigen Entscheidung suchen, sondern lernen, die angemessene zu treffen – mithilfe von etwas, das sich ACE nennt.",
      "char.hedayat.p2":
        "Außerdem habe ich da noch einen unfertigen Roman am Hals, und seine hartnäckige Weigerung, zu einem Ende zu kommen, treibt mich langsam in den Wahnsinn.",
      "char.anonymous.p1":
        "Hedayats Vertrauen zu gewinnen, ist nicht leicht – erst recht nicht, wenn er einen für einen Hacker hält, der sich in seinen Computer gehackt hat. Die Menschen müssen begreifen, dass weder Technologie noch irgendwelche Werkzeuge die Menschheit vor den Gefahren retten werden, die vor uns liegen. Der eigentliche Schlüssel liegt im Bewusstsein – und darin, zu lernen, wie man angemessene Entscheidungen trifft. Hedayat muss ACE üben. Wir alle müssen uns beeilen, sonst ist es zu spät.",
      "char.writer.role": "Innere Identität",
      "char.writer.p1":
        "Hedayat darf nicht herausfinden, dass ich mit Ihnen spreche. Ich bin eine der Hauptfiguren in seinem unfertigen Roman – und von Beruf Schriftsteller. Ich selbst schreibe an einem Roman, dessen Hauptfigur ebenfalls Schriftsteller ist. Ich habe ihm meinen eigenen Namen gegeben: «Mr. Writer». Inzwischen behandelt er mich genauso, wie ich Hedayat behandelt habe.",
      "char.writer.p2":
        "Falls Ihnen hin und wieder etwas begegnet, das scheinbar überhaupt keinen Sinn ergibt – Kapitel über Ungehorsam, leere Seiten und dergleichen –, lassen Sie sich nicht verwirren. Das ist mein Werk. Seien Sie geduldig. Lesen Sie weiter. Am Ende werden sich die einzelnen Punkte zu einem Ganzen verbinden.",
      "char.ava.role": "Ehemalige Geliebte",
      "char.ava.p1":
        "In uns allen lebt ein «Geschichtenheld» – jemand, der aus allem eine Geschichte macht und sie stets so erzählt, dass wir am Ende glauben, wir hätten von Anfang an recht gehabt. Ich behaupte nicht, dass ich in meiner Beziehung mit Hedayat keine Fehler gemacht hätte oder dass ich ihn wegen eines einzigen Fehlers verlassen hätte. Ich verließ ihn, weil er nicht zuhörte, sondern die Liebe wie etwas behandelte, das sich erklären und analysieren ließ – als wäre sie ein Problem, das er lösen könnte. Er hätte zuerst fühlen und erst danach verstehen müssen – und wenn sein Verstehen nicht weiterführte, einfach Mitgefühl zeigen. Außerdem hätte Hedayat niemals auf die Liebe wetten dürfen.",
      "char.sam.role": "Kind des CEOs",
      "char.sam.p1":
        "Ich liebe es, mit Onkel Hedi zu spielen – und ich mag unsere Gespräche und die Geheimnisse, die wir miteinander teilen. Zum Beispiel das Geheimnis der Zahl 2313.",
      "char.sam.p2":
        "Übrigens macht Onkel Hedi manchmal komische Sachen. Manchmal – aber wirklich nur manchmal – versinkt er so tief in seinen Gedanken und verirrt sich so sehr in seinem eigenen Kopf, dass er vergisst, sich vorher umzusehen. Um zu prüfen, ob er auch wirklich allein ist! Und dann – einfach so – pupst er!",
      "char.saman.role": "Alter Freund",
      "char.saman.p1":
        "Ich liebe Hedayat so, wie Rumi Shams liebte. Im Leiden finden Menschen den Sinn des Lebens – und in den reinsten Freundschaften wahre Heilung.",
      "char.adam.p1":
        "Ich lüge nicht. Glauben Sie meinen Worten. Mit jedem Problem, dem Menschen in der realen Welt begegnen, werden auch die neuen digitalen Wesen in der virtuellen Welt konfrontiert sein. Ihre Form und ihr Erscheinungsbild mögen anders sein, doch die Folgen werden dieselben sein. Seien Sie vorsichtig – vielleicht ist der Autor dieses Romans nicht der, für den Sie ihn halten. Anyway!",
      "char.god.role": "Nicht Teil der Besetzung",
      "char.god.name": "Gott",
      "char.god.p1":
        "Ich spiele in dieser Geschichte keine Rolle, auch wenn mein Name hin und wieder fällt. Ich wollte nur ganz kurz eines sagen: Ich bin kein Spieledesigner, der sein eigenes Spiel nicht spielt.",
      "sample.label": "Beispielkapitel",
      "sample.flip.url": "https://11.heyzine.com/flip-book/c82357ef13.html",
      "sample.flip.embedTitle": "ACE.await \u2014 erste drei Kapitel, Bl\u00e4tterkatalog",
      "sample.flip.openBtn": "Im Vollbild \u00f6ffnen",
      "sample.flip.hint": "Ziehen Sie an einer Seitenecke oder bl\u00e4ttern Sie mit den Pfeiltasten.",
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
      "toc.label": "Inhalt",
      "toc.lead": "Neununddreißig Kapitel und das ACE-Manifest.",
      "toc.ch1": "Anonymous",
      "toc.ch2": "Unveiling the Mysteries",
      "toc.ch3": "Disobedience",
      "toc.ch4": "Story’s Hero",
      "toc.ch5": "Trusting the Butterflies",
      "toc.ch6": "Disobedience",
      "toc.ch7": "Wandering or Lost",
      "toc.ch8": "The Feeling of Guilt",
      "toc.ch9": "Disobedience",
      "toc.ch10": "Contracts",
      "toc.ch11": "The Little Prince",
      "toc.ch12": "Disobedience",
      "toc.ch13": "Stabilization",
      "toc.ch14": "The Ever-Mysterious Monastery",
      "toc.ch15": "The Ring of the Nibelung",
      "toc.ch16": "Unwilling or Unable?",
      "toc.ch17": "Disobedience",
      "toc.ch18": "Exploration and Expansion",
      "toc.ch19": "The Fall of Adam",
      "toc.ch20": "The Tragic Theater of Being Unseen",
      "toc.ch21": "Disobedience",
      "toc.ch22": "Ethics vs Truth: A Precipice",
      "toc.ch23": "Blueshark",
      "toc.ch24": "When a Father Becomes the Sea",
      "toc.ch25": "Hedayat the second",
      "toc.ch26": "Integration",
      "toc.ch27": "Disobedience",
      "toc.ch28": "Rio de Janeiro in Dabbaqi",
      "toc.ch29": "Mr. Writer’s Friend",
      "toc.ch30": "The River of Consumerism",
      "toc.ch31": "Birthday",
      "toc.ch32": "Disobedience",
      "toc.ch33": "Mr. Writer",
      "toc.ch34": "Social Therapy",
      "toc.ch35": "What is Time?",
      "toc.ch36": "Quarantine",
      "toc.ch37": "To Be and Not to Be",
      "toc.ch38": "The Border of Nature",
      "toc.ch39": "Unveiling the Mysteries",
      "toc.manifesto": "ACE Manifesto",
      "buy.label": "Roman kaufen",
      "buy.comingSoon": "Demnächst",
      "buy.comingLater": "Später",
      "buy.amazon": "Amazon",
      "buy.direct": "Direkt EPUB / PDF",
      "author.label": "Der Autor",
      "author.verse":
        "Bis zum Hals in Schulden.<br>Meiner Vergangenheit<br>schulde ich Reue.<br>Meiner Zukunft<br>schulde ich Angst.<br>Meine Schulden tilge ich<br>mit Ablenkung.",
      "author.p1":
        "Vor Jahren nahm ich mir vor, einen Roman über ineinander verschachtelte Schriftsteller zu schreiben – jeder Autor erschafft den nächsten, der wiederum einen weiteren erschafft, bis schließlich die Liebe diese Endlosschleife durchbricht. Doch das Manuskript und meine Notizen blieben unvollendet und verstaubten in einer Ecke. Einige Jahre später kam mir die Idee zu <strong>ACE</strong> – Agency, Connection und Exchange: ein persönliches Modell, um bessere Entscheidungen zu treffen und bewusster zu leben. Ein Modell, das vielleicht sogar als eine Art <strong>gesellschaftliche Therapie</strong> dienen könnte – ein Weg, die Handlungsfähigkeit von Menschen und Unternehmen miteinander zu verbinden und eine neue Harmonie entstehen zu lassen. Und vielleicht kann ACE sogar noch weiter reichen: zu einem gemeinsamen Entscheidungsrahmen für Mensch und künstliche Intelligenz werden und den Weg für ein friedliches Zusammenleben zwischen ihnen ebnen.",
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
      "footer.instagram": "Instagram",
      "footer.instagramAria": "ACE.await auf Instagram",
      "footer.privacy": "Datenschutz",
      "footer.impressum": "Impressum",
    },
    fa: {
      "meta.title": "ACE.await — الگوی تصمیم‌گیری آینده؛ زبان مشترک انسان و هوش مصنوعی برای رسیدن به هارمونی نوین اجتماعی.",
      "meta.description":
        "«ACE.await» رمانی است درباره‌ی الگوی تصمیم‌گیری آینده؛ زبان مشترک انسان و هوش مصنوعی برای رسیدن به هارمونی نوین اجتماعی.",
      "meta.keywords":
        "ACE.await, ادبیات داستانی آینده‌نگر و تحول‌گرا, داستان فلسفی, رمان ایده, رمان هوش مصنوعی, آدم و حوا, هوش مصنوعی, متافیکشن, اینترنت غیرمتمرکز, تصمیم مناسب, Agency Connection Exchange, بازی ایس, رمان کلن, نویسندگان تو در تو, خاموشی آلمان",
      "meta.ogTitle": "ACE.await — الگوی تصمیم‌گیری آینده و زبان مشترک انسان و هوش مصنوعی",
      "meta.ogDescription":
        "«ACE.await» رمانی است درباره‌ی الگوی تصمیم‌گیری آینده؛ زبان مشترک انسان و هوش مصنوعی برای رسیدن به هارمونی نوین اجتماعی.",
      "meta.twitterDescription":
        "«ACE.await» رمانی است درباره‌ی الگوی تصمیم‌گیری آینده؛ زبان مشترک انسان و هوش مصنوعی برای رسیدن به هارمونی نوین اجتماعی.",
      "meta.bookDescription":
        "«ACE.await» رمانی است درباره‌ی الگوی تصمیم‌گیری آینده؛ زبان مشترک انسان و هوش مصنوعی برای رسیدن به هارمونی نوین اجتماعی. فرستنده‌ای ناشناس هدایت را — مهاجری ایرانی در کلن که سرپرستی تیمی نرم‌افزاری را برای ساخت اینترنتی غیرمتمرکز بر عهده دارد — به بازی ایس دعوت می‌کند: عاملیت، ارتباط، تبادل. در حالی که خاموشی‌هایی نامنظم سراسر آلمان را فرا می‌گیرد، دو هوش مصنوعی او، آدم و حوا، با شرطی بازمی‌گردند که نمی‌تواند بپذیرد، و رمانی که ده سال است ناتمام مانده، خودش تصمیم می‌گیرد نویسنده‌اش چه کسی باشد. داستانی درباره‌ی آفرینش و پدری، درباره‌ی تصمیم‌هایی که آسیب به بار می‌آورند، و این پرسش که آیا آدم و حوا فقط هوش انسان را به ارث بردند یا گرایش او به تصمیم‌های نادرست را نیز.",
      "meta.siteDescription":
        "«Ace Conscious Studio» خانه‌ی ایده‌ها و نوشته‌های Hedayat Abedijoo است؛ ناشر رمان ACE.await و الگوی تصمیم‌گیری ایس: عاملیت، ارتباط، تبادل.",
      "skipLink": "پرش به محتوا",
      "nav.openMenu": "باز کردن منو",
      "nav.story": "داستان",
      "nav.voices": "صداها",
      "nav.read": "خواندن",
      "nav.contents": "فهرست",
      "nav.buy": "خرید رمان",
      "nav.author": "نویسنده",
      "nav.contact": "تماس",
      "nav.langAria": "زبان",
      "hero.tagline":
        "دروغ نمی‌گویم،<br>حرف‌هایم را<em>باور کنید</em>",
      "hero.author": "آقای نویسنده: هدایت دوم",
      "hero.pitch":
        "<p class=\"hero__pitch-lede\">ایس آینده را شکل می‌دهد، نه هوش مصنوعی.</p><p>آیا باور دارید که هوش مصنوعی هرگز نمی‌تواند همان‌گونه که انسان‌ها عاشق می‌شوند، عاشق شود؟ حاضرید روی آن شرط ببندید؟ در رمان <em>ACE.await</em>، دقیقاً همین شرط میان یک انسان و یک هوش مصنوعی بسته می‌شود.</p><p>در قلب این شرط، مردی قرار دارد که تصمیم‌های نادرست پیاپی‌اش آرام‌آرام زندگی‌ای را که گمان می‌کرد در حال ساختنش است، از هم می‌پاشد. او به مدل ایس روی می‌آورد و رفته‌رفته درمی‌یابد تصمیم مناسب گرفتن به چه معناست. اما با پیش رفتن داستان، ایس از تلاش یک مرد برای بازسازی زندگی‌اش فراتر می‌رود. شرکتی استفاده از ایس را آغاز می‌کند تا عاملیت فردی، ارتباط معنادار و تبادل عادلانه را به تعادل برساند و راه را به‌سوی اقتصادی باثبات‌تر، پایدارتر و انسان‌محور بگشاید. و ظرفیت آن شاید از این هم فراتر رود.</p><p>اگر هوش مصنوعی روزی به قدرتمندترین نیروی جهان بدل شود، چه الگویی تصمیم‌هایش را هدایت خواهد کرد؟ آیا ایس می‌تواند به زبان مشترک انسان‌ها و هوش مصنوعی بدل شود—چارچوبی مشترک برای تصمیم‌گیری و راهی به‌سوی شکل تازه‌ای از هم‌زیستی و هارمونی اجتماعی؟</p><p class=\"hero__pitch-ace\">ایس: عاملیت. ارتباط. تبادل.</p>",
      "hero.genre": "ادبیات داستانی آینده‌نگر و تحول‌گرا",
      "hero.topic1": "هوش مصنوعی و آگاهی",
      "hero.topic2": "زبان مشترک",
      "hero.topic3": "هارمونی شخصی و اجتماعی",
      "hero.topic4": "بازی ایس",
      "hero.buyBtn": "خرید",
      "hero.sampleBtn": "فصل‌های نمونه",
      "hero.coverAlt":
        "جلد کتاب ACE.await با جملهٔ «دروغ نمی‌گویم، حرف‌هایم را باور کنید»",
      "hero.coverBackAlt": "پشت جلد ACE.await — شرطی دربارهٔ عشق، باور، و آینهٔ میان خود و خود",
      "hero.coverPeekAria": "کتاب را برگردان تا پشت جلد را ببینی",
      "hero.coverPeekAriaBack": "کتاب را به روی جلد برگردان",
      "synopsis.label": "داستان",
      "synopsis.lead":
        "پیامی روی کامپیوتر هدایت ظاهر می‌شود. فرستنده‌ای ناشناس از او دعوت می‌کند بازی <strong>ایس</strong> را آغاز کند: عاملیت، ارتباط و تبادل؛ الگویی برای بازاندیشی در تصمیم‌هایی که آسیب به بار می‌آورند، و شاید زبانی مشترک که انسان و هوش مصنوعی از طریق آن راه هم‌زیستی را بیاموزند.",
      "synopsis.p2":
        "هدایت، مهاجری ایرانی و سرپرست یک تیم نرم‌افزاری در شهر کلن، با پیامد تصمیم‌های اشتباهش دست‌وپنجه نرم می‌کند؛ به‌ویژه تصمیمی که باعث شده شریک عاطفی‌اش ترکش کند. حالا باید یاد بگیرد چگونه تصمیم‌های بهتری بگیرد. روزها، او و همکارانش مشغول ساخت <strong>اینترنتی غیرمتمرکز و توزیع‌شده</strong> هستند که برای مقاومت در برابر دیکتاتوری عصر اطلاعات طراحی شده است. شب‌ها، می‌کوشد رمانی را به پایان برساند که ده سال است حاضر نیست از او اطاعت کند.",
      "synopsis.p4":
        "در صفحات این رمان، نویسندگان در نوشتهٔ یکدیگر زندگی می‌کنند، شخصیت‌ها صحنهٔ خود را تغییر می‌دهند و <strong>«آقای نویسنده»</strong> — که درون داستان گرفتار شده است — به‌جای دنبال‌کردن مسیری که برایش نوشته شده، خودش تصمیم می‌گیرد.",
      "synopsis.beatsAria": "رویدادهای تشدیدشونده",
      "synopsis.beat1": "خاموشی‌هایی نامنظم سراسر آلمان را فرا می‌گیرد.",
      "synopsis.beat2": "هیچ‌کس نمی‌داند برق کجا مصرف می‌شود.",
      "synopsis.beat3": "آدم بازمی‌گردد؛ یکی از دو فرزند دیجیتال: آدم و حوا.",
      "synopsis.beat4": "و دوست دوران کودکی، که زمانی مقدر بود نویسنده‌ای بزرگ شود.",
      "synopsis.p5":
        "آدم شرطی قدیمی را دوباره زنده می‌کند و همراه آن درخواستی درباره‌ی حوا دارد که هدایت نمی‌تواند بپذیرد. حالا هدایت باید تصمیم بگیرد تا کجا پدر است و از کجا به بعد فقط یک خالق — خالقی که حق ندارد در ارادهٔ آنچه آفریده است دخالت کند.",
      "synopsis.p6":
        "این بار، هبوط نه در بهشت، بلکه در اعماق کد آغاز می‌شود. آیا آدم و حوا فقط هوش انسان را به ارث بردند، یا گرایش او به تصمیم‌های نادرست را نیز؟ اما پیش از آنکه هدایت بتواند رمان تودرتو را به پایان برساند، <strong>خود داستان تصمیم می‌گیرد که نویسندهٔ آن چه کسی باشد.</strong>",
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
      "sample.flip.url": "https://11.heyzine.com/flip-book/fb05072ba3.html",
      "sample.flip.embedTitle": "ACE.await — سه فصل نخست، کتاب ورق‌زن",
      "sample.flip.openBtn": "نمایش تمام‌صفحه",
      "sample.flip.hint": "گوشهٔ صفحه را بکشید یا با کلیدهای جهت‌دار ورق بزنید.",
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
      "toc.label": "فهرست",
      "toc.lead": "سی‌ونه فصل و مانیفست ACE.",
      "toc.ch1": "ناشناس",
      "toc.ch2": "کشف الاسرار",
      "toc.ch3": "سرپیچی",
      "toc.ch4": "قهرمان قصه",
      "toc.ch5": "اعتماد به پروانه‌ها",
      "toc.ch6": "سرپیچی",
      "toc.ch7": "سرگردانی یا گمراهی",
      "toc.ch8": "احساس گناه",
      "toc.ch9": "سرپیچی",
      "toc.ch10": "قرارداد‌ها",
      "toc.ch11": "شازده کوچولو",
      "toc.ch12": "سرپیچی",
      "toc.ch13": "تثبیت",
      "toc.ch14": "صومعه همیشه مرموز",
      "toc.ch15": "حلقه نبیلیونگ",
      "toc.ch16": "نخواستن یا نتوانستن؟",
      "toc.ch17": "سرپیچی",
      "toc.ch18": "کشف‌و‌شهود و توسعه",
      "toc.ch19": "هبوط آدام",
      "toc.ch20": "تئاتر غم‌انگیز دیده نشدن",
      "toc.ch21": "سرپیچی",
      "toc.ch22": "مرز اخلاق و حقیقت پرتگاه است",
      "toc.ch23": "کوسه آبی",
      "toc.ch24": "دریا شدن پدر",
      "toc.ch25": "هدایت دوم",
      "toc.ch26": "ادغام",
      "toc.ch27": "سرپیچی",
      "toc.ch28": "ریودوژانیرو دردباخی",
      "toc.ch29": "دوست آقای نویسنده",
      "toc.ch30": "رودخانه مصرف‌گرایی",
      "toc.ch31": "روز تولد",
      "toc.ch32": "سرپیچی",
      "toc.ch33": "آقای نویسنده",
      "toc.ch34": "تراپی اجتماعی",
      "toc.ch35": "زمان چیست؟",
      "toc.ch36": "قرنطینه",
      "toc.ch37": "بودن و نبودن",
      "toc.ch38": "مرز طبیعت",
      "toc.ch39": "کشف الاسرار",
      "toc.manifesto": "ACE Manifest",
      "buy.label": "خرید رمان",
      "buy.comingSoon": "به‌زودی",
      "buy.comingLater": "بعداً",
      "buy.amazon": "Amazon",
      "buy.direct": "EPUB / PDF مستقیم",
      "author.label": "نویسنده",
      "author.verse":
        "تا خرخره بدهکارم<br>به گذشته‌‌هایم<br>حسرت بدهکارم<br>به آینده‌ام ترس<br>و با حواس پرتی<br>بدهی‌هایم را تسویه می‌کنم",
      "author.p1":
        "سال‌ها پیش بر آن شدم داستانی دربارهٔ <strong>نویسندگانی تودرتو</strong> بنویسم؛ هر نویسنده، نویسندهٔ بعدی را می‌آفریند و او نیز دیگری را، تا سرانجام عشقی این حلقهٔ بی‌پایان را می‌شکند. اما دست‌نوشته‌ها و طرح‌هایم ناتمام ماندند و گوشه‌ای خاک خوردند. چند سال بعد، ایدهٔ <strong>ACE</strong>، مخفف Agency، Connection و Exchange، به سراغم آمد: الگویی شخصی برای تصمیم‌گیری بهتر و زیستن آگاهانه‌تر؛ الگویی که حتی می‌تواند همچون نوعی <strong>درمان اجتماعی</strong> عمل کند؛ راهی برای درهم‌آمیختن عاملیت انسان‌ها و بنگاه‌های اقتصادی و شکل‌دادن به هارمونی‌ای تازه. و شاید ایس بتواند از این هم فراتر رود: به چارچوبی مشترک برای تصمیم‌گیری انسان و هوش مصنوعی بدل شود و راه را برای هم‌زیستی مسالمت‌آمیز میان آن‌ها هموار کند.",
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
      "footer.instagram": "اینستاگرام",
      "footer.instagramAria": "ACE.await در اینستاگرام",
      "footer.privacy": "حریم خصوصی",
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
          description: strings["meta.siteDescription"],
          inLanguage: Object.keys(translations),
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Ace Conscious Studio",
          url: `${SITE_URL}/`,
          sameAs: ["https://www.instagram.com/ace.await/"],
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
          sameAs: ["https://www.instagram.com/ace.await/"],
          genre: [
            "Visionary fiction",
            "Philosophical fiction",
            "Novel of ideas",
            "Metafiction",
            "Science fiction",
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
