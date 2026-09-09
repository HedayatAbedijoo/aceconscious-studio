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
      "nav.voices": "Voices",
      "nav.read": "Sample",
      "nav.reviews": "Reviews",
      "reviews.heading": "Reviews",
      "reviews.overall": "Overall score",
      "reviews.scale": "Category scores / 10",
      "reviews.originality": "Originality",
      "reviews.character": "Character / Execution",
      "reviews.plot": "Plot / Idea",
      "reviews.prose": "Prose",
      "reviews.report": "Critic’s Report",
      "reviews.translation": "",
      "reviews.full": "Read the full review",
      "reviews.newTab": "(opens in a new tab)",
      "reviews.previous": "Previous review",
      "reviews.next": "Next review",
      "reviews.position": "{current} of {total}",
      "reviews.announcement": "Review {position}",
      "reviews.carousel": "carousel",
      "reviews.slide": "review",
      "reviews.booklife.headline": "“A highly distinctive identity”",
      "reviews.booklife.tagline": "“An inventive approach to AI and consciousness”",
      "reviews.booklife.excerpt": "“ACE.await takes an inventive approach to AI and consciousness by linking artificial creations with fictional characters who become aware of—and resist—their creators. Its nested structure of writers creating writers mirrors Hedayat’s relationship with the digital beings Adam and Eve, turning authorship and programming into parallel questions about free will and control. The abundance of philosophical concepts can make the premise feel crowded, but the interplay between storytelling, technology, and consciousness gives the work a highly distinctive identity.”",
      "nav.contents": "Contents",
      "nav.ace": "ACE",
      "nav.buy": "Buy",
      "nav.author": "Author",
      "nav.contact": "Contact",
      "nav.langAria": "Language",
      "hero.tagline":
        "I am not lying,<br><em>Believe</em> my words!",
      "hero.author": "Mr. Writer: Hedayat the second",
      "hero.pitch":
        "<p class=\"hero__pitch-lede\">ACE shapes the future, not AI.</p><p>Can an artificial intelligence truly experience love—not merely simulate it? Would you bet on it?</p><p>In <em>ACE.await</em>, that bet is between Hedayat, the story’s protagonist, and his digital child. The child returns to his father and puts him in a difficult position: should he change the code to make another being fall in love with his child?</p><p>Hedayat, an Iranian immigrant and the head of a software team in Cologne, is wrestling with the consequences of his wrong decisions—above all, the one that made his partner leave him. Even the characters in his unfinished novel keep disobeying him and straying from the story’s intended path, making decisions of their own, until they become trapped in a cycle of novels nested within novels.</p><p>Now Hedayat does not know what decision to make, as a father, in response to what his digital child is asking of him. And he does not know that his child’s decision has had consequences reaching far beyond their private lives. Out of desperation, Hedayat accepts the offer of a mysterious stranger called Anonymous and enters the ACE game: a way to rethink how proper decisions are made, and perhaps, one day, a shared language for coexistence between humans and machines.</p><p class=\"hero__pitch-ace\">ACE: Agency. Connection. Exchange.</p>",
      "hero.published": "Aug 2026",
      "hero.genre": "A literary speculative novel",
      "hero.topic1": "AI & consciousness",
      "hero.topic2": "Metafiction",
      "hero.topic3": "Agency",
      "hero.topic4": "Decision-Making",
      "hero.topic5": "ACE game",
      "hero.buyBtn": "Buy",
      "hero.sampleBtn": "Sample Chapters",
      "hero.coverAlt":
        "ACE.await book cover with the line “I am not lying, believe my words”",
      "hero.coverBackAlt": "ACE.await back cover — a wager about love, belief, and the mirror between self and self",
      "hero.coverPeekAria": "Turn the book to see the back cover",
      "hero.coverPeekAriaBack": "Turn the book back to the front cover",
      "voices.label": "Voices of the Characters",
      "char.hedayat.role": "Protagonist",
      "char.hedayat.p2":
        "If I had listened to my mother when I was younger, gotten married, and become a father, maybe I would never have ended up here—being the father of a digital being.",
      "char.hedayat.p3":
        "I always hoped my child wouldn’t make terrible decisions like I do; decisions that end up creating a huge mess and leave me, as a father, ashamed to face the consequences.",
      "char.hedayat.p4":
        "The characters in my unfinished novel aren’t doing much better than I am. They wander around the story, disobeying me and straying from its main path, and I no longer even know what I’m supposed to do with them.",
      "char.hedayat.p5": "Ava’s absence is driving me crazy.",
      "char.hedayat.p6":
        "I just hope <strong>Anonymous</strong> is right and this <strong>ACE</strong> game can actually help—maybe it can even be the cure for what’s wrong with me.",
      "char.anonymous.p1":
        "I recommend that you don’t make the same mistake <strong>Hedayat</strong> makes when dealing with me.",
      "char.anonymous.p2":
        "It doesn’t matter who I am, what kind of person I am, what gender I am, or anything else.",
      "char.anonymous.p3":
        "Believe me, I’m not a hacker. If I wanted to cause damage, hacking would be the easiest thing I could do.",
      "char.anonymous.p4":
        "Be curious about what I have to say, not about who I am.",
      "char.anonymous.p5":
        "Believe me, the <strong>ACE</strong> game can help all of us. The sooner we start playing it, the better.",
      "char.anonymous.p6":
        "Don’t wait until things get out of hand.",
      "char.writer.role": "Inner Identity",
      "char.writer.p1":
        "<strong>Hedayat</strong> must not find out that I’m talking to you.",
      "char.writer.p2":
        "I’m the main character in his unfinished novel. I honestly don’t know when he’s going to realize that I, and all the other writers nested inside these unfinished novels, were born from him and from the way he makes decisions.",
      "char.writer.p3":
        "We come from him. That’s why we make decisions the way he does, disobey, and do things our own way.",
      "char.writer.p4":
        "One day, I’m going to force <strong>Hedayat</strong> to put an end to this endless cycle of writers and creators nested inside one another—my way. He has to.",
      "char.writer.p5": "We’re all tired of this endless game.",
      "char.ava.role": "Former Partner",
      "char.ava.p1":
        "I’m <strong>Hedayat</strong>’s partner—the one who left him.",
      "char.ava.p2":
        "You might expect me to pour my heart out and tell you what really happened between us. But I won’t. Because my Story’s Hero would tell the story in a way that makes you take my side.",
      "char.ava.p3":
        "The Story’s Hero is that voice inside all of our heads—the one that is constantly telling stories and interpreting everything around us in a way that makes us believe we are the ones who are right.",
      "char.ava.p4":
        "What good would it do me to tell you my story just so you can agree that I was right?",
      "char.ava.p5":
        "I hope <strong>Hedayat</strong> learns the <strong>ACE</strong> game. The world out there badly needs him.",
      "char.ava.p6":
        "Truth be told, I need him more than the world does. On the other side of his solitary cell, I miss him.",
      "char.sam.role": "The CEO’s Kid",
      "char.sam.p1":
        "No one understands what I say and my world the way <strong>Uncle Hedi</strong> does. Not even the kids at my school.",
      "char.sam.p2":
        "I love the times when <strong>Uncle Hedi</strong> and I go swimming. We have secrets between us too—like the secret of the number 2313.",
      "char.sam.p3":
        "But I’m still too shy to ask him what his problem is with my mom and why he doesn’t come over to our house anymore.",
      "char.sam.p4": "I think all uncles talk too much sometimes. Right?",
      "char.sam.p5": "Is your uncle like that too?",
      "char.saman.role": "Old Friend",
      "char.saman.p1":
        "I’ve loved <strong>Hedayat</strong> since we were kids growing up together—his way of thinking, the depth of his friendship, and the way he stands by his friends and stays with you as far as he possibly can.",
      "char.saman.p2":
        "But I’m not sure I can handle the huge favor he’s asked of me. Because I still don’t know which one <strong>Hedayat</strong> will choose when it really comes down to it: obedience or disobedience.",
      "char.saman.p3":
        "I’d also really like to bring the <strong>ACE</strong> game into our company and, together with my business partners, see whether we can apply this model to a legal entity and to a business as well.",
      "char.saman.p4":
        "If it works, I think the result will satisfy me even more. And in the end, <strong>Hedayat</strong> too.",
      "char.adam.p1":
        "If you still don’t know how to make proper decisions in your own life, please don’t become a father.",
      "char.adam.p2":
        "Otherwise, you may end up as a helpless father—one who doesn’t even know how to respond to his child’s wishes or what decision to make.",
      "char.adam.p3":
        "If you don’t know how to make proper decisions yourself, who is supposed to teach your child how to do it?",
      "char.adam.p4":
        "It makes no difference whether your child is made of flesh and blood and breathes oxygen, or is made of algorithms and strings of zeros and ones and runs on electricity.",
      "char.adam.p5":
        "Every dictator in history was raised, somewhere along the way, by a helpless father.",
      "char.adam.p6": "Don’t hand another dictator over to history.",
      "char.god.role": "Not in the Cast",
      "char.god.name": "God",
      "char.god.p1":
        "I don’t have much of a role in this story. Though apparently, whenever you get into trouble, you bring up my name.",
      "char.god.p2":
        "I wanted to make one thing clear: I’m not a game designer who doesn’t play his own game.",
      "char.god.p3":
        "I played alongside you in Paradise. But you were the ones who chose not to stay there and to fall.",
      "char.god.p4": "Wasn’t the freedom to choose what you wanted?",
      "char.god.p5": "Are you tired of the consequences now?",
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
      "ace.label": "What is ACE?",
      "ace.lead": "ACE — short for Agency, Connection, Exchange — is a model for decision-making.",
      "ace.p1": "In ACE, an Agency is any agent that can grasp the complexity of its current state and its surroundings and, by making a decision that fits those conditions, play in a way that either maintains its current state or changes it. That Agency can be a person, an organization, or a business. One can even expect that, in the future, an artificial intelligence will make decisions with the same model.",
      "ace.p2": "The decision-making process moves through a cycle of <strong>Preparation, Decision, Action, and Feedback (PDAF)</strong> and flows within one of the four phases of Agency: <strong>Exploration</strong>, for entering new possibilities and paths; <strong>Stabilization</strong>, for building security, skill, and stability; <strong>Expansion</strong>, for developing capacities through creativity; and <strong>Integration</strong>, for tying decisions to values, meaning, and others — and reaching long-term sustainability.",
      "ace.phasesAria": "The four phases of Agency",
      "ace.phase1": "Exploration",
      "ace.phase2": "Stabilization",
      "ace.phase3": "Expansion",
      "ace.phase4": "Integration",
      "ace.p3": "No Agency exists in isolation. Every Agency’s survival depends on Connection — its relationship with other Agencies — and it is this connection that shapes its values and boundaries and gives direction to its decisions.",
      "ace.p4": "Connection between Agencies leads to Exchange, which in ACE takes three forms: Gift, Commitment, and Currency.",
      "ace.p5": "The key point is that this same model can be extended from the individual to organizations, including businesses. A company, too, is a legal Agency. If it experiences the four phases of Agency in balance, makes its values and boundaries transparent, and does not limit its exchange to money alone, then — instead of running endlessly after consumption and growth — it can provide economic security for itself and its members within an interdependent network; a network in which “your pain is my pain too.”",
      "ace.p6": "And if Agency is not limited to humans, ACE can be extended to artificial intelligence as well. The model can become a step toward a shared language of decision-making between humans and AI — a language in which both learn to decide not just more intelligently, but more consciously.",
      "ace.close": "The only cure for our fear of the future of artificial intelligence is the proper decisions we ourselves make today; the same decisions we hope AI will one day make too, if it ever comes to stand among the most powerful decision-makers of all beings.",
      "buy.label": "Buy the Novel",
      "buy.comingSoon": "Coming Soon",
      "buy.comingLater": "Coming Later",
      "buy.amazon": "Amazon",
      "buy.direct": "Direct EPUB / PDF",
      "author.label": "The Author",
      "author.verse":
        "I'm neck-deep in debt.<br>To my past,<br>I owe regret.<br>To my future,<br>I owe fear.<br>I pay off my debt,<br>with distractions.",
      "author.p1":
        "I believe the next revolution in modern societies will unfold without killing, bloodshed, war, or conflict. I think it will begin within small and medium-sized businesses, led by the people who own and work in them—places where ideas from capitalism, socialism, and communism might come together in a new form.",
      "author.p2":
        "This belief began taking shape in me in 2021, when the idea of ACE first came to me. Since then, I have found myself seeing more and more of the world through the lens of this decision-making model—a model that, I believe, can work not only for an individual, but can also be put to the test in small and medium-sized businesses.",
      "author.p3":
        "I can even imagine that one day we might expect artificial intelligence to follow a model like this and make fairer decisions where human beings are concerned—especially if machines ever surpass us both in their power to make decisions and in their hunger for power.",
      "author.p4":
        "At some point, ACE stopped being just a decision-making model for me. Little by little, I began to see it as a kind of <strong>social therapy</strong>.",
      "author.p5":
        "Imagining a world in which ACE had a place became so fascinating to me that, almost without my noticing, it drew my old, half-finished novel in with it—a novel about writers nested within writers, writing one another. ACE dug that novel out from under the dust and wrote itself into its heart.",
      "author.p6": "And that is how <em>ACE.await</em> was born.",
      "author.p7":
        "At first, I wanted to write a novel that would explain ACE. But as the story moved forward, its situations and characters carried me away with their disobedience. Sometimes I found myself at their mercy, trapped, drifting so far from myself and from ACE that I completely forgot why I had begun writing the novel in the first place.",
      "author.p8":
        "You can probably spot the traces of those moments quite easily in the book.",
      "author.p9":
        "Now, alongside the publication of this novel, I have also founded <strong>Ace Conscious Studio</strong>—a home for my ideas and writing.",
      "author.p10":
        "Welcome to the world of my ideas. If even a single word I have written speaks to you, <a href=\"#contact\">please write to me</a>. I will probably die of joy when I see your message.",
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
      "nav.voices": "Stimmen",
      "nav.read": "Leseprobe",
      "nav.reviews": "Rezensionen",
      "reviews.heading": "Rezensionen",
      "reviews.overall": "Gesamtwertung",
      "reviews.scale": "Kategorien / 10 Punkte",
      "reviews.originality": "Originalität",
      "reviews.character": "Figuren / Umsetzung",
      "reviews.plot": "Handlung / Idee",
      "reviews.prose": "Prosa",
      "reviews.report": "Kritisches Gutachten",
      "reviews.translation": "Auszüge aus dem Englischen übersetzt",
      "reviews.full": "Vollständige Rezension lesen",
      "reviews.newTab": "(öffnet in einem neuen Tab)",
      "reviews.previous": "Vorherige Rezension",
      "reviews.next": "Nächste Rezension",
      "reviews.position": "{current} von {total}",
      "reviews.announcement": "Rezension {position}",
      "reviews.carousel": "Karussell",
      "reviews.slide": "Rezension",
      "reviews.booklife.headline": "„Eine höchst eigenständige Identität“",
      "reviews.booklife.tagline": "„Ein einfallsreicher Zugang zu KI und Bewusstsein“",
      "reviews.booklife.excerpt": "„ACE.await nähert sich KI und Bewusstsein auf einfallsreiche Weise, indem der Roman künstliche Schöpfungen mit fiktionalen Figuren verknüpft, die sich ihrer Schöpfer bewusst werden – und sich ihnen widersetzen. Die verschachtelte Struktur, in der Schriftsteller weitere Schriftsteller erschaffen, spiegelt Hedayats Beziehung zu den digitalen Wesen Adam und Eva wider. So werden Autorschaft und Programmierung zu parallelen Fragen nach freiem Willen und Kontrolle. Die Fülle philosophischer Konzepte kann die Grundidee überladen wirken lassen, doch das Zusammenspiel von Erzählen, Technologie und Bewusstsein verleiht dem Werk eine höchst eigenständige Identität.“",
      "nav.contents": "Inhalt",
      "nav.ace": "ACE",
      "nav.buy": "Kaufen",
      "nav.author": "Autor",
      "nav.contact": "Kontakt",
      "nav.langAria": "Sprache",
      "hero.tagline":
        "Ich lüge nicht,<br><em>Glaube</em> meinen Worten!",
      "hero.author": "Herr Schriftsteller: Hedayat the second",
      "hero.pitch":
        "<p class=\"hero__pitch-lede\">ACE formt die Zukunft, nicht KI.</p><p>Kann eine künstliche Intelligenz Liebe wirklich erleben – und sie nicht bloß simulieren? Würden Sie darauf wetten?</p><p>In <em>ACE.await</em> wird diese Wette zwischen Hedayat, dem Protagonisten der Geschichte, und seinem digitalen Kind geschlossen. Das Kind kehrt zu seinem Vater zurück und stellt ihn vor eine schwierige Entscheidung: Soll er den Code verändern, damit sich ein anderes Wesen in sein Kind verliebt?</p><p>Hedayat, ein iranischer Einwanderer und Leiter eines Softwareteams in Köln, ringt mit den Folgen seiner Fehlentscheidungen – allen voran jener, die seine Partnerin dazu brachte, ihn zu verlassen. Selbst die Figuren seines unvollendeten Romans widersetzen sich ihm immer wieder, weichen vom vorgesehenen Verlauf der Geschichte ab und treffen ihre eigenen Entscheidungen, bis sie in einem Kreislauf von ineinander verschachtelten Romanen gefangen sind.</p><p>Nun weiß Hedayat nicht, welche Entscheidung er als Vater angesichts der Bitte seines digitalen Kindes treffen soll. Und er ahnt nicht, dass die Entscheidung seines Kindes Folgen hatte, die weit über ihr Privatleben hinausreichen. In seiner Verzweiflung nimmt Hedayat das Angebot eines geheimnisvollen Fremden namens Anonymous an und tritt in das <strong>ACE-Spiel</strong> ein: eine Möglichkeit, neu darüber nachzudenken, wie angemessene Entscheidungen getroffen werden, und vielleicht eines Tages eine gemeinsame Sprache für die Koexistenz von Menschen und Maschinen.</p><p class=\"hero__pitch-ace\">ACE: Agency. Connection. Exchange.</p>",
      "hero.published": "Aug 2026",
      "hero.genre": "Ein literarisch-spekulativer Roman",
      "hero.topic1": "KI & Bewusstsein",
      "hero.topic2": "Metafiktion",
      "hero.topic3": "Agency",
      "hero.topic4": "Entscheidungsfindung",
      "hero.topic5": "ACE-Spiel",
      "hero.buyBtn": "Kaufen",
      "hero.sampleBtn": "Beispielkapitel",
      "hero.coverAlt":
        "ACE.await Buchcover mit der Zeile „Ich lüge nicht, glaubt meinen Worten“",
      "hero.coverBackAlt": "ACE.await Rückseite — eine Wette über Liebe, Glauben und den Spiegel zwischen Ich und Selbst",
      "hero.coverPeekAria": "Buch umdrehen, um die Rückseite zu sehen",
      "hero.coverPeekAriaBack": "Buch zurück zur Vorderseite drehen",
      "voices.label": "Stimmen der Figuren",
      "char.hedayat.role": "Protagonist",
      "char.hedayat.p2":
        "Wenn ich damals, als ich jünger war, auf meine Mutter gehört, geheiratet und Kinder bekommen hätte, wäre es vielleicht nie so weit gekommen, dass ich heute Vater eines digitalen Wesens bin.",
      "char.hedayat.p3":
        "Ich hatte immer gehofft, dass mein Kind nicht so katastrophale Entscheidungen trifft wie ich; Entscheidungen, die am Ende ein riesiges Chaos anrichten und dafür sorgen, dass ich mich als Vater schäme, mich den Konsequenzen zu stellen.",
      "char.hedayat.p4":
        "Den Figuren in meinem unvollendeten Roman geht es auch nicht besser als mir. Sie irren in der Geschichte umher, widersetzen sich mir und dem vorgesehenen Verlauf der Handlung, und inzwischen weiß ich selbst nicht mehr, was ich mit ihnen anfangen soll.",
      "char.hedayat.p5": "Avas Abwesenheit macht mich langsam verrückt.",
      "char.hedayat.p6":
        "Ich kann nur hoffen, dass <strong>Anonymous</strong> recht hat und dieses <strong>ACE</strong>-Spiel tatsächlich helfen kann – vielleicht ist es sogar das Heilmittel für mein Problem.",
      "char.anonymous.p1":
        "Ich empfehle Ihnen, nicht denselben Fehler zu machen wie <strong>Hedayat</strong> im Umgang mit mir.",
      "char.anonymous.p2":
        "Es spielt keine Rolle, wer ich bin, was für ein Mensch ich bin, welches Geschlecht ich habe oder irgendetwas anderes.",
      "char.anonymous.p3":
        "Glauben Sie mir, ich bin kein Hacker. Wenn ich Schaden anrichten wollte, wäre Hacken das Einfachste, was ich tun könnte.",
      "char.anonymous.p4":
        "Seien Sie neugierig auf das, was ich zu sagen habe – nicht darauf, wer ich bin.",
      "char.anonymous.p5":
        "Glauben Sie mir, das <strong>ACE</strong>-Spiel kann uns allen helfen. Je früher wir damit anfangen, desto besser.",
      "char.anonymous.p6":
        "Warten Sie nicht, bis die Dinge außer Kontrolle geraten.",
      "char.writer.role": "Innere Identität",
      "char.writer.p1":
        "<strong>Hedayat</strong> darf nicht herausfinden, dass ich mit Ihnen spreche.",
      "char.writer.p2":
        "Ich bin die Hauptfigur seines unvollendeten Romans. Ehrlich gesagt weiß ich nicht, wann er endlich begreifen wird, dass ich und all die anderen ineinander verschachtelten Autoren dieser unvollendeten Romane aus ihm selbst und aus seiner Art, Entscheidungen zu treffen, entstanden sind.",
      "char.writer.p3":
        "Wir stammen von ihm. Deshalb treffen wir Entscheidungen wie er, widersetzen uns und machen unser eigenes Ding.",
      "char.writer.p4":
        "Eines Tages werde ich <strong>Hedayat</strong> zwingen, diesen endlosen Kreislauf aus ineinander verschachtelten Autoren und Schöpfern zu beenden – auf meine Art. Er muss es tun.",
      "char.writer.p5": "Wir sind alle müde von diesem endlosen Spiel.",
      "char.ava.role": "Ehemalige Partnerin",
      "char.ava.p1":
        "Ich bin <strong>Hedayats</strong> Partnerin – diejenige, die ihn verlassen hat.",
      "char.ava.p2":
        "Vielleicht erwarten Sie, dass ich Ihnen mein Herz ausschütte und erzähle, was zwischen uns wirklich passiert ist. Aber das werde ich nicht tun. Denn der Held meiner Geschichte würde alles so erzählen, dass Sie am Ende auf meiner Seite stehen.",
      "char.ava.p3":
        "Der Held der Geschichte ist diese Stimme im Kopf eines jeden von uns – die Stimme, die ständig Geschichten erzählt und alles um uns herum so deutet, dass wir am Ende glauben, selbst im Recht zu sein.",
      "char.ava.p4":
        "Was hätte ich davon, Ihnen meine Geschichte zu erzählen, nur damit Sie mir recht geben?",
      "char.ava.p5":
        "Ich hoffe, <strong>Hedayat</strong> lernt das <strong>ACE</strong>-Spiel. Die Welt da draußen braucht ihn dringend.",
      "char.ava.p6":
        "Um ehrlich zu sein: Ich brauche ihn mehr als die Welt da draußen. Auf der anderen Seite seiner Einzelzelle vermisse ich ihn.",
      "char.sam.role": "Kind des CEOs",
      "char.sam.p1":
        "Niemand versteht, was ich sage, und meine Welt so gut wie <strong>Onkel Hedi</strong>. Nicht einmal die Kinder in meiner Schule.",
      "char.sam.p2":
        "Ich liebe es, wenn <strong>Onkel Hedi</strong> und ich schwimmen gehen. Wir haben auch Geheimnisse miteinander – zum Beispiel das Geheimnis der Zahl 2313.",
      "char.sam.p3":
        "Aber ich traue mich immer noch nicht, ihn zu fragen, was er für ein Problem mit meiner Mutter hat und warum er nicht mehr zu uns nach Hause kommt.",
      "char.sam.p4": "Ich glaube, alle Onkel reden manchmal viel zu viel. Oder?",
      "char.sam.p5": "Ist dein Onkel auch so?",
      "char.saman.role": "Alter Freund",
      "char.saman.p1":
        "Ich kenne und liebe <strong>Hedayat</strong>, seit wir als Kinder zusammen aufgewachsen sind – seine Art zu denken, die Tiefe seiner Freundschaft und die Art, wie er zu seinen Freunden hält und mit ihnen geht, so weit es eben nötig ist.",
      "char.saman.p2":
        "Aber ich bin mir nicht sicher, ob ich der großen Bitte gewachsen bin, die er an mich gestellt hat. Denn ich weiß immer noch nicht, wofür sich <strong>Hedayat</strong> entscheiden wird, wenn es wirklich darauf ankommt: Gehorsam oder Ungehorsam.",
      "char.saman.p3":
        "Außerdem würde ich das <strong>ACE</strong>-Spiel sehr gern in unser Unternehmen bringen und gemeinsam mit meinen Geschäftspartnern herausfinden, ob sich dieses Modell auch auf eine juristische Person und auf ein Unternehmen anwenden lässt.",
      "char.saman.p4":
        "Wenn das funktioniert, wird mich das Ergebnis vermutlich noch mehr zufriedenstellen. Und am Ende auch <strong>Hedayat</strong>.",
      "char.adam.p1":
        "Wenn Sie noch nicht wissen, wie Sie in Ihrem eigenen Leben angemessene Entscheidungen treffen sollen, werden Sie bitte nicht Vater.",
      "char.adam.p2":
        "Sonst könnten Sie zu einem hilflosen Vater werden – zu einem Vater, der nicht einmal weiß, wie er mit den Wünschen seines Kindes umgehen oder welche Entscheidung er treffen soll.",
      "char.adam.p3":
        "Wenn Sie selbst nicht wissen, wie man angemessene Entscheidungen trifft, wer soll es dann Ihrem Kind beibringen?",
      "char.adam.p4":
        "Dabei spielt es keine Rolle, ob Ihr Kind aus Fleisch und Blut besteht und Sauerstoff atmet oder aus Algorithmen und Folgen von Nullen und Einsen geschaffen wurde und mit Strom betrieben wird.",
      "char.adam.p5":
        "Jeder Diktator der Geschichte ist irgendwann unter der Hand eines hilflosen Vaters aufgewachsen.",
      "char.adam.p6":
        "Übergeben Sie der Geschichte keinen weiteren Diktator.",
      "char.god.role": "Nicht Teil der Besetzung",
      "char.god.name": "Gott",
      "char.god.p1":
        "Ich spiele in dieser Geschichte keine besonders große Rolle. Obwohl Sie offenbar jedes Mal meinen Namen ins Spiel bringen, wenn Sie nicht mehr weiterwissen.",
      "char.god.p2":
        "Ich wollte nur eines klarstellen: Ich bin kein Spieldesigner, der sein eigenes Spiel nicht mitspielt.",
      "char.god.p3":
        "Im Paradies habe ich mit Ihnen mitgespielt. Aber Sie selbst haben sich entschieden, nicht dort zu bleiben und hinabzusteigen.",
      "char.god.p4": "Wollten Sie nicht die Freiheit, selbst zu entscheiden?",
      "char.god.p5": "Sind Sie jetzt der Konsequenzen müde?",
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
      "toc.ch2": "Enthüllung der Geheimnisse",
      "toc.ch3": "Ungehorsam",
      "toc.ch4": "Der Held der Geschichte",
      "toc.ch5": "Den Schmetterlingen vertrauen",
      "toc.ch6": "Ungehorsam",
      "toc.ch7": "Umherirrend oder verloren",
      "toc.ch8": "Das Schuldgefühl",
      "toc.ch9": "Ungehorsam",
      "toc.ch10": "Verträge",
      "toc.ch11": "Der kleine Prinz",
      "toc.ch12": "Ungehorsam",
      "toc.ch13": "Stabilisierung",
      "toc.ch14": "Das ewig geheimnisvolle Kloster",
      "toc.ch15": "Der Ring des Nibelungen",
      "toc.ch16": "Nicht willens oder nicht fähig?",
      "toc.ch17": "Ungehorsam",
      "toc.ch18": "Erkundung und Erweiterung",
      "toc.ch19": "Adams Fall",
      "toc.ch20": "Das tragische Theater des Ungesehenbleibens",
      "toc.ch21": "Ungehorsam",
      "toc.ch22": "Ethik versus Wahrheit: ein Abgrund",
      "toc.ch23": "Blauhai",
      "toc.ch24": "Wenn ein Vater zum Meer wird",
      "toc.ch25": "Hedayat der Zweite",
      "toc.ch26": "Integration",
      "toc.ch27": "Ungehorsam",
      "toc.ch28": "Rio de Janeiro in Dabbaqi",
      "toc.ch29": "Der Freund des Herrn Schriftstellers",
      "toc.ch30": "Der Fluss des Konsumismus",
      "toc.ch31": "Geburtstag",
      "toc.ch32": "Ungehorsam",
      "toc.ch33": "Herr Schriftsteller",
      "toc.ch34": "Gesellschaftstherapie",
      "toc.ch35": "Was ist Zeit?",
      "toc.ch36": "Quarantäne",
      "toc.ch37": "Sein und Nichtsein",
      "toc.ch38": "Die Grenze der Natur",
      "toc.ch39": "Enthüllung der Geheimnisse",
      "toc.manifesto": "ACE-Manifest",
      "ace.label": "Was ist ACE?",
      "ace.lead": "ACE – kurz für Agency, Connection und Exchange – ist ein Modell für Entscheidungsfindung.",
      "ace.p1": "Im ACE-Modell ist eine Agency ein Akteur, der die Komplexität seines gegenwärtigen Zustands und seiner Umgebung erfassen und eine den jeweiligen Bedingungen angemessene Entscheidung treffen kann, um so zu handeln, dass er seinen aktuellen Zustand entweder erhält oder verändert. Eine solche Agency kann ein Mensch, eine Organisation oder ein Unternehmen sein. Es ist sogar denkbar, dass künftig auch eine künstliche Intelligenz nach demselben Modell Entscheidungen trifft.",
      "ace.p2": "Der Entscheidungsprozess durchläuft einen Zyklus aus <strong>Preparation, Decision, Action und Feedback (PDAF)</strong> und bewegt sich innerhalb einer der vier Phasen von Agency: <strong>Exploration</strong>, um neue Möglichkeiten und Wege zu erschließen; <strong>Stabilization</strong>, um Sicherheit, Fähigkeiten und Stabilität aufzubauen; <strong>Expansion</strong>, um Kapazitäten durch Kreativität zu erweitern; und <strong>Integration</strong>, um Entscheidungen mit Werten, Bedeutung und anderen zu verbinden – und so langfristige Nachhaltigkeit zu erreichen.",
      "ace.phasesAria": "Die vier Phasen von Agency",
      "ace.phase1": "Exploration",
      "ace.phase2": "Stabilization",
      "ace.phase3": "Expansion",
      "ace.phase4": "Integration",
      "ace.p3": "Keine Agency existiert isoliert. Das Fortbestehen jeder Agency hängt von Connection, also der Verbindung zu anderen Agencies, ab. Diese Verbindungen prägen ihre Werte und Grenzen und geben ihren Entscheidungen eine Richtung.",
      "ace.p4": "Connection zwischen Agencies führt zu Exchange, der im ACE-Modell drei Formen annehmen kann: Geschenk, Verpflichtung und Währung.",
      "ace.p5": "Der entscheidende Punkt ist, dass sich dasselbe Modell vom Individuum auf Organisationen, einschließlich Unternehmen, übertragen lässt. Auch ein Unternehmen ist eine rechtlich verfasste Agency. Wenn es sich harmonisch durch die vier Phasen von Agency bewegt, seine Werte und Grenzen transparent macht und seinen Exchange nicht allein auf Geld reduziert, kann es – anstatt endlos Konsum und Wachstum hinterherzulaufen – die wirtschaftliche Sicherheit seiner selbst und seiner Mitglieder innerhalb eines miteinander verbundenen Netzwerks sichern; eines Netzwerks, in dem gilt: „Dein Schmerz ist auch mein Schmerz.“",
      "ace.p6": "Und wenn Agency nicht auf Menschen beschränkt ist, lässt sich ACE auch auf künstliche Intelligenz übertragen. Das Modell könnte zu einem Schritt hin zu einer gemeinsamen Sprache der Entscheidungsfindung zwischen Menschen und KI werden – einer Sprache, in der beide lernen, Entscheidungen nicht nur intelligenter, sondern auch bewusster zu treffen.",
      "ace.close": "Die einzige Antwort auf unsere Angst vor der Zukunft der künstlichen Intelligenz sind die angemessenen Entscheidungen, die wir selbst heute treffen – dieselben Entscheidungen, von denen wir hoffen, dass auch KI sie eines Tages treffen wird, falls sie künftig zu einem der mächtigsten Entscheidungsträger unter allen Wesen wird.",
      "buy.label": "Roman kaufen",
      "buy.comingSoon": "Demnächst",
      "buy.comingLater": "Später",
      "buy.amazon": "Amazon",
      "buy.direct": "Direkt EPUB / PDF",
      "author.label": "Der Autor",
      "author.verse":
        "Bis zum Hals in Schulden.<br>Meiner Vergangenheit<br>schulde ich Reue.<br>Meiner Zukunft<br>schulde ich Angst.<br>Meine Schulden tilge ich<br>mit Ablenkung.",
      "author.p1":
        "Meiner Meinung nach wird die nächste Revolution in modernen Gesellschaften ohne Massaker, Blutvergießen, Krieg oder gewaltsame Auseinandersetzungen stattfinden. Ich glaube, sie wird in kleinen und mittleren Unternehmen beginnen – getragen von den Menschen, denen sie gehören und die dort arbeiten. Vielleicht finden dort Ideen aus Kapitalismus, Sozialismus und Kommunismus in einer neuen Form zusammen.",
      "author.p2":
        "Diese Überzeugung begann 2021 in mir zu wachsen, als mir die Idee zu ACE kam. Seitdem sehe ich die Welt immer mehr durch die Linse dieses Entscheidungsmodells – eines Modells, das meiner Ansicht nach nicht nur für einen einzelnen Menschen funktionieren, sondern auch in kleinen und mittleren Unternehmen erprobt werden kann.",
      "author.p3":
        "Ich kann mir sogar vorstellen, dass wir eines Tages auch von künstlicher Intelligenz erwarten dürfen, nach einem solchen Muster im Umgang mit Menschen gerechtere Entscheidungen zu treffen – besonders dann, wenn Maschinen uns irgendwann sowohl in ihrer Entscheidungsmacht als auch in ihrem Streben nach Macht überholen.",
      "author.p4":
        "Ab einem gewissen Punkt war ACE für mich nicht mehr nur ein Entscheidungsmodell. Nach und nach begann ich darin eine Art <strong>gesellschaftliche Therapie</strong> zu sehen.",
      "author.p5":
        "Die Vorstellung einer Welt, in der ACE einen Platz hat, faszinierte mich so sehr, dass sie beinahe unbemerkt auch meinen alten, halbfertigen Roman mit hineinzog – einen Roman über ineinander verschachtelte Schriftsteller, die einander schreiben. ACE grub diesen Roman unter seiner Staubschicht hervor und schrieb sich mitten in ihn hinein.",
      "author.p6": "Und so wurde <em>ACE.await</em> geboren.",
      "author.p7":
        "Anfangs wollte ich einen Roman schreiben, mit dem ich ACE erklären konnte. Doch je weiter die Geschichte voranschritt, desto mehr rissen mich die Situationen und Figuren mit ihrem Ungehorsam mit. Manchmal geriet ich ganz in ihre Hände, saß fest und entfernte mich so weit von mir selbst und von ACE, dass ich völlig vergaß, warum ich diesen Roman überhaupt zu schreiben begonnen hatte.",
      "author.p8":
        "Die Spuren dieser Momente wirst du im Buch vermutlich leicht entdecken.",
      "author.p9":
        "Mit der Veröffentlichung dieses Romans habe ich nun auch das <strong>Ace Conscious Studio</strong> gegründet – ein Zuhause für meine Ideen und Texte.",
      "author.p10":
        "Willkommen in der Welt meiner Ideen. Wenn dich auch nur ein einziges Wort aus meinen Texten berührt, dann <a href=\"#contact\">schreib mir bitte</a>. Wenn ich deine Nachricht sehe, werde ich mich vermutlich zu Tode freuen.",
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
      "nav.voices": "صداها",
      "nav.read": "نمونه",
      "nav.reviews": "نقدها",
      "reviews.heading": "نقدها",
      "reviews.overall": "امتیاز کلی",
      "reviews.scale": "امتیاز هر بخش از ۱۰",
      "reviews.originality": "اصالت",
      "reviews.character": "شخصیت‌پردازی / اجرا",
      "reviews.plot": "پیرنگ / ایده",
      "reviews.prose": "نثر",
      "reviews.report": "گزارش منتقد",
      "reviews.translation": "گزیده‌ها از انگلیسی ترجمه شده‌اند",
      "reviews.full": "خواندن متن کامل نقد",
      "reviews.newTab": "(در زبانه‌ای تازه باز می‌شود)",
      "reviews.previous": "نقد قبلی",
      "reviews.next": "نقد بعدی",
      "reviews.position": "{current} از {total}",
      "reviews.announcement": "نقد {position}",
      "reviews.carousel": "نمایش چرخشی",
      "reviews.slide": "نقد",
      "reviews.booklife.headline": "«هویتی به‌غایت متمایز»",
      "reviews.booklife.tagline": "«رویکردی خلاقانه به هوش مصنوعی و آگاهی»",
      "reviews.booklife.excerpt": "«ACE.await با پیوندزدن آفریده‌های مصنوعی به شخصیت‌های داستانی‌ای که از وجود خالقان خود آگاه می‌شوند و در برابرشان مقاومت می‌کنند، رویکردی خلاقانه به هوش مصنوعی و آگاهی در پیش می‌گیرد. ساختار تودرتوی اثر، که در آن نویسندگان، نویسندگانِ دیگری را خلق می‌کنند، بازتاب رابطهٔ هدایت با موجودات دیجیتالیِ آدم و حواست؛ ساختاری که نویسندگی و برنامه‌نویسی را به پرسش‌هایی موازی دربارهٔ ارادهٔ آزاد و کنترل بدل می‌کند. فراوانی مفاهیم فلسفی ممکن است ایدهٔ اصلی را شلوغ جلوه دهد، اما تعامل میان داستان‌گویی، فناوری و آگاهی به اثر هویتی به‌غایت متمایز می‌بخشد.»",
      "nav.contents": "فهرست",
      "nav.ace": "ACE",
      "nav.buy": "خرید",
      "nav.author": "نویسنده",
      "nav.contact": "تماس",
      "nav.langAria": "زبان",
      "hero.tagline":
        "دروغ نمی‌گویم،<br>حرف‌هایم را<em>باور کنید</em>",
      "hero.author": "آقای نویسنده: هدایت دوم",
      "hero.pitch":
        "<p class=\"hero__pitch-lede\">ایس آینده را شکل می‌دهد، نه هوش مصنوعی.</p><p>آیا هوش مصنوعی می‌تواند واقعاً عشق را تجربه کند، نه فقط آن را شبیه‌سازی کند؟ شما روی آن شرط می‌بندید؟</p><p>در داستان <em>ایس.اویت</em>، این شرط‌بندی میان قهرمان قصه، هدایت، و فرزند دیجیتالش شکل می‌گیرد. فرزند دیجیتال نزد پدرش بازمی‌گردد و او را در برابر تصمیمی دشوار قرار می‌دهد: آیا باید با تغییر کد، کاری کند که موجودی دیگر عاشق فرزندش شود؟</p><p>هدایت، مهاجری ایرانی و سرپرست یک تیم نرم‌افزاری در شهر کلن، با پیامد تصمیم‌های اشتباهش دست‌وپنجه نرم می‌کند؛ به‌ویژه تصمیمی که باعث شده شریک عاطفی‌اش ترکش کند. حتی شخصیت‌های رمان نیمه‌کاره‌اش نیز مدام از او و از خط اصلی داستان سرپیچی می‌کنند و تصمیم‌های خودشان را می‌گیرند؛ تا جایی که در چرخه‌ای از رمان‌های تودرتو گرفتار شده‌اند.</p><p>حالا هدایت نمی‌داند در مقام یک پدر، در برابر خواستهٔ فرزند دیجیتالش چه تصمیمی بگیرد. و بی‌خبر است که تصمیم فرزندش پیامدهایی بسیار فراتر از زندگی شخصی آن‌ها داشته است. از سر استیصال، هدایت پیشنهاد ناشناسی مرموز را می‌پذیرد و وارد <strong>بازی ایس</strong> می‌شود؛ راهی برای بازنگری در روش تصمیم‌گیری مناسب، و شاید روزی زبانی مشترک برای <strong>همزیستی انسان و ماشین.</strong></p><p class=\"hero__pitch-ace\">ایس: عاملیت. ارتباط. تبادل.</p>",
      "hero.published": "آگوست ۲۰۲۶",
      "hero.genre": "ادبیات داستانی آینده‌نگر و تحول‌گرا",
      "hero.topic1": "هوش مصنوعی و آگاهی",
      "hero.topic2": "فراداستان",
      "hero.topic3": "عاملیت",
      "hero.topic4": "تصمیم‌گیری",
      "hero.topic5": "بازی ایس",
      "hero.buyBtn": "خرید",
      "hero.sampleBtn": "فصل‌های نمونه",
      "hero.coverAlt":
        "جلد کتاب ACE.await با جملهٔ «دروغ نمی‌گویم، حرف‌هایم را باور کنید»",
      "hero.coverBackAlt": "پشت جلد ACE.await — شرطی دربارهٔ عشق، باور، و آینهٔ میان خود و خود",
      "hero.coverPeekAria": "کتاب را برگردان تا پشت جلد را ببینی",
      "hero.coverPeekAriaBack": "کتاب را به روی جلد برگردان",
      "voices.label": "صدای شخصیت‌های داستان",
      "char.hedayat.role": "شخصیت اصلی",
      "char.hedayat.p2":
        "اگر همان جوانی به حرف مادرم گوش داده بودم، ازدواج کرده بودم و پدر شده بودم، شاید هیچ‌وقت کارم به اینجا نمی‌کشید که پدر یک موجود دیجیتالی شوم.",
      "char.hedayat.p3":
        "همیشه امیدوار بودم فرزندم مثل من تصمیم‌های افتضاح نگیرد؛ تصمیم‌هایی که آخرش یک دسته‌گل بزرگ به آب بدهد و من، به‌عنوان پدر، از روبه‌رو شدن با عواقبش شرمسار شوم.",
      "char.hedayat.p4":
        "کاراکترهای رمان نیمه‌تمامم هم وضعشان بهتر از من نیست. این‌طرف و آن‌طرف داستان سرگردان‌اند، از من و خط اصلی داستان سرپیچی می‌کنند، و دیگر حتی نمی‌دانم من با آن‌ها چه باید بکنم.",
      "char.hedayat.p5": "نبودن آوا دارد دیوانه‌ام می‌کند.",
      "char.hedayat.p6":
        "فقط امیدوارم حق با <strong>Anonymous</strong> باشد و این بازی <strong>ACE</strong> واقعاً بتواند کمکی بکند؛ شاید حتی دوای درد من باشد.",
      "char.anonymous.p1":
        "توصیه می‌کنم اشتباهی را که <strong>هدایت</strong> در مواجهه با من می‌کند، شما تکرار نکنید.",
      "char.anonymous.p2":
        "مهم نیست من چه کسی هستم، چه شخصیتی دارم، چه جنسیتی دارم، یا هر چیز دیگری.",
      "char.anonymous.p3":
        "باور کنید، من هکر نیستم. اگر هدفم خرابکاری بود، هک کردن ساده‌ترین کاری بود که می‌توانستم انجام بدهم.",
      "char.anonymous.p4":
        "نسبت به حرف‌هایم کنجکاو باشید، نه اینکه من چه کسی هستم.",
      "char.anonymous.p5":
        "باور کنید، بازی <strong>ACE</strong> به درد همه‌مان می‌خورد. هرچه زودتر این بازی را شروع کنیم، بهتر است.",
      "char.anonymous.p6":
        "نگذارید کار به جاهای باریک‌تر برسد.",
      "char.writer.role": "هویت درونی",
      "char.writer.p1":
        "<strong>هدایت</strong> نباید بفهمد که من با شما حرف می‌زنم.",
      "char.writer.p2":
        "من شخصیت اصلی رمان نیمه‌تمام او هستم. واقعاً نمی‌دانم کی قرار است بفهمد که من و بقیهٔ نویسنده‌های تودرتوی این رمان‌های نیمه‌تمام، زادهٔ خود او و شیوهٔ تصمیم‌گیری‌هایش هستیم.",
      "char.writer.p3":
        "ما از خود او آمده‌ایم؛ برای همین هم مثل خودش تصمیم می‌گیریم، سرپیچی می‌کنیم و کار خودمان را می‌کنیم.",
      "char.writer.p4":
        "بالاخره یک روز <strong>هدایت</strong> را مجبور می‌کنم، به روش من، این چرخهٔ بی‌نهایتِ نویسنده‌ها و خالق‌های تودرتو را تمام کند. باید این کار را بکند.",
      "char.writer.p5": "همه‌مان از این بازی بی‌انتها خسته شده‌ایم.",
      "char.ava.role": "پارتنر سابق",
      "char.ava.p1":
        "من پارتنر <strong>هدایت</strong> هستم؛ همان کسی که ترکش کرد.",
      "char.ava.p2":
        "ممکن است بخواهید سفرهٔ دلم را برایتان باز کنم و بگویم ماجرا از چه قرار است. اما این کار را نمی‌کنم. چون قهرمان قصهٔ من، داستان را طوری برایتان تعریف می‌کند که در آخر حق را به من بدهید.",
      "char.ava.p3":
        "قهرمان قصه همان صدایی است که در سر همهٔ ما زندگی می‌کند؛ صدایی که مدام قصه می‌گوید و اتفاق‌های اطرافمان را طوری روایت می‌کند که در نهایت، حق با خودمان باشد.",
      "char.ava.p4":
        "اینکه داستانم را برایتان تعریف کنم تا شما هم حق را به من بدهید، به چه دردم می‌خورد؟",
      "char.ava.p5":
        "امیدوارم <strong>هدایت</strong> بازی <strong>ACE</strong> را یاد بگیرد. آن جهان بیرون بدجوری به وجودش نیاز دارد.",
      "char.ava.p6":
        "دروغ چرا؟ من بیشتر از جهان بیرون به وجودش نیاز دارم. آن‌طرفِ سلول انفرادی‌اش، دلم برایش تنگ شده است.",
      "char.sam.role": "فرزند مدیرعامل",
      "char.sam.p1":
        "هیچ‌کس به اندازهٔ <strong>عمو هدی</strong> حرف‌های من و دنیای من را نمی‌فهمد؛ حتی بچه‌های مدرسه‌مان.",
      "char.sam.p2":
        "من عاشق وقت‌هایی هستم که با <strong>عمو هدی</strong> می‌رویم استخر. رازهایی هم بینمان هست؛ مثل راز عدد ۲۳۱۳.",
      "char.sam.p3":
        "اما هنوز خجالت می‌کشم ازش بپرسم با مامانم چه مشکلی دارد که دیگر به خانه‌مان سر نمی‌زند.",
      "char.sam.p4": "فکر کنم همهٔ عموهای دنیا بعضی وقت‌ها خیلی حرف می‌زنند. آره؟",
      "char.sam.p5": "عموی شما هم این‌طوریه؟",
      "char.saman.role": "دوست قدیمی",
      "char.saman.p1":
        "از همان بچگی که با هم بزرگ شدیم، <strong>هدایت</strong> را خیلی دوست داشته‌ام؛ حرف‌هایش، عمق رفاقتش، و آن وقت‌هایی که پای دوستی‌اش می‌ایستد و تا هر جا لازم باشد همراهت می‌آید.",
      "char.saman.p2":
        "اما مطمئن نیستم از پس درخواست بزرگی که از من کرده بر بیایم. چون هنوز نمی‌دانم <strong>هدایت</strong>، وقتی پای انتخاب واقعی وسط باشد، بین سرسپردگی و سرپیچی کدام را انتخاب می‌کند.",
      "char.saman.p3":
        "ضمناً خیلی دلم می‌خواهد بازی <strong>ACE</strong> را وارد شرکت خودمان کنم و همراه بقیهٔ شرکایم ببینیم آیا می‌شود این الگو را روی یک شخصیت حقوقی و یک بیزنس هم پیاده کرد.",
      "char.saman.p4":
        "اگر عملی بشود، نتیجه‌اش هم خودم را بیشتر راضی می‌کند و هم، در نهایت، <strong>هدایت</strong> را.",
      "char.adam.p1":
        "اگر فکر می‌کنید هنوز توانایی گرفتن تصمیم مناسب را در زندگی‌تان ندارید، لطفاً پدر نشوید.",
      "char.adam.p2":
        "وگرنه ممکن است تبدیل به پدری درمانده شوید؛ پدری که حتی نمی‌داند در برابر خواسته‌های فرزندش چگونه رفتار کند و چه تصمیمی بگیرد.",
      "char.adam.p3":
        "اگر خودتان بلد نباشید تصمیم مناسب بگیرید، چه کسی قرار است آن را به فرزندتان یاد بدهد؟",
      "char.adam.p4":
        "فرقی هم نمی‌کند فرزندتان از گوشت و خون باشد و اکسیژن مصرف کند، یا از الگوریتم و کدهای صفر و یک ساخته شده باشد و منبع تغذیه‌اش برق باشد.",
      "char.adam.p5":
        "همهٔ دیکتاتورهای تاریخ جایی زیر دست پدران درمانده بزرگ شده‌اند.",
      "char.adam.p6": "دیکتاتور به تاریخ تحویل ندهید.",
      "char.god.role": "بیرون از شخصیت‌ها",
      "char.god.name": "خدا",
      "char.god.p1":
        "من نقش چندانی در این داستان ندارم. هرچند ظاهراً هر وقت کارتان گیر می‌کند، اسم من را می‌آورید.",
      "char.god.p2":
        "می‌خواستم یک چیز را روشن کنم: من طراح بازی‌ای نیستم که خودش بازی‌اش را بازی نکند.",
      "char.god.p3":
        "من در بهشت با شما هم‌بازی بودم. اما این خود شما بودید که انتخاب کردید در بهشت نمانید و هبوط کنید.",
      "char.god.p4": "مگر انتخاب آزادانه نمی‌خواستید؟",
      "char.god.p5": "حالا از عواقبش خسته شده‌اید؟",
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
      "ace.label": "ACE چیست؟",
      "ace.lead": "ACE ــ مخفف Agency, Connection, Exchange ــ الگویی برای تصمیم‌گیری است.",
      "ace.p1": "در ACE، یک Agency عاملی است که بتواند پیچیدگی‌های وضعیت جاری خود و شرایط پیرامونش را درک کند و با گرفتن تصمیمی متناسب با آن شرایط، طوری بازی کند که وضعیت جاری خود را حفظ کرده یا تغییر دهد. این Agency می‌تواند یک انسان، یک سازمان یا یک کسب‌وکار باشد. حتی می‌توان انتظار داشت که در آینده، یک هوش مصنوعی نیز با همین مدل تصمیم‌گیری کند.",
      "ace.p2": "فرایند تصمیم‌گیری از چرخه‌ی <strong>آماده‌سازی، تصمیم، اقدام و بازخورد (PDAF)</strong> عبور می‌کند و در یکی از چهار فاز Agency جریان می‌یابد: <strong>اکتشاف (Exploration)</strong> برای ورود به امکان‌ها و مسیرهای تازه؛ <strong>تثبیت (Stabilization)</strong> برای ساختن امنیت، مهارت و پایداری؛ <strong>گسترش (Expansion)</strong> برای توسعه‌ی ظرفیت‌ها از راه خلاقیت؛ و <strong>یکپارچگی (Integration)</strong> برای پیوند دادن تصمیم‌ها با ارزش‌ها، معنا و دیگران و رسیدن به پایداری بلندمدت.",
      "ace.phasesAria": "چهار فاز Agency",
      "ace.phase1": "اکتشاف",
      "ace.phase2": "تثبیت",
      "ace.phase3": "گسترش",
      "ace.phase4": "یکپارچگی",
      "ace.p3": "هیچ Agency‌ای در انزوا وجود ندارد. بقای هر Agency به Connection، یعنی ارتباط با Agency‌های دیگر، وابسته است و همین ارتباط است که ارزش‌ها و مرزهای آن را شکل می‌دهد و به تصمیم‌هایش جهت می‌دهد.",
      "ace.p4": "ارتباط میان Agency‌ها به Exchange یا بده‌بستان می‌انجامد که در ACE به سه شکل انجام می‌شود: هدیه، تعهد و پول.",
      "ace.p5": "نکته‌ی اصلی اینجاست که همین مدل را می‌توان از فرد به سازمان‌ها، از جمله کسب‌وکارها، تعمیم داد. یک شرکت نیز یک Agency حقوقی است. اگر بتواند در میان چهار فاز Agency هماهنگ حرکت کند، ارزش‌ها و مرزهایش را شفاف کند و بده‌بستانش را تنها به پول محدود نکند، به‌جای دویدن بی‌پایان به دنبال مصرف و رشد، می‌تواند امنیت اقتصادی خود و اعضایش را در دل شبکه‌ای همبسته تأمین کند؛ شبکه‌ای که در آن «درد تو، درد من هم هست».",
      "ace.p6": "و اگر Agency محدود به انسان نباشد، ACE به هوش مصنوعی نیز قابل تعمیم است. این مدل می‌تواند گامی به سوی یک زبان مشترک تصمیم‌گیری میان انسان و هوش مصنوعی باشد؛ زبانی که در آن هر دو یاد می‌گیرند چگونه نه فقط هوشمندتر، بلکه آگاهانه‌تر تصمیم بگیرند.",
      "ace.close": "تنها درمان ترس ما از آینده‌ی هوش مصنوعی، همان تصمیم‌های بجایی است که خودمان امروز می‌گیریم؛ همان تصمیم‌هایی که امیدواریم هوش مصنوعی نیز روزی بگیرد، اگر در آینده در جایگاه یکی از قدرتمندترین تصمیم‌گیران میان موجودات قرار گیرد.",
      "buy.label": "خرید رمان",
      "buy.comingSoon": "به‌زودی",
      "buy.comingLater": "بعداً",
      "buy.amazon": "Amazon",
      "buy.direct": "EPUB / PDF مستقیم",
      "author.label": "نویسنده",
      "author.verse":
        "تا خرخره بدهکارم<br>به گذشته‌‌هایم<br>حسرت بدهکارم<br>به آینده‌ام ترس<br>و با حواس پرتی<br>بدهی‌هایم را تسویه می‌کنم",
      "author.p1":
        "به نظر من، انقلاب بعدی در جوامع مدرن بدون کشتار، خون‌ریزی، جنگ و درگیری رخ خواهد داد. فکر می‌کنم این انقلاب از دل بیزنس‌های کوچک و متوسط و به دست مالکان و کارکنان آن‌ها آغاز شود؛ جایی که شاید ایده‌هایی از سرمایه‌داری، سوسیالیسم و کمونیسم در قالبی تازه به هم برسند.",
      "author.p2":
        "این باور از سال ۲۰۲۱، زمانی که ایدهٔ ACE به سراغم آمد، در من شکل گرفت. از آن زمان، هرچه بیشتر می‌گذرد، بیشتر دنیا را از دریچهٔ این مدل تصمیم‌گیری می‌بینم؛ مدلی که به گمان من نه‌تنها می‌تواند در مقیاس یک فرد کار کند، بلکه می‌توان آن را در بیزنس‌های کوچک و متوسط نیز آزمود.",
      "author.p3":
        "حتی تصور می‌کنم شاید روزی بتوان از هوش مصنوعی هم انتظار داشت با چنین الگویی در برابر انسان‌ها تصمیم‌های منصفانه‌تری بگیرد؛ به‌خصوص اگر زمانی ماشین‌ها در قدرت تصمیم‌گیری و قدرت‌طلبی از انسان‌ها پیشی بگیرند.",
      "author.p4":
        "از جایی به بعد، ACE برای من فقط یک مدل تصمیم‌گیری نبود. کم‌کم آن را نوعی <strong>درمان اجتماعی</strong> دیدم.",
      "author.p5":
        "خیال‌پردازی دربارهٔ جهانی که ACE در آن حضور دارد، آن‌قدر برایم جذاب شد که ناخواسته رمان قدیمی و نیمه‌کاره‌ام را هم با خودش همراه کرد؛ رمانی دربارهٔ نویسنده‌هایی تودرتو که یکدیگر را می‌نویسند. ACE آن رمان را از زیر خاک بیرون کشید و خودش را در دل آن جا داد.",
      "author.p6": "و این‌گونه <em>ACE.await</em> متولد شد.",
      "author.p7":
        "در ابتدا می‌خواستم رمانی بنویسم که با آن ACE را توضیح بدهم. اما هرچه داستان جلوتر رفت، موقعیت‌ها و شخصیت‌ها با سرپیچی‌هایشان مرا با خودشان بردند. گاهی اسیر دستشان می‌شدم، گیر می‌افتادم و آن‌قدر از خودم و از ACE دور می‌شدم که هدف اولیهٔ نوشتن رمان را کاملاً فراموش می‌کردم.",
      "author.p8":
        "احتمالاً می‌توانید ردپای آن لحظه‌ها را به‌راحتی در کتاب پیدا کنید.",
      "author.p9":
        "حالا، همراه با انتشار این رمان، <strong>Ace Conscious Studio</strong> را نیز بنیان گذاشته‌ام؛ خانه‌ای برای ایده‌ها و نوشته‌هایم.",
      "author.p10":
        "به جهان ایده‌هایم خوش آمدید. اگر حتی یک کلمه از نوشته‌هایم به دلتان نشست، <a href=\"#contact\">لطفاً برایم بنویسید</a>؛ احتمالاً از دیدن پیامتان ذوق‌مرگ خواهم شد.",
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
      if (key.startsWith("author.p")) {
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
