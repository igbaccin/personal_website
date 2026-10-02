// Site languages: English is the page source; Swedish and Portuguese are applied
// in the browser. Mark translatable text with data-i18n="key" (plain text) or
// data-i18n-html="key" (text with {a1}…{/a1} link placeholders, <em>, <br>,
// <strong>). Never mark titles of publications, projects, or courses.
(function () {
  var root = document.documentElement;
  var SUPPORTED = { en: 1, sv: 1, pt: 1 };
  var params = new URLSearchParams(location.search);
  var browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  var lang = (browser === "sv" || browser === "pt") ? browser : "en";
  try {
    var q = params.get("lang"), saved = localStorage.getItem("site-lang");
    if (SUPPORTED[q]) { lang = q; localStorage.setItem("site-lang", q); }
    else if (SUPPORTED[saved]) lang = saved;
  } catch (e) {}
  root.setAttribute("data-lang", lang);
  root.lang = lang;
  root.setAttribute("xml:lang", lang);
  if (lang !== "en") {
    root.classList.add("i18n-pending");
    setTimeout(function () { root.classList.remove("i18n-pending"); }, 2500);
  }

  // Strings that never appear in page markup.
  var EN = {
    "lang.label": "Language"
  };

  var D = {
    sv: {
      "nav.home": "Hem", "nav.research": "Forskning", "nav.projects": "Projekt", "nav.teaching": "Undervisning", "nav.about": "Om mig",
      "footer.role": "Ekonomisk historiker",
      "lang.label": "Språk",

      "aff": "Postdoktor vid Linköpings universitet, även knuten till Lunds universitet",
      "intro": "Jag undersöker hur förmögenhet och makt påverkar vem som gynnas av ekonomiska förändringar och varför ojämlikhet kan bestå från en generation till nästa.",
      "cta.research": "Forskning och publikationer",
      "cta.cv": "Curriculum vitae",

      "w.and": "och", "w.oxand": " och",

      "f.hb": "Handelsbankens forskningsstiftelser",

      "course.convener": "Kursansvarig", "course.lecturer": "Föreläsare",


      "res.title": "Forskning",
      "res.lead": "Jag forskar om ojämlikhetens historiska rötter och om vad som begränsar följderna av ekonomiska kriser, främst i Afrika. Mina studier rör slaveriet och dess avskaffande i Kapkolonin, arbetsmarknader och levnadsstandard i Ghana, klimat och ägande samt ekonomisk motståndskraft i utvecklingsländer.",
      "res.pub": "Publikationer", "res.review": "Under granskning", "res.wip": "Pågående arbeten", "res.essays": "Texter och mediemedverkan",
      "n.works": "publikationer", "n.manuscripts": "manus", "n.contributions": "bidrag",
      "res.label": "Artiklar, kapitel, <br>rapporter och avhandling",
      "st.forthcoming": "Kommande", "st.editedby": "Redigerad av", "inst.lu": "Lunds universitet", "st.phd": "Doktorsavhandling",
      "st.report": "Rapport", "st.rr": "Omarbetning begärd (R&R)", "st.submitted": "Inskickad", "st.preprint": "Läs preprint", "st.podcast": "Podd",

      "proj.title": "Projekt",
      "proj.lulink": "Mina projekt vid Lunds universitet",
      "proj.current": "Pågående projekt", "proj.upcoming": "Kommande projekt", "proj.earlier": "Tidigare projekt och finansiering",
      "role.researcher": "Projektforskare", "role.postdoc": "Postdoktor", "role.visiting": "Gästforskare", "role.plain": "Forskare",
      "geo.za": "Sydafrika",
      "proj.website": "Projektets webbplats",
      "fund.award": "Projektanslag", "fund.uk": "Brittiskt anslag, omräknat till SEK", "fund.mobility": "Stipendium för forskningsvistelse",
      "fund.total": "Total projektfinansiering", "fund.wallenberg": "Wallenbergstiftelsen",
      "f.vr.full": "Vetenskapsrådet",
      "f.mmw.hb": "Marianne och Marcus Wallenbergs Stiftelse · Handelsbankens forskningsstiftelser",
      "f.ahrc.dfg": "Arts and Humanities Research Council (Storbritannien) och Deutsche Forschungsgemeinschaft (DFG)",
      "proj.inspire.desc": "Forskningsvistelse med inriktning på Kapkolonins ekonomiska historia.",
      "proj.note": "Beloppen gäller finansieringen av respektive projekt eller, där det anges, det individuella stipendiet.",

      "teach.title": "Undervisning",
      "teach.recog": "<strong>Årets lärare 2020.</strong> Ekonomihögskolan vid Lunds universitet.",
      "teach.current": "Kurser jag undervisar på",
      "teach.syllabus": "Kursplan (på engelska)", "teach.syllabus.sv2": "Kursplan", "teach.since": "Sedan",
      "teach.earlier": "Tidigare undervisning",
      "level.ba": "Kandidat", "level.ma": "Master", "teach.both": "Föreläsare och kursansvarig",
      "teach.supervision": "Handledning", "teach.ba.theses": "Kandidatuppsatser", "teach.ma.theses": "Masteruppsatser",
      "teach.lup": "Uppsatser jag handlett i LUP", "teach.phd": "Doktorandhandledning", "teach.cosup": "Biträdande handledare",
      "teach.contact": "Hör gärna av dig om du vill veta mer om kurserna, diskutera handledning eller be om ett rekommendationsbrev.",

      "about.eyebrow": "Om mig",
      "about.p1": "Jag är ekonomisk historiker och forskar om hur ojämlikhet uppstår och består över tid, främst i Afrika. Jag undersöker hur arbetsmarknader, tillgång till finansiering och politisk makt påverkar ekonomisk utveckling. Jag studerar även vad som hjälper ekonomier att stå emot kriser och hur ekonomiska förändringar påverkar människors levnadsvillkor.",
      "about.p2": "Jag sammanställer och analyserar stora mängder data från historiska källor för att undersöka hur ekonomiska förändringar påverkar förmögenhet, arbete, hälsa och levnadsstandard. Jag vill förstå hur skillnader i förmögenhet och makt påverkar vem som bär kostnaderna för en kris och vem som gynnas av återhämtning och tillväxt. Jag undersöker också om ojämlikheten består i nästa generation.",
      "about.p3": "Jag är postdoktor vid Institutionen för ekonomisk och industriell utveckling vid Linköpings universitet och knuten till Ekonomisk-historiska institutionen vid Lunds universitet. Jag har en masterexamen och en doktorsexamen i ekonomisk historia från Lunds universitet och har tidigare varit postdoktor i Lund och vid University of Cambridge. Jag arbetar i forskningsprojekt som finansieras av Vetenskapsrådet, Riksbankens Jubileumsfond, Handelsbankens forskningsstiftelser och brittiska Arts and Humanities Research Council. Jag har också genomfört forsknings- och konsultuppdrag för STINT och FN:s utvecklingsprogram (UNDP).",
      "about.contact": "Kontakt", "about.postal": "Postadress", "about.visiting": "Besöksadress",

      "e404.title": "Sidan hittades inte.",
      "e404.body": "Sidan kan ha flyttats. Använd menyn ovan för att hitta min forskning, undervisning och mina kontaktuppgifter.",
      "e404.home": "Till startsidan"
    },
    pt: {
      "nav.home": "Início", "nav.research": "Pesquisa", "nav.projects": "Projetos", "nav.teaching": "Ensino", "nav.about": "Sobre mim",
      "footer.role": "Historiador econômico",
      "lang.label": "Idioma",

      "aff": "Pesquisador na Universidade de Linköping, também vinculado à Universidade de Lund",
      "intro": "Sou historiador econômico e pesquiso as origens e a persistência da desigualdade, sobretudo na África. Uso fontes históricas para investigar como os mercados de trabalho influenciam a distribuição da riqueza e as condições de vida ao longo de gerações.",
      "cta.research": "Pesquisa e publicações",
      "cta.cv": "Currículo",

      "w.and": "e", "w.oxand": " e",

      "f.hb": "Fundações de Pesquisa do Handelsbanken",

      "course.convener": "Coordenador do curso", "course.lecturer": "Professor",


      "res.title": "Pesquisa",
      "res.lead": "Investigo as origens e a persistência da desigualdade, sobretudo na África, e como a distribuição da riqueza e o acesso ao trabalho influenciam as condições de vida e a capacidade de enfrentar crises econômicas. A partir de fontes históricas, estudo a escravidão e a abolição na Colônia do Cabo, os mercados de trabalho e as condições de vida em Gana, a relação entre clima e patrimônio e a resiliência econômica dos países em desenvolvimento.",
      "res.pub": "Publicações", "res.review": "Em avaliação", "res.wip": "Trabalhos em andamento", "res.essays": "Textos e participações na mídia",
      "n.works": "trabalhos", "n.manuscripts": "manuscritos", "n.contributions": "contribuições",
      "res.label": "Artigos, capítulos, <br>relatórios e tese",
      "st.forthcoming": "Aceito para publicação", "st.editedby": "Organizado por", "inst.lu": "Universidade de Lund", "st.phd": "Tese de doutorado",
      "st.report": "Relatório", "st.rr": "Revisão solicitada (R&R)", "st.submitted": "Enviado", "st.preprint": "Ler preprint", "st.podcast": "Podcast",

      "proj.title": "Projetos",
      "proj.lulink": "Meus projetos na Universidade de Lund",
      "proj.current": "Projetos em andamento", "proj.upcoming": "Próximo projeto", "proj.earlier": "Projetos anteriores e financiamento",
      "role.researcher": "Pesquisador do projeto", "role.postdoc": "Pesquisador", "role.visiting": "Pesquisador visitante", "role.plain": "Pesquisador",
      "geo.za": "África do Sul",
      "proj.website": "Site do projeto",
      "fund.award": "Valor concedido", "fund.uk": "Financiamento britânico, convertido em coroas suecas", "fund.mobility": "Bolsa para estadia de pesquisa",
      "fund.total": "Financiamento total do projeto", "fund.wallenberg": "Fundação Wallenberg",
      "f.vr.full": "Conselho Sueco de Pesquisa (Vetenskapsrådet)",
      "f.mmw.hb": "Fundação Marianne e Marcus Wallenberg · Fundações de Pesquisa do Handelsbanken",
      "f.ahrc.dfg": "Arts and Humanities Research Council (Reino Unido) e Fundação Alemã de Pesquisa (DFG)",
      "proj.inspire.desc": "Estadia de pesquisa sobre a história econômica da Colônia do Cabo.",
      "proj.note": "Os valores indicam o financiamento de cada projeto ou, quando especificado, a bolsa individual.",

      "teach.title": "Ensino",
      "teach.recog": "<strong>Professor do Ano, 2020.</strong> Escola de Economia e Administração da Universidade de Lund.",
      "teach.current": "Cursos que ministro",
      "teach.syllabus": "Programa do curso (em inglês)", "teach.syllabus.sv2": "Programa do curso (em sueco)", "teach.since": "Desde",
      "teach.earlier": "Cursos que já ministrei",
      "level.ba": "Graduação", "level.ma": "Mestrado", "teach.both": "Professor e coordenador do curso",
      "teach.supervision": "Orientação", "teach.ba.theses": "Monografias de graduação", "teach.ma.theses": "Dissertações de mestrado",
      "teach.lup": "Trabalhos que orientei no LUP", "teach.phd": "Orientação de doutorado", "teach.cosup": "Coorientador",
      "teach.contact": "Entre em contato se quiser saber mais sobre os cursos, conversar sobre orientação ou solicitar uma carta de recomendação.",

      "about.eyebrow": "Sobre mim",
      "about.p1": "Sou historiador econômico e estudo como a desigualdade surge e se mantém ao longo do tempo, sobretudo na África. Investigo como os mercados de trabalho, o acesso ao financiamento e o poder político influenciam o desenvolvimento econômico. Também estudo o que ajuda as economias a enfrentar crises e como as transformações econômicas se traduzem em mudanças nas condições de vida.",
      "about.p2": "Reúno e analiso um amplo conjunto de registros históricos para estudar como as mudanças econômicas afetam a riqueza, o trabalho, a saúde e as condições de vida. Investigo como as diferenças de riqueza e poder influenciam a distribuição dos custos das crises e dos benefícios da recuperação e do crescimento. Também procuro entender como essas desigualdades persistem ao longo das gerações.",
      "about.p3": "Sou pesquisador de pós-doutorado no Departamento de Gestão e Engenharia da Universidade de Linköping e mantenho vínculo com o Departamento de História Econômica da Universidade de Lund. Tenho mestrado e doutorado em História Econômica pela Universidade de Lund e já fui pesquisador de pós-doutorado em Lund e na Universidade de Cambridge. Participo de projetos financiados pelo Conselho Sueco de Pesquisa, pela Riksbankens Jubileumsfond, pelas Fundações de Pesquisa do Handelsbanken e pelo Arts and Humanities Research Council do Reino Unido. Também desenvolvi pesquisas e prestei consultoria para a STINT e para o Programa das Nações Unidas para o Desenvolvimento (PNUD).",
      "about.contact": "Contato", "about.postal": "Correspondência", "about.visiting": "Endereço para visitas",

      "e404.title": "Página não encontrada.",
      "e404.body": "Esta página pode ter mudado de endereço. Use o menu acima para acessar minhas pesquisas, os cursos que ministro e meus contatos.",
      "e404.home": "Voltar ao início"
    }
  };

  // The greeting: one line per visit, picked by situation, in the page language.
  var GREET = {
    en: {
      "late": "Working late? Same.",
      "early": "Up early? I never went to bed.",
      "morning": "Good morning.",
      "afternoon": "Good afternoon.",
      "evening": "Good evening. Still at my desk.",
      "weekend": "It’s the weekend. Close this tab and go outside. Me? I will keep working, thank you very much.",
      "tz-night": "It’s {t} in Sweden. I’m still working.",
      "tz-early": "It’s {t} in Sweden. First draft.",
      "tz-day": "It’s {t} in Sweden. Deep in an archive.",
      "tz-evening": "It’s {t} in Sweden. Dinner at the desk, again.",
      "scholar": "Via Google Scholar? The papers are further down.",
      "linkedin": "Wait. You came from LinkedIn? Everyone, we found the LinkedIn user!",
      "substack": "From Substack? I told you not to engage!",
      "colleague": "Hello, colleague.",
      "student": "Hello, student. Shouldn’t you be studying? I should be writing.",
      "christmas": "God jul. Why are you here? Did Santa not bring you any gifts?",
      "newyear": "Gott nytt år. Nothing better than studying to the sound of fireworks.",
      "lucia": "Glad Lucia. Working by candlelight, as tradition demands.",
      "midsummer": "Glad midsommar. All of Sweden is off today. Except the two of us, apparently.",
      "july": "It’s July. Sweden is closed. I am not."
    },
    sv: {
      "late": "Jobbar du sent? Samma här.",
      "early": "Uppe tidigt? Jag har inte gått och lagt mig än.",
      "morning": "God morgon.",
      "afternoon": "God eftermiddag.",
      "evening": "God kväll. Sitter kvar vid skrivbordet.",
      "weekend": "Det är helg. Stäng fliken och gå ut. Jag? Jag jobbar vidare, tack så mycket.",
      "tz-night": "Klockan är {t} i Sverige. Jag jobbar fortfarande.",
      "tz-early": "Klockan är {t} i Sverige. Första utkastet.",
      "tz-day": "Klockan är {t} i Sverige. Mitt bland arkivhandlingarna.",
      "tz-evening": "Klockan är {t} i Sverige. Middag vid skrivbordet, igen.",
      "scholar": "Via Google Scholar? Publikationerna finns under Forskning.",
      "linkedin": "Vänta, kom du hit via LinkedIn? Hörni, vi har hittat LinkedIn-användaren!",
      "substack": "Från Substack? Jag sa ju att du skulle låta bli!",
      "colleague": "Hej, kollega.",
      "student": "Hej! Borde du inte plugga? Jag borde skriva.",
      "christmas": "God jul. Varför är du här? Fick du inga julklappar av tomten?",
      "newyear": "Gott nytt år. Inget slår att plugga till ljudet av fyrverkerier.",
      "lucia": "Glad Lucia. Jobbar i levande ljus, som traditionen kräver.",
      "midsummer": "Glad midsommar. Hela Sverige är ledigt i dag. Utom vi två, tydligen.",
      "july": "Det är juli. Sverige har stängt. Det har inte jag."
    },
    pt: {
      "late": "Trabalhando até tarde? Eu também.",
      "early": "Acordou cedo? Eu nem dormi.",
      "morning": "Bom dia.",
      "afternoon": "Boa tarde.",
      "evening": "Boa noite. Continuo na mesa de trabalho.",
      "weekend": "É fim de semana. Feche a aba e vá aproveitar. Eu continuo por aqui, trabalhando.",
      "tz-night": "{t} na Suécia. Ainda estou trabalhando.",
      "tz-early": "{t} na Suécia. Primeiro rascunho.",
      "tz-day": "{t} na Suécia. Entre papéis de arquivo.",
      "tz-evening": "{t} na Suécia. Jantar na mesa de trabalho, de novo.",
      "scholar": "Veio pelo Google Scholar? A lista de publicações está em Pesquisa.",
      "linkedin": "Peraí. Você veio pelo LinkedIn? Gente, achamos o usuário do LinkedIn!",
      "substack": "Veio do Substack? Eu avisei para não dar corda!",
      "colleague": "Olá, colega.",
      "student": "Oi! Você não devia estar estudando? Eu devia estar escrevendo.",
      "christmas": "God jul. Por que você está aqui? O Papai Noel não te trouxe presentes?",
      "newyear": "Gott nytt år. Nada melhor do que estudar ao som de fogos de artifício.",
      "lucia": "Glad Lucia. Trabalhando à luz de velas, como manda a tradição.",
      "midsummer": "Glad midsommar. A Suécia inteira está de folga hoje. Menos nós dois, pelo visto.",
      "july": "É julho. A Suécia está de férias. Eu não."
    }
  };
  var SAMPLE_HOUR = { "tz-night": 3, "tz-early": 7, "tz-day": 14, "tz-evening": 20 };
  var STUDENT_HOSTS = /^(canvas\.education\.lu\.se|(www\.)?student\.lu\.se|lisam\.liu\.se|(www\.)?student\.liu\.se|studentportal\.liu\.se)$/;
  var NAV = { "index.html": "nav.home", "research.html": "nav.research", "projects.html": "nav.projects", "teaching.html": "nav.teaching", "about.html": "nav.about" };

  var ORIG = new WeakMap();
  var listeners = [];
  var switcher = null;
  var greetSituation = null;

  function lookup(key) { return lang !== "en" && D[lang] ? D[lang][key] : null; }
  function t(key) { return lookup(key) || EN[key] || ""; }
  function each(selector, fn) { Array.prototype.forEach.call(document.querySelectorAll(selector), fn); }

  function situation() {
    var forced = params.get("greet");
    if (forced && GREET.en[forced]) return { id: forced };
    var now = new Date(), h = now.getHours(), day = now.getDay(), mon = now.getMonth() + 1, date = now.getDate();
    var ref = "";
    try { ref = new URL(document.referrer).hostname; } catch (e) {}
    var swe = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Stockholm" }).format(now), 10);
    if (mon === 12 && date >= 24 && date <= 26) return { id: "christmas" };
    if ((mon === 12 && date === 31) || (mon === 1 && date === 1)) return { id: "newyear" };
    if (mon === 12 && date === 13) return { id: "lucia" };
    if (mon === 6 && day === 5 && date >= 19 && date <= 25) return { id: "midsummer" };
    if (/(^|\.)substack\.com$/.test(ref)) return { id: "substack" };
    if (/^scholar\.google\./.test(ref)) return { id: "scholar" };
    if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(ref)) return { id: "linkedin" };
    if (STUDENT_HOSTS.test(ref)) return { id: "student" };
    if (/(^|\.)(lu|liu)\.se$/.test(ref)) return { id: "colleague" };
    if (mon === 7) return { id: "july" };
    if (swe !== h) return { id: swe < 5 ? "tz-night" : swe < 9 ? "tz-early" : swe < 18 ? "tz-day" : "tz-evening", hour: swe };
    if ((day === 0 || day === 6) && h >= 9 && h < 20) return { id: "weekend" };
    return { id: h < 5 ? "late" : h < 8 ? "early" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening" };
  }

  function clock(h) {
    if (lang === "sv") return ("0" + h).slice(-2) + ".00";
    if (lang === "pt") return h + "h";
    return ((h % 12) || 12) + (h < 12 ? " a.m." : " p.m.");
  }

  function renderGreeting() {
    var el = document.querySelector("[data-hs-greeting]");
    if (!el) return;
    if (!greetSituation) greetSituation = situation();
    var text = (GREET[lang] || GREET.en)[greetSituation.id];
    if (text.indexOf("{t}") >= 0) text = text.replace("{t}", clock(greetSituation.hour != null ? greetSituation.hour : SAMPLE_HOUR[greetSituation.id]));
    el.textContent = text;
  }

  function buildSwitcher() {
    var navs = document.querySelectorAll("#quarto-header .navbar-nav");
    var nav = navs[navs.length - 1];
    if (!nav) return;
    var options = ["en", "sv", "pt"];
    var item = document.createElement("li");
    item.className = "nav-item hs-lang";
    switcher = document.createElement("div");
    switcher.className = "hs-lang-group";
    switcher.setAttribute("role", "group");
    switcher.innerHTML = options.map(function (l) {
      return '<button type="button" data-set-lang="' + l + '" lang="' + l + '">' + l.toUpperCase() + "</button>";
    }).join('<span aria-hidden="true">·</span>');
    item.appendChild(switcher);
    nav.appendChild(item);
    switcher.addEventListener("click", function (e) {
      var b = e.target.closest("[data-set-lang]");
      if (!b) return;
      lang = b.getAttribute("data-set-lang");
      try { localStorage.setItem("site-lang", lang); } catch (err) {}
      apply();
    });
  }

  function apply() {
    root.lang = lang;
    root.setAttribute("xml:lang", lang);
    root.setAttribute("data-lang", lang);
    each("[data-i18n]", function (el) {
      if (!ORIG.has(el)) ORIG.set(el, el.textContent);
      el.textContent = lookup(el.getAttribute("data-i18n")) || ORIG.get(el);
    });
    each("[data-i18n-html]", function (el) {
      if (!ORIG.has(el)) ORIG.set(el, { html: el.innerHTML, anchors: Array.prototype.map.call(el.querySelectorAll("a"), function (a) { return a.cloneNode(true); }) });
      var o = ORIG.get(el), v = lookup(el.getAttribute("data-i18n-html"));
      if (!v) { el.innerHTML = o.html; return; }
      el.innerHTML = v.replace(/\{a(\d)\}([\s\S]*?)\{\/a\1\}/g, function (m, n, text) {
        var a = o.anchors[+n - 1].cloneNode(true);
        if (text) a.textContent = text;
        return a.outerHTML;
      });
    });
    each("#quarto-header .nav-link .menu-text", function (el) {
      var file = (el.closest("a").getAttribute("href") || "").split(/[?#]/)[0].split("/").pop() || "index.html";
      var key = NAV[file];
      if (!key) return;
      if (!ORIG.has(el)) ORIG.set(el, el.textContent);
      el.textContent = lookup(key) || ORIG.get(el);
    });
    if (!switcher) buildSwitcher();
    if (switcher) {
      switcher.setAttribute("aria-label", t("lang.label"));
      each(".hs-lang button", function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lang ? "true" : "false"); });
    }
    renderGreeting();
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
  }

  window.SiteI18n = {
    t: t,
    apply: apply,
    lang: function () { return lang; },
    onApply: function (fn) { listeners.push(fn); }
  };

  document.addEventListener("DOMContentLoaded", function () {
    apply();
    root.classList.remove("i18n-pending");
  });
})();
