// The build reads D to publish Swedish and Portuguese HTML. English pages
// also support the existing in-place language preference. Mark translatable text with data-i18n="key" (plain text) or
// data-i18n-html="key" (text with {a1}…{/a1} link placeholders, <em>, <br>,
// <strong>). Never mark titles of publications, projects, or courses.
(function () {
  var root = document.documentElement;
  var SUPPORTED = ["en", "sv", "pt"];
  var params = new URLSearchParams(location.search);
  var pageLang = root.lang;
  var localized = pageLang === "sv" || pageLang === "pt";
  var browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  var lang = localized ? pageLang : (SUPPORTED.includes(browser) ? browser : "en");
  if (!localized) {
    var queryLang = params.get("lang");
    if (SUPPORTED.includes(queryLang)) {
      lang = queryLang;
      try { localStorage.setItem("site-lang", lang); } catch (_) {}
    } else {
      try {
        var saved = localStorage.getItem("site-lang");
        if (SUPPORTED.includes(saved)) lang = saved;
      } catch (_) {}
    }
  }
  root.setAttribute("data-lang", lang);
  root.lang = lang;
  root.setAttribute("xml:lang", lang);
  if (!localized && lang !== "en") {
    root.classList.add("i18n-pending");
    setTimeout(function () { root.classList.remove("i18n-pending"); }, 2500);
  }

  // Strings that never appear in page markup.
  var EN = {
    "lang.label": "Language"
  };

  // Keep this object valid JSON so the post-render step can read it directly.
  var D = {
    "sv": {
      "meta.index.title": "Igor B. Martins",
      "meta.index.description": "Igor B. Martins är ekonomisk historiker vid Linköpings och Lunds universitet. Han forskar om ojämlikhet, slaveri, förmögenhet, arbete och ekonomisk motståndskraft i Afrika.",
      "meta.research.title": "Forskning om Afrikas ekonomiska historia",
      "meta.research.description": "Igor B. Martins publikationer om Afrikas ekonomiska historia, slaveri och emancipation, ojämlikhet, arbetsmarknader, klimat, förmögenhet och ekonomisk motståndskraft.",
      "meta.projects.title": "Forskningsprojekt om Afrikas ekonomiska historia",
      "meta.projects.description": "Forskningsprojekt där Igor B. Martins medverkar, om långsiktig ojämlikhet i Afrika, Kapkolonin, arbetets historia, klimat och motståndskraft mot ekonomiska kriser.",
      "meta.teaching.title": "Undervisning i ekonomisk historia",
      "meta.teaching.description": "Igor B. Martins undervisar och handleder vid Lunds universitet inom ekonomisk historia, kolonialism, tillväxtekonomier och forskningsmetoder.",
      "nav.home": "Hem", "nav.research": "Forskning", "nav.projects": "Projekt", "nav.teaching": "Undervisning", "nav.about": "Om mig",
      "footer.role": "Ekonomisk historiker", "skip": "Hoppa till huvudinnehållet", "footer.email": "E-post",
      "lang.label": "Språk",

      "aff": "Postdoktor vid Linköpings universitet, även knuten till Lunds universitet",
      "intro": "Jag undersöker hur förmögenhet och makt påverkar vem som gynnas av ekonomiska förändringar och varför ojämlikhet kan bestå från en generation till nästa.",
      "cta.research": "Forskning och publikationer",
      "cta.cv": "Curriculum vitae",
      "home.latest": "Senaste", "home.next": "Nästa artikel", "w.with": "med",

      "w.and": "och", "w.oxand": " och",

      "f.hb": "Handelsbankens forskningsstiftelser",

      "course.convener": "Kursansvarig", "course.lecturer": "Föreläsare",


      "res.title": "Forskning",
      "res.pub": "Publikationer", "res.review": "Under granskning", "res.wip": "Pågående arbeten", "res.essays": "Texter och mediemedverkan",
      "n.works": "publikationer", "n.manuscripts": "manus", "n.contributions": "bidrag",
      "res.label": "Artiklar, kapitel, <br>rapporter och avhandling",
      "st.replication": "Replikationspaket",
      "st.abstract": "Sammanfattning",
      "find.case": "Studenterna tar plats i Heeren XVII, Ostindiska kompaniets styrelse, och avgör var kompaniet ska expandera härnäst, där vinsten vägs mot de politiska och etiska kostnaderna för erövring.",
      "find.thesis": "Utan säker äganderätt till jord eller organiserad kreditgivning använde slavägarna i Kapkolonin förslavade människor som finansiella tillgångar för att skaffa kapital, vilket hjälper till att förklara hur slaveriet fungerade och bestod i kolonin.",
      "find.labourcapital": "Förslavade människor kunde användas som säkerhet för lån redan i det klassiska Aten och Rom, och i 1800-talets Brasilien och Kapkolonin gjorde domstolar och utmätning slavbelånade krediter till rutin, så att emancipationen också raderade säkerheter som långivarna förlitade sig på.",
      "find.brazilpoverty": "Tillväxt i tjänstesektorn, med offentlig förvaltning i spetsen, bidrog mer än jordbruket till att minska fattigdomen i Brasilien under 2000-talet, och delstaternas och kommunernas utgifter för humankapital bidrog mer än federala kontantstöd.",
      "find.stint": "Forskare i Kina publicerar nu mer än sina kolleger i USA inom nästan alla natur- och medicinvetenskapliga områden, och sampubliceringen mellan länderna minskade under covid-19-pandemin medan samarbetet med Latinamerika, Afrika och Europa höll i sig.",
      "find.climate": "Genom att koppla väder till 25 000 hushålls skatteuppgifter visar vi att förmögna hushåll oftare ägde de varor som säsongens väder gynnade, och år då vädret höjde avkastningen på dessa varor var år med större ojämlikhet i lösöre.",
      "find.emancipation": "Efter emancipationen minskade vin- och spannmålsproduktionen mer på gårdar i Stellenbosch där kompensationen låg längre under de förslavades taxerade värde, särskilt bland stora blandjordbruk, vilket stämmer med att slavegendom hade använts som säkerhet för lån.",
      "find.ghana": "Med konsumtionskorgar anpassade till kosten i Ghanas tre ekologiska zoner visar jag att nationella korgar underskattar levnadsstandarden i de norra savannregionerna, och att de växande skillnaderna mellan regionerna 1988–2005 främst uppstod på landsbygden.",
      "find.pachten": "Holländska Ostindiska kompaniet auktionerade varje år ut rätten att sälja alkohol vid Godahoppsudden. De bosättare som vann rättigheterna ägde redan oftare förslavade människor än andra, och de som drev dem som en affärsverksamhet samlade fler, medan deras familjer inte bestod längre än andra bosättarfamiljer.",
      "find.rrr": "Jag har utvecklat en metod som låter språkmodeller skriva litteraturöversikter enbart utifrån källor som forskaren själv tillhandahåller; i 100 testöversikter ledde alla 4 186 referenser till ett angivet verk och en angiven sida, och ingen översikt innehöll något fel.",
      "find.kenya": "I 31 kenyanska valkretsar fick lantbrukshushåll mellan 1997 och 2010 bättre tillgång till konstgödsel, vägar och marknader efter den första demokratiska maktöverlämningen, medan skillnaderna i hushållens förmögenhet mellan valkretsarna knappt förändrades.",
      "find.artisanal": "Universitet följer doktorander genom individuella studieplaner och uppföljningar. Jag föreslår reviderbara planer och korta noteringar av skälen till förändringar, så att handledare kan hållas ansvariga och doktorander ändå kan byta riktning när nya belägg kräver det.",
      "find.catchup": "I 105 länder sedan 1955 rörde sig produktivitet och insatsfaktorer ofta åt olika håll, och ett lands tidigare historia av tillväxt och krympning hjälper till att förutsäga dess senare expansion.",
      "find.capcoer": "Efter att Storbritannien förbjöd slavimport 1807 fortsatte förmögna hushåll i Stellenbosch och Graaff-Reinet att samla förslavade människor, som de höll som kapitaltillgångar i en koloni med ont om kapital.",
      "find.theory": "Vi jämför USA, Brasilien och Kapkolonin och visar att slavägare höll förslavade människor både som arbetskraft och som kapitalinvestering. Investeringsrollen är central för att förklara varför slaveriet bestod.",
      "find.fertility": "Bosättarhushåll i Kapkolonin som förlorade slavförmögenhet vid emancipationen 1834 tycks ha skjutit upp barnafödandet, medan prisvolatilitet inte hade någon tydlig effekt på befruktningar.",
      "find.brazil": "Vi menar att skillnader i strukturomvandling, autonomi och inkludering förklarar varför Indonesien har klarat ekonomisk krympning bättre än Brasilien sedan 1964.",
      "find.poverty": "I 23 utvecklingsländer under 42 år hänger minskad fattigdom samman med färre perioder av ekonomisk krympning, medan förändringar i inkomstojämlikhet saknar ett sådant samband.",
      "find.disentangled": "Sampubliceringen mellan kinesiska och amerikanska forskare har börjat minska, och vi frågar vad ökande politiska begränsningar betyder för internationell forskning.",
      "find.legacies": "Slavägare som förlorade mer förmögenhet genom den partiella kompensationen 1834 levde något kortare, främst de äldre, medan deras barn och barnbarn inte påverkades.",
      "st.forthcoming": "Kommande", "st.accepted": "Accepterad", "st.editedby": "Redigerad av", "inst.lu": "Lunds universitet", "st.phd": "Doktorsavhandling",
      "st.report": "Rapport", "st.rr": "Omarbetning begärd (R&R)", "st.submitted": "Inskickad", "st.preprint": "Läs preprint", "st.podcast": "Podd",

      "proj.title": "Projekt",
      "proj.lulink": "Mina projekt vid Lunds universitet",
      "proj.current": "Pågående projekt", "proj.upcoming": "Kommande projekt", "proj.earlier": "Tidigare projekt och finansiering",
      "role.researcher": "Projektforskare", "role.postdoc": "Postdoktor", "role.visiting": "Gästforskare", "role.plain": "Forskare",
      "geo.za": "Sydafrika",
      "proj.website": "Projektets webbplats",
      "proj.africaInequality": "Ojämlikhet i Afrika (Lunds forskningsportal)",
      "proj.capePanel": "Cape Panels webbplats",
      "proj.ghanaLabour": "Arbetets historia i Ghana",
      "proj.capeGoodHope": "Cape of Good Hope Panel (Lunds forskningsportal)",
      "fund.award": "Projektanslag", "fund.uk": "Brittiskt anslag", "fund.mobility": "Stipendium för forskningsvistelse",
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
      "teach.lupBa": "Kandidatuppsatser i LUP",
      "teach.lupMa": "Masteruppsatser i LUP",
      "teach.phd": "Doktorandhandledning", "teach.cosup": "Biträdande handledare",
      "teach.contact": "Hör gärna av dig om du vill veta mer om kurserna, diskutera handledning eller be om ett rekommendationsbrev.",

      "about.eyebrow": "Om mig",
      "about.p1": "Jag är ekonomisk historiker och forskar om hur ojämlikhet uppstår och består över tid, främst i Afrika. En stor del av min forskning följer slavägande hushåll i Kapkolonin genom skatteuppgifter, värderingar av förslavade människor och kompensationshandlingar. Jag visar att de höll förslavade människor som kapital och som säkerhet för lån. Jag följer hushållen genom emancipationen 1834 för att se vad förlusten av den förmögenheten betydde för deras gårdar, deras familjer och hur länge de levde, och vad friheten betydde för de människor de hade hållit förslavade.",
      "about.p2": "Jag är postdoktor vid Institutionen för ekonomisk och industriell utveckling vid Linköpings universitet och knuten till Ekonomisk-historiska institutionen vid Lunds universitet. Jag har en masterexamen och en doktorsexamen i ekonomisk historia från Lunds universitet och har tidigare varit postdoktor i Lund och vid University of Cambridge. Jag är också en av redaktörerna för Frontiers in African Economic History, African Economic History Networks blogg och nyhetsbrev.",
      "about.contact": "Kontakt", "about.postal": "Postadress", "about.visiting": "Besöksadress",
      "about.roles": "Uppdrag och förtroendeuppdrag",
      "svc.consultant": "Konsult", "svc.confmgr": "Konferensansvarig", "svc.reviewer": "Granskare av vetenskapliga artiklar",
      "svc.affiliate": "Anknuten postdoktor", "svc.seha": "Kassör, därefter revisor",
      "svc.coeditor": "Medredaktör", "svc.secretariat": "Sekretariatet", "link.frontiers": "Frontiers-bloggen",
      "svc.undp": "FN:s utvecklingsprogram (UNDP), för Sydsudans första rapport om multidimensionell fattigdom",
      "svc.stint": "STINT, Stiftelsen för internationalisering av högre utbildning och forskning",
      "svc.others": " och andra tidskrifter",

      "e404.title": "Sidan hittades inte.",
      "e404.body": "Sidan kan ha flyttats. Använd menyn ovan för att hitta min forskning, undervisning och mina kontaktuppgifter.",
      "e404.home": "Till startsidan",
      "e404.time": "Tiden har runnit ut för den här sidan.",
      "hg.turn": "Vänd timglaset"
    },
    "pt": {
      "meta.index.title": "Igor B. Martins",
      "meta.index.description": "Igor B. Martins é historiador econômico nas universidades de Linköping e Lund. Pesquisa desigualdade, escravidão, riqueza, trabalho e resiliência econômica na África.",
      "meta.research.title": "Pesquisa em história econômica da África",
      "meta.research.description": "Publicações de Igor B. Martins sobre a história econômica da África, escravidão e emancipação, desigualdade, mercados de trabalho, clima, riqueza e resiliência econômica.",
      "meta.projects.title": "Projetos de pesquisa em história econômica da África",
      "meta.projects.description": "Projetos de pesquisa com participação de Igor B. Martins sobre desigualdade de longo prazo na África, a Colônia do Cabo, história do trabalho, clima e resiliência a crises econômicas.",
      "meta.teaching.title": "Ensino de história econômica",
      "meta.teaching.description": "Ensino e orientação de Igor B. Martins na Universidade de Lund em história econômica, colonialismo, economias emergentes e métodos de pesquisa.",
      "nav.home": "Início", "nav.research": "Pesquisa", "nav.projects": "Projetos", "nav.teaching": "Ensino", "nav.about": "Sobre mim",
      "footer.role": "Historiador econômico", "skip": "Pular para o conteúdo principal", "footer.email": "E-mail",
      "lang.label": "Idioma",

      "aff": "Pesquisador na Universidade de Linköping, também vinculado à Universidade de Lund",
      "intro": "Estudo como a riqueza e o poder determinam quem se beneficia das mudanças econômicas e por que a desigualdade pode persistir ao longo das gerações.",
      "cta.research": "Pesquisa e publicações",
      "cta.cv": "Currículo",
      "home.latest": "Mais recente", "home.next": "Próximo artigo", "w.with": "com",

      "w.and": "e", "w.oxand": " e",

      "f.hb": "Fundações de Pesquisa do Handelsbanken",

      "course.convener": "Coordenador do curso", "course.lecturer": "Professor",


      "res.title": "Pesquisa",
      "res.pub": "Publicações", "res.review": "Em avaliação", "res.wip": "Trabalhos em andamento", "res.essays": "Textos e participações na mídia",
      "n.works": "trabalhos", "n.manuscripts": "manuscritos", "n.contributions": "contribuições",
      "res.label": "Artigos, capítulos, <br>relatórios e tese",
      "st.replication": "Pacote de replicação",
      "st.abstract": "Resumo",
      "find.case": "Os estudantes assumem o lugar dos Heeren XVII, o conselho diretor da Companhia Holandesa das Índias Orientais, e decidem para onde a companhia deve se expandir, pesando o lucro contra os custos políticos e éticos da conquista.",
      "find.thesis": "Sem direitos seguros sobre a terra nem crédito organizado, os senhores da Colônia do Cabo usavam pessoas escravizadas como ativos financeiros para obter capital, o que ajuda a explicar como a escravidão funcionava e persistia na colônia.",
      "find.labourcapital": "Pessoas escravizadas já podiam servir de garantia na Atenas e na Roma clássicas, e no Brasil e na Colônia do Cabo do século XIX tribunais e execuções tornaram rotineiro o crédito garantido por escravizados, de modo que a abolição também eliminou garantias das quais os credores dependiam.",
      "find.brazilpoverty": "O crescimento dos serviços, liderado pela administração pública, contribuiu mais do que a agricultura para reduzir a pobreza no Brasil nos anos 2000, e os gastos estaduais e municipais em capital humano contribuíram mais do que as transferências federais de renda.",
      "find.stint": "Pesquisadores sediados na China já publicam mais que seus colegas nos Estados Unidos em quase todas as áreas das ciências exatas e da medicina, e a coautoria entre os dois países caiu durante a pandemia de covid-19, enquanto a colaboração com a América Latina, a África e a Europa se manteve.",
      "find.climate": "Ao vincular o clima a 25 mil registros fiscais de domicílios, mostramos que as famílias mais ricas possuíam com mais frequência os produtos favorecidos pelo clima de cada estação, e os anos em que o clima elevou o retorno desses produtos foram anos de maior desigualdade em bens móveis.",
      "find.emancipation": "Após a abolição, as propriedades de Stellenbosch cuja compensação ficou mais abaixo do valor avaliado dos escravizados perderam mais produção de vinho e grãos, sobretudo os grandes produtores mistos, o que é coerente com o uso da propriedade escrava como garantia de empréstimos.",
      "find.ghana": "Com cestas de consumo ajustadas às dietas das três zonas ecológicas de Gana, mostro que cestas nacionais subestimam o padrão de vida nas regiões de savana do norte e que o aumento da desigualdade entre regiões em 1988–2005 ocorreu sobretudo nas áreas rurais.",
      "find.pachten": "A Companhia Holandesa das Índias Orientais leiloava todos os anos o direito de vender bebidas alcoólicas no Cabo. Os colonos que arrematavam esses direitos já possuíam escravizados com mais frequência que os demais, e os que os exploravam como negócio acumularam mais pessoas escravizadas, enquanto suas famílias não duraram mais que outras famílias de colonos.",
      "find.rrr": "Desenvolvi um método que permite a modelos de linguagem escrever revisões de literatura apenas a partir das fontes fornecidas pelo pesquisador; em 100 revisões de teste, todas as 4.186 citações remeteram a uma obra e a uma página declaradas, e nenhuma revisão apresentou erro.",
      "find.kenya": "Em 31 distritos eleitorais do Quênia, entre 1997 e 2010, as famílias rurais ganharam melhor acesso a fertilizantes, estradas e mercados após a primeira transferência democrática de poder, enquanto as diferenças de riqueza domiciliar entre os distritos quase não mudaram.",
      "find.artisanal": "As universidades acompanham doutorandos por meio de planos de estudo e avaliações de progresso. Proponho planos revisáveis e registros breves das razões de cada mudança, para que os orientadores prestem contas e os estudantes ainda possam mudar de rumo quando novas evidências o exigirem.",
      "find.catchup": "Em 105 países desde 1955, produtividade e insumos frequentemente se moveram em direções opostas, e o histórico anterior de crescimento e retração de um país ajuda a prever sua expansão posterior.",
      "find.capcoer": "Depois que a Grã-Bretanha proibiu a importação de escravizados em 1807, as famílias mais ricas de Stellenbosch e Graaff-Reinet continuaram acumulando pessoas escravizadas, mantidas como ativos de capital em uma colônia onde o capital era escasso.",
      "find.theory": "Comparando os Estados Unidos, o Brasil e a Colônia do Cabo, mostramos que os escravizadores mantinham pessoas escravizadas como força de trabalho e como investimento de capital, e que esse papel de investimento é essencial para explicar a persistência da escravidão.",
      "find.fertility": "Famílias de colonos do Cabo que perderam riqueza em escravizados com a abolição de 1834 parecem ter adiado nascimentos, enquanto a volatilidade dos preços não teve efeito claro sobre as concepções.",
      "find.brazil": "Argumentamos que diferenças em transformação estrutural, autonomia e inclusão explicam por que a Indonésia enfrentou a retração econômica melhor do que o Brasil desde 1964.",
      "find.poverty": "Em 23 países em desenvolvimento ao longo de 42 anos, a redução da pobreza está associada a menos episódios de retração econômica, enquanto as mudanças na desigualdade de renda não mostram essa relação.",
      "find.disentangled": "A coautoria entre pesquisadores chineses e norte-americanos começou a diminuir, e perguntamos o que as crescentes restrições políticas significam para a ciência internacional.",
      "find.legacies": "Os senhores que perderam mais riqueza com a compensação parcial de 1834 viveram um pouco menos, sobretudo os mais velhos, enquanto seus filhos e netos não foram afetados.",
      "st.forthcoming": "A ser publicado", "st.accepted": "Aceito", "st.editedby": "Organizado por", "inst.lu": "Universidade de Lund", "st.phd": "Tese de doutorado",
      "st.report": "Relatório", "st.rr": "Revisão solicitada (R&R)", "st.submitted": "Enviado", "st.preprint": "Ler preprint", "st.podcast": "Podcast",

      "proj.title": "Projetos",
      "proj.lulink": "Meus projetos na Universidade de Lund",
      "proj.current": "Projetos em andamento", "proj.upcoming": "Próximo projeto", "proj.earlier": "Projetos anteriores e financiamento",
      "role.researcher": "Pesquisador do projeto", "role.postdoc": "Pesquisador", "role.visiting": "Pesquisador visitante", "role.plain": "Pesquisador",
      "geo.za": "África do Sul",
      "proj.website": "Site do projeto",
      "proj.africaInequality": "Desigualdade na África (portal de Lund)",
      "proj.capePanel": "Site do Cape Panel",
      "proj.ghanaLabour": "História do trabalho em Gana",
      "proj.capeGoodHope": "Cape of Good Hope Panel (portal de Lund)",
      "fund.award": "Valor concedido", "fund.uk": "Financiamento britânico", "fund.mobility": "Bolsa para estadia de pesquisa",
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
      "teach.lupBa": "Monografias de graduação no LUP",
      "teach.lupMa": "Dissertações de mestrado no LUP",
      "teach.phd": "Orientação de doutorado", "teach.cosup": "Coorientador",
      "teach.contact": "Entre em contato se quiser saber mais sobre os cursos, conversar sobre orientação ou solicitar uma carta de recomendação.",

      "about.eyebrow": "Sobre mim",
      "about.p1": "Sou historiador econômico e estudo como a desigualdade surge e se mantém ao longo do tempo, sobretudo na África. Em boa parte da minha pesquisa, acompanho famílias escravistas da Colônia do Cabo nos censos fiscais, nas avaliações de escravizados e nos registros de compensação. Mostro que as pessoas escravizadas eram, para seus senhores, capital e garantia de crédito. Sigo essas famílias antes e depois da abolição de 1834 para entender o que a perda dessa riqueza significou para as fazendas, para os filhos e para o tempo de vida dos antigos senhores, e o que a liberdade significou para as pessoas que eles haviam escravizado.",
      "about.p2": "Sou pesquisador de pós-doutorado no Departamento de Gestão e Engenharia da Universidade de Linköping e mantenho vínculo com o Departamento de História Econômica da Universidade de Lund. Tenho mestrado e doutorado em História Econômica pela Universidade de Lund e já fui pesquisador de pós-doutorado em Lund e na Universidade de Cambridge. Também sou um dos editores do Frontiers in African Economic History, o blog e a newsletter da African Economic History Network.",
      "about.contact": "Contato", "about.postal": "Correspondência", "about.visiting": "Endereço para visitas",
      "about.roles": "Cargos e atividades acadêmicas",
      "svc.consultant": "Consultor", "svc.confmgr": "Coordenador da conferência", "svc.reviewer": "Parecerista",
      "svc.affiliate": "Membro associado de pós-doutorado", "svc.seha": "Tesoureiro e depois auditor",
      "svc.coeditor": "Coeditor", "svc.secretariat": "Equipe da secretaria", "link.frontiers": "Blog Frontiers",
      "svc.undp": "Programa das Nações Unidas para o Desenvolvimento (PNUD), para o primeiro relatório do Índice de Pobreza Multidimensional do Sudão do Sul",
      "svc.stint": "STINT, Fundação Sueca para a Cooperação Internacional em Pesquisa e Ensino Superior",
      "svc.others": " e outras revistas",

      "e404.title": "Página não encontrada.",
      "e404.body": "Esta página pode ter mudado de endereço. Use o menu acima para acessar minhas pesquisas, os cursos que ministro e meus contatos.",
      "e404.home": "Voltar ao início",
      "e404.time": "O tempo desta página se esgotou.",
      "hg.turn": "Virar a ampulheta"
    }
  };

  // The greeting: one English line per visit, picked by situation. The pools a
  // situation lists as extra (Saturdays, Sundays, Mondays, Friday afternoons, dark
  // winter afternoons, phones, returning visitors) join its main pool.
  var GREET = {
    en: {
      "late": ["Working late? Same.", "Can't sleep? This website will probably help!", "Up this late? I see the deadline has finally inspired you.", "Still up? The footnotes won’t write themselves.", "Insomnia or a deadline? Either way, welcome.", "It’s late. Prime time for typos."],
      "early": ["Good morning. The coffee is doing most of the thinking.", "An early start gives you more time to fall behind.", "Good morning. The deadline is closer than yesterday.", "Morning. Today I write. In theory."],
      "morning": ["Today's plan is to finish yesterday's plan.", "You’re here to procrastinate. I built a whole website. We all have our methods.", "Mornings are for writing. Allegedly.", "Welcome. I’m in a meeting about meetings."],
      "afternoon": ["If you’re avoiding a deadline, make yourself at home.", "The draft is almost ready. I would appreciate it if everyone stopped asking.", "Afternoon slump? You’ve come to the right website.", "Writing, deleting, writing again. A normal afternoon.", "You’re procrastinating. I respect that."],
      "evening": ["Good evening! Still at my desk.", "This counts as reading. You may now feel productive.", "Good evening. Have you tried closing the laptop? I hear wonderful things.", "Good evening. Today’s progress: one footnote."],
      "weekend": ["It’s the weekend. You should be resting. I should be taking my own advice.", "It’s the weekend. Close this tab. Go outside.", "Weekend reading on an academic website? Bold."],
      "weekend-saturday": "Visiting an academic website on a Saturday? I see your social life is also thriving.",
      "weekend-sunday": "Sunday. Even reviewers rest. Allegedly.",
      "monday": "Monday. Fresh week, same draft.",
      "friday-afternoon": "Friday afternoon. Perfect time to start something new.",
      "dark": ["Dark already? Welcome to a Swedish afternoon.", "Sunset at three. Productivity followed."],
      "phone": "Reading this on a phone? In a meeting, I assume.",
      "returning": ["Welcome back. Still revising the same paragraph.", "Back so soon? Flattered and slightly worried.", "Welcome back. The paper is still under review."],
      "tz-night": "It’s {t} in Sweden. If you’re wondering why I’m awake, so am I.",
      "tz-early": "It’s {t} in Sweden. The kettle and I are getting started.",
      "tz-day": ["It’s {t} in Sweden. Someone's handwriting from 1820 is testing my patience.", "It’s {t} in Sweden. I am turning a very small question into a very large spreadsheet."],
      "tz-evening": ["It’s {t} in Sweden. Dinner at the desk, again.", "It’s {t} in Sweden. I promised myself an early night. The draft has other plans."],
      "linkedin": ["Wait. You came from LinkedIn? Everyone, we found the LinkedIn user!", "From LinkedIn? I am delighted to announce that I am still revising the same paragraph.", "From LinkedIn? I’m thrilled to announce nothing."],
      "scholar": ["From Google Scholar? A citation would be lovely.", "Scholar sent you? Cite responsibly. And often."],
      "colleague": ["Hello, colleague! This visit counts as research dissemination. I'll put it in the report.", "Hello, colleague. Shouldn’t you be writing?"],
      "student": ["Hello, student! Shouldn’t you be studying? I should be writing.", "Hello, student! The deadline still applies, even if you found my website.", "Hello, student. The answer is in the readings.", "Hello, student. Yes, it will be on the exam."],
      "christmas": "Merry Christmas. Why are you here? Did Santa not bring you any gifts?",
      "newyear": "Happy New Year. Nothing better than studying to the sound of fireworks.",
      "aprilfools": "My paper was accepted without revisions. April Fools’.",
      "nationalday": "Sweden’s National Day. Celebrating with census records.",
      "nobel": "Nobel Day. Phone nearby. Just in case.",
      "lucia": "Happy Saint Lucia’s Day. Working by candlelight, as tradition demands.",
      "midsummer": "Happy Midsummer. All of Sweden is off today. Except the two of us, apparently.",
      "july": "It’s July. Sweden is closed. I am not."
    }
  };
  var SAMPLE_HOUR = { "tz-night": 3, "tz-early": 7, "tz-day": 14, "tz-evening": 20 };
  var STUDENT_HOSTS = /^(canvas\.education\.lu\.se|(www\.)?student\.lu\.se|lisam\.liu\.se|(www\.)?student\.liu\.se|studentportal\.liu\.se)$/;
  var NAV = { "index.html": "nav.home", "research.html": "nav.research", "projects.html": "nav.projects", "teaching.html": "nav.teaching", "about.html": "nav.about" };

  var ORIG = new WeakMap();
  var listeners = [];
  var greetSituation = null;
  var greetText = null;

  function lookup(key) { return lang !== "en" && D[lang] ? D[lang][key] : null; }
  function t(key) { return lookup(key) || EN[key] || ""; }
  function each(selector, fn) { Array.prototype.forEach.call(document.querySelectorAll(selector), fn); }

  // Visits are counted once per browser session and never leave the browser.
  function visits() {
    var n = 1;
    try {
      n = parseInt(localStorage.getItem("greeting-visits"), 10) || 0;
      if (!sessionStorage.getItem("greeting-counted")) {
        n += 1;
        localStorage.setItem("greeting-visits", String(n));
        sessionStorage.setItem("greeting-counted", "1");
      }
    } catch (e) {}
    return n;
  }

  function situation() {
    var forced = params.get("greet");
    if (forced && GREET.en[forced]) return { id: forced, extra: [] };
    var returning = visits() > 1;
    var now = new Date(), h = now.getHours(), day = now.getDay(), mon = now.getMonth() + 1, date = now.getDate();
    var ref = "";
    try { ref = new URL(document.referrer).hostname; } catch (e) {}
    var swe = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Stockholm" }).format(now), 10);
    if (mon === 12 && date >= 24 && date <= 26) return { id: "christmas" };
    if ((mon === 12 && date === 31) || (mon === 1 && date === 1)) return { id: "newyear" };
    if (mon === 12 && date === 13) return { id: "lucia" };
    if (mon === 12 && date === 10) return { id: "nobel" };
    if (mon === 4 && date === 1) return { id: "aprilfools" };
    if (mon === 6 && date === 6) return { id: "nationalday" };
    if (mon === 6 && day === 5 && date >= 19 && date <= 25) return { id: "midsummer" };
    if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(ref)) return { id: "linkedin" };
    if (/^scholar\.google\./.test(ref)) return { id: "scholar" };
    if (STUDENT_HOSTS.test(ref)) return { id: "student" };
    if (/(^|\.)(lu|liu)\.se$/.test(ref)) return { id: "colleague" };
    if (mon === 7) return { id: "july" };
    var extra = returning ? ["returning"] : [];
    if (swe !== h) return { id: swe < 5 ? "tz-night" : swe < 9 ? "tz-early" : swe < 18 ? "tz-day" : "tz-evening", hour: swe, extra: extra };
    if ((day === 0 || day === 6) && h >= 9 && h < 20) {
      extra.push(day === 6 ? "weekend-saturday" : "weekend-sunday");
      return { id: "weekend", extra: extra };
    }
    var id = h < 5 ? "late" : h < 8 ? "early" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    if (day === 1 && h >= 5 && h < 18) extra.push("monday");
    if (day === 5 && id === "afternoon") extra.push("friday-afternoon");
    if ((mon >= 11 || mon === 1) && h >= 15 && h < 18) extra.push("dark");
    var phone = window.matchMedia && window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768;
    if (phone && day >= 1 && day <= 5 && (id === "morning" || id === "afternoon")) extra.push("phone");
    return { id: id, extra: extra };
  }

  function clock(h) {
    if (lang === "sv") return ("0" + h).slice(-2) + ".00";
    if (lang === "pt") return h + "h";
    return ((h % 12) || 12) + (h < 12 ? " a.m." : " p.m.");
  }

  function renderGreeting() {
    var el = document.querySelector("[data-hs-greeting]");
    if (!el) return;
    el.hidden = lang !== "en";
    if (el.hidden) return;
    if (!greetSituation) greetSituation = situation();
    if (greetText === null) {
      var choices = [].concat(GREET.en[greetSituation.id]);
      (greetSituation.extra || []).forEach(function (key) { choices = choices.concat(GREET.en[key]); });
      if (choices.length > 1) {
        // Each browser sees every line in a pool before any repeats, and a new
        // round never opens with the line that closed the last one.
        var storageKey = "greeting-seen-" + greetSituation.id, seen = [];
        try { seen = JSON.parse(localStorage.getItem(storageKey)) || []; } catch (e) {}
        if (!Array.isArray(seen)) seen = [];
        var fresh = choices.filter(function (line) { return seen.indexOf(line) < 0; });
        if (!fresh.length) {
          var last = seen[seen.length - 1];
          seen = [];
          fresh = choices.filter(function (line) { return line !== last; });
        }
        greetText = fresh[Math.floor(Math.random() * fresh.length)];
        seen.push(greetText);
        try { localStorage.setItem(storageKey, JSON.stringify(seen.slice(-60))); } catch (e) {}
      } else {
        greetText = choices[0];
      }
      if (greetText.indexOf("{t}") >= 0) greetText = greetText.replace("{t}", clock(greetSituation.hour != null ? greetSituation.hour : SAMPLE_HOUR[greetSituation.id]));
    }
    el.textContent = greetText;
  }

  function apply() {
    // Translated pages arrive complete, including their navigation and greeting state.
    if (localized) return;
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
    each("#quarto-header .nav-link .menu-text:not([data-i18n])", function (el) {
      var file = (el.closest("a").getAttribute("href") || "").split(/[?#]/)[0].split("/").pop() || "index.html";
      var key = NAV[file];
      if (!key) return;
      if (!ORIG.has(el)) ORIG.set(el, el.textContent);
      el.textContent = lookup(key) || ORIG.get(el);
    });
    var switcher = document.querySelector(".hs-lang-group");
    if (switcher) {
      switcher.setAttribute("aria-label", t("lang.label"));
      each(".hs-lang a[hreflang]", function (link) {
        if (link.hreflang === lang) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
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
    var switcher = document.querySelector(".hs-lang-group");
    if (switcher) switcher.addEventListener("click", function (event) {
      var link = event.target.closest("a[hreflang]");
      if (link) {
        try { localStorage.setItem("site-lang", link.hreflang); } catch (_) {}
      }
    });
    apply();
    root.classList.remove("i18n-pending");
  });
})();
