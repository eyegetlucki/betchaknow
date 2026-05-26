// ─── src/services/questionService.js ─────────────────────────────────────────
const https = require("https");

// ── Open Trivia DB (opentdb.com) ──────────────────────────────────────────────
const OTDB_CATEGORY_MAP = {
  sports:     21,
  science:    17,
  popculture: 14,
  history:    23,
  movies:     11,
  music:      12,
  geography:  22,
};

// ── The Trivia API (the-trivia-api.com) — broader modern coverage ─────────────
const TRIVIA_API_CAT_MAP = {
  sports:     "sport_and_leisure",
  science:    "science",
  popculture: "general_knowledge,society_and_culture",
  history:    "history",
  movies:     "film_and_tv",
  music:      "music",
  geography:  "geography",
};

// ── Modern fallback bank (2000s+ focused, ~90 questions) ─────────────────────
const FALLBACK = [
  // ── Music ──────────────────────────────────────────────────────────────────
  { q:"Which artist released 'Rolling in the Deep' in 2010?",                options:["Beyoncé","Adele","Rihanna","Alicia Keys"],                        correct:1, cat:"music" },
  { q:"What year did 'Gangnam Style' go viral worldwide?",                    options:["2010","2011","2012","2013"],                                      correct:2, cat:"music" },
  { q:"Who released the album 'Lemonade' in 2016?",                           options:["Rihanna","Nicki Minaj","Beyoncé","Cardi B"],                      correct:2, cat:"music" },
  { q:"'Bad Guy' was a hit single by which artist?",                          options:["Dua Lipa","Lizzo","Billie Eilish","Halsey"],                      correct:2, cat:"music" },
  { q:"Which rapper released 'The College Dropout' in 2004?",                 options:["Jay-Z","Kanye West","Lil Wayne","50 Cent"],                      correct:1, cat:"music" },
  { q:"'Old Town Road' featured Lil Nas X and which country star?",           options:["Luke Bryan","Kenny Chesney","Billy Ray Cyrus","Garth Brooks"],   correct:2, cat:"music" },
  { q:"Taylor Swift released '1989' in what year?",                           options:["2012","2013","2014","2015"],                                      correct:2, cat:"music" },
  { q:"Which British singer released 'Hello' in 2015?",                       options:["Amy Winehouse","Adele","Sam Smith","Dua Lipa"],                  correct:1, cat:"music" },
  { q:"What is Drake's hometown city?",                                        options:["New York","Los Angeles","Toronto","Atlanta"],                    correct:2, cat:"music" },
  { q:"'Blinding Lights' is a song by which artist?",                         options:["Post Malone","The Weeknd","Bruno Mars","Justin Timberlake"],     correct:1, cat:"music" },
  { q:"'Uptown Funk' was a collaboration between Mark Ronson and who?",        options:["Pharrell Williams","Bruno Mars","John Legend","Usher"],          correct:1, cat:"music" },
  { q:"Cardi B's debut Billboard Hot 100 #1 single was?",                     options:["WAP","I Like It","Bodak Yellow","Please Me"],                   correct:2, cat:"music" },
  { q:"In what year did Spotify launch?",                                      options:["2006","2007","2008","2009"],                                      correct:2, cat:"music" },
  { q:"Which pop star is known as 'Mother Monster'?",                         options:["Katy Perry","Kesha","Lady Gaga","Nicki Minaj"],                  correct:2, cat:"music" },
  { q:"Which rapper's real name is Aubrey Drake Graham?",                      options:["Lil Wayne","Drake","Kendrick Lamar","J. Cole"],                 correct:1, cat:"music" },
  { q:"'Shape of You' was a 2017 hit by which artist?",                       options:["Sam Smith","Ed Sheeran","Harry Styles","Shawn Mendes"],          correct:1, cat:"music" },
  { q:"Which K-pop group released 'Dynamite' in 2020?",                       options:["EXO","BLACKPINK","BTS","NCT 127"],                               correct:2, cat:"music" },
  { q:"What year did Eminem release 'The Marshall Mathers LP'?",              options:["1998","1999","2000","2001"],                                      correct:2, cat:"music" },

  // ── Movies ─────────────────────────────────────────────────────────────────
  { q:"Who plays Tony Stark / Iron Man in the MCU?",                          options:["Chris Evans","Robert Downey Jr.","Mark Ruffalo","Jeremy Renner"], correct:1, cat:"movies" },
  { q:"What year was the first Iron Man movie released?",                      options:["2006","2007","2008","2009"],                                      correct:2, cat:"movies" },
  { q:"Which film won Best Picture at the 2020 Oscars?",                       options:["1917","Joker","Once Upon a Time…","Parasite"],                  correct:3, cat:"movies" },
  { q:"'Parasite' was produced in which country?",                             options:["Japan","China","South Korea","Thailand"],                        correct:2, cat:"movies" },
  { q:"'Why so serious?' is a quote from which superhero film?",               options:["Batman Begins","The Dark Knight","Batman v Superman","Joker"],   correct:1, cat:"movies" },
  { q:"Who directed 'Get Out' (2017)?",                                        options:["Ryan Coogler","Jordan Peele","Barry Jenkins","Ava DuVernay"],    correct:1, cat:"movies" },
  { q:"'Stranger Things' is produced by which streaming service?",             options:["Hulu","HBO Max","Netflix","Amazon Prime"],                       correct:2, cat:"movies" },
  { q:"What fictional metal is central to Black Panther's powers?",            options:["Adamantium","Vibranium","Kryptonite","Mithril"],                 correct:1, cat:"movies" },
  { q:"Which actor plays Thor in the MCU?",                                    options:["Chris Pratt","Chris Evans","Chris Pine","Chris Hemsworth"],      correct:3, cat:"movies" },
  { q:"'Avengers: Endgame' was released in what year?",                        options:["2017","2018","2019","2020"],                                      correct:2, cat:"movies" },
  { q:"Which animated film features the song 'Let It Go'?",                   options:["Tangled","Brave","Frozen","Moana"],                               correct:2, cat:"movies" },
  { q:"'Squid Game' was produced by which streaming platform?",                options:["Disney+","Amazon Prime","Hulu","Netflix"],                       correct:3, cat:"movies" },
  { q:"Who plays Katniss Everdeen in The Hunger Games?",                       options:["Emma Watson","Jennifer Lawrence","Shailene Woodley","Emma Stone"],correct:1, cat:"movies" },
  { q:"Which franchise features the character Dom Toretto?",                   options:["Mission Impossible","Fast & Furious","John Wick","Expendables"], correct:1, cat:"movies" },
  { q:"In what year was the original Avatar (James Cameron) first released?",  options:["2007","2008","2009","2010"],                                      correct:2, cat:"movies" },
  { q:"Which Marvel film was the first to win a Best Picture Oscar nomination?",options:["Avengers: Endgame","Black Panther","Iron Man","Spider-Man"],    correct:1, cat:"movies" },
  { q:"Who plays the Joker in the 2019 film 'Joker'?",                         options:["Christian Bale","Jared Leto","Joaquin Phoenix","Heath Ledger"],  correct:2, cat:"movies" },
  { q:"Which streaming show set in Hawkins, Indiana became a pop culture hit?", options:["Dark","Black Mirror","Stranger Things","The OA"],               correct:2, cat:"movies" },

  // ── Sports ─────────────────────────────────────────────────────────────────
  { q:"Which country won the 2022 FIFA World Cup?",                            options:["France","Brazil","Argentina","Germany"],                         correct:2, cat:"sports" },
  { q:"Who holds the record for most Olympic gold medals in history?",         options:["Usain Bolt","Carl Lewis","Michael Phelps","Simone Biles"],       correct:2, cat:"sports" },
  { q:"In what year did Usain Bolt set the 100m world record of 9.58 seconds?",options:["2007","2008","2009","2010"],                                     correct:2, cat:"sports" },
  { q:"LeBron James has won NBA championships with how many different teams?",  options:["1","2","3","4"],                                                 correct:2, cat:"sports" },
  { q:"Which team did Stephen Curry lead to 4 NBA championships?",             options:["LA Lakers","Boston Celtics","Golden State Warriors","Miami Heat"],correct:2, cat:"sports" },
  { q:"How many Grand Slam titles did Serena Williams win in total?",           options:["19","21","23","25"],                                              correct:2, cat:"sports" },
  { q:"Which city hosted the 2016 Summer Olympics?",                            options:["Tokyo","London","Rio de Janeiro","Beijing"],                     correct:2, cat:"sports" },
  { q:"Which country does Cristiano Ronaldo represent internationally?",        options:["Spain","Brazil","Portugal","Argentina"],                         correct:2, cat:"sports" },
  { q:"Tom Brady won the most Super Bowls with which team?",                    options:["NY Giants","New England Patriots","Tampa Bay Buccaneers","Dallas Cowboys"], correct:1, cat:"sports" },
  { q:"What sport does Naomi Osaka play?",                                      options:["Golf","Tennis","Swimming","Gymnastics"],                         correct:1, cat:"sports" },
  { q:"Which NBA player is nicknamed 'The Greek Freak'?",                       options:["Joel Embiid","Nikola Jokic","Giannis Antetokounmpo","Luka Doncic"], correct:2, cat:"sports" },
  { q:"Who won the UEFA Euro 2024 championship?",                               options:["France","Germany","Spain","England"],                            correct:2, cat:"sports" },
  { q:"Tiger Woods won how many Major golf championships in total?",             options:["12","13","14","15"],                                              correct:3, cat:"sports" },
  { q:"Who is considered the greatest gymnast of all time by World medal count?",options:["Nadia Comaneci","Larisa Latynina","Simone Biles","Nastia Liukin"], correct:2, cat:"sports" },
  { q:"Which NBA team did Kobe Bryant play his entire career with?",             options:["Chicago Bulls","Boston Celtics","LA Clippers","LA Lakers"],      correct:3, cat:"sports" },
  { q:"What year did Leicester City famously win the English Premier League?",   options:["2014","2015","2016","2017"],                                     correct:2, cat:"sports" },

  // ── Pop Culture ────────────────────────────────────────────────────────────
  { q:"What year was the iPhone first released?",                               options:["2005","2006","2007","2008"],                                      correct:2, cat:"popculture" },
  { q:"Which company owns Instagram?",                                           options:["Google","Twitter","Apple","Meta"],                               correct:3, cat:"popculture" },
  { q:"TikTok is owned by which company?",                                       options:["Alibaba","Tencent","ByteDance","Baidu"],                         correct:2, cat:"popculture" },
  { q:"What is the name of Elon Musk's rocket company?",                         options:["Blue Origin","Virgin Galactic","SpaceX","Rocket Lab"],           correct:2, cat:"popculture" },
  { q:"Which TV series features the Iron Throne?",                               options:["The Witcher","Vikings","Game of Thrones","House of the Dragon"],  correct:2, cat:"popculture" },
  { q:"Who plays Walter White in Breaking Bad?",                                  options:["Aaron Paul","Bryan Cranston","Bob Odenkirk","Dean Norris"],      correct:1, cat:"popculture" },
  { q:"What year was YouTube founded?",                                            options:["2003","2004","2005","2006"],                                    correct:2, cat:"popculture" },
  { q:"Who co-founded Facebook?",                                                  options:["Jack Dorsey","Jeff Bezos","Mark Zuckerberg","Larry Page"],      correct:2, cat:"popculture" },
  { q:"'Minecraft' was originally created by which developer?",                   options:["Markus 'Notch' Persson","Gabe Newell","Todd Howard","Hideo Kojima"], correct:0, cat:"popculture" },
  { q:"Which platform first popularized disappearing 24-hour 'Stories'?",         options:["Facebook","Twitter","Snapchat","Instagram"],                    correct:2, cat:"popculture" },
  { q:"Who voices Elsa in Disney's Frozen?",                                       options:["Idina Menzel","Kristen Bell","Kristin Chenoweth","Cate Blanchett"], correct:0, cat:"popculture" },
  { q:"'The Mandalorian' is set in which fictional universe?",                     options:["Marvel","Star Wars","Star Trek","Dune"],                       correct:1, cat:"popculture" },
  { q:"What does 'GPT' stand for in ChatGPT?",                                     options:["General Purpose Technology","Generative Pre-trained Transformer","Global Processing Tool","Graphic Pattern Text"], correct:1, cat:"popculture" },
  { q:"Which Netflix show broke records as most-watched in its first month (2021)?",options:["Money Heist","Squid Game","Bridgerton","Wednesday"],          correct:1, cat:"popculture" },
  { q:"Which gaming console did Sony release in November 2020?",                   options:["PlayStation 3","PlayStation 4","PlayStation 5","PlayStation 6"], correct:2, cat:"popculture" },
  { q:"What social platform is known for its character limit on posts?",           options:["Instagram","Reddit","Twitter/X","Tumblr"],                     correct:2, cat:"popculture" },

  // ── Science & Tech ─────────────────────────────────────────────────────────
  { q:"What year was the first iPad released?",                                    options:["2008","2009","2010","2011"],                                    correct:2, cat:"science" },
  { q:"Which cryptocurrency was the first ever created?",                          options:["Ethereum","Dogecoin","Litecoin","Bitcoin"],                     correct:3, cat:"science" },
  { q:"What year was the Bitcoin network launched?",                               options:["2007","2008","2009","2010"],                                    correct:2, cat:"science" },
  { q:"What does 'AI' stand for?",                                                  options:["Automated Input","Artificial Intelligence","Adaptive Interface","Augmented Information"], correct:1, cat:"science" },
  { q:"Which company was first to land and re-fly an orbital rocket booster?",     options:["Boeing","Blue Origin","NASA","SpaceX"],                        correct:3, cat:"science" },
  { q:"What year was the first Tesla Model S delivered to customers?",              options:["2010","2011","2012","2013"],                                    correct:2, cat:"science" },
  { q:"What is the most abundant gas in Earth's atmosphere?",                       options:["Oxygen","Carbon Dioxide","Hydrogen","Nitrogen"],               correct:3, cat:"science" },
  { q:"What does 'DNA' stand for?",                                                  options:["Digital Numeric Array","Deoxyribonucleic Acid","Dynamic Neural Algorithm","Data Node Architecture"], correct:1, cat:"science" },
  { q:"Which planet is known as the Red Planet?",                                   options:["Venus","Jupiter","Mars","Mercury"],                            correct:2, cat:"science" },
  { q:"How many bones are in the adult human body?",                                options:["196","206","216","226"],                                        correct:1, cat:"science" },
  { q:"What is the speed of light in a vacuum (approximately)?",                    options:["100,000 km/s","200,000 km/s","300,000 km/s","400,000 km/s"],   correct:2, cat:"science" },
  { q:"Which element has the chemical symbol 'Au'?",                                options:["Silver","Copper","Gold","Platinum"],                           correct:2, cat:"science" },

  // ── History (2000s+) ───────────────────────────────────────────────────────
  { q:"In what year did the September 11 attacks occur?",                           options:["1999","2000","2001","2002"],                                    correct:2, cat:"history" },
  { q:"Who was the first Black president of the United States?",                    options:["Bill Clinton","Al Gore","Barack Obama","Joe Biden"],            correct:2, cat:"history" },
  { q:"What year did Barack Obama first take office as US president?",              options:["2005","2007","2009","2011"],                                    correct:2, cat:"history" },
  { q:"The Brexit referendum took place in what year?",                              options:["2014","2015","2016","2017"],                                    correct:2, cat:"history" },
  { q:"Which country did the US-led coalition invade in March 2003?",               options:["Afghanistan","Syria","Iran","Iraq"],                           correct:3, cat:"history" },
  { q:"Osama bin Laden was killed in what year?",                                    options:["2009","2010","2011","2012"],                                    correct:2, cat:"history" },
  { q:"Which country hosted the 2008 Summer Olympics?",                             options:["Japan","Australia","Russia","China"],                          correct:3, cat:"history" },
  { q:"COVID-19 was declared a global pandemic by the WHO in what year?",           options:["2019","2020","2021","2022"],                                    correct:1, cat:"history" },
  { q:"Who was UK Prime Minister during most of the Brexit negotiations?",          options:["Tony Blair","Gordon Brown","David Cameron","Theresa May"],      correct:3, cat:"history" },
  { q:"Jack Dorsey's first tweet read 'just setting up my ___'.",                   options:["page","account","twttr","profile"],                            correct:2, cat:"history" },
  { q:"Which year did the first iPhone launch, changing mobile forever?",           options:["2005","2006","2007","2008"],                                    correct:2, cat:"history" },
  { q:"The Arab Spring of pro-democracy protests began in what year?",              options:["2008","2009","2010","2011"],                                    correct:2, cat:"history" },

  // ── Geography ─────────────────────────────────────────────────────────────
  { q:"What is the capital of Australia?",                                          options:["Sydney","Melbourne","Canberra","Brisbane"],                    correct:2, cat:"geography" },
  { q:"Which country surpassed China as the world's most populous nation in 2023?", options:["USA","India","Bangladesh","Indonesia"],                        correct:1, cat:"geography" },
  { q:"What is the capital of Canada?",                                              options:["Toronto","Vancouver","Montreal","Ottawa"],                     correct:3, cat:"geography" },
  { q:"Which African country has the largest economy?",                              options:["South Africa","Kenya","Egypt","Nigeria"],                     correct:3, cat:"geography" },
  { q:"What is the largest ocean on Earth?",                                         options:["Atlantic","Indian","Arctic","Pacific"],                       correct:3, cat:"geography" },
  { q:"What is the capital of Brazil?",                                              options:["Rio de Janeiro","São Paulo","Salvador","Brasília"],           correct:3, cat:"geography" },
  { q:"Which country has the most natural lakes in the world?",                     options:["USA","Russia","Brazil","Canada"],                              correct:3, cat:"geography" },
  { q:"What is the smallest country in the world by area?",                         options:["Monaco","San Marino","Liechtenstein","Vatican City"],          correct:3, cat:"geography" },
  { q:"What is the capital of South Korea?",                                         options:["Busan","Incheon","Daegu","Seoul"],                            correct:3, cat:"geography" },
  { q:"Which country contains the majority of the Amazon Rainforest?",             options:["Colombia","Peru","Venezuela","Brazil"],                        correct:3, cat:"geography" },
  { q:"What is the capital of the United Arab Emirates?",                           options:["Dubai","Sharjah","Abu Dhabi","Doha"],                         correct:2, cat:"geography" },
  { q:"Which is the world's largest country by land area?",                         options:["Canada","USA","China","Russia"],                               correct:3, cat:"geography" },
];

// ─────────────────────────────────────────────────────────────────────────────

function decodeHtml(str) {
  return str
    .replace(/&quot;/g,  '"').replace(/&#039;/g, "'")
    .replace(/&amp;/g,   "&").replace(/&lt;/g,   "<")
    .replace(/&gt;/g,    ">").replace(/&ldquo;/g,'"')
    .replace(/&rdquo;/g, '"').replace(/&lsquo;/g,"'").replace(/&rsquo;/g,"'");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Fetch from Open Trivia DB ─────────────────────────────────────────────────
function fetchFromOTDB(categoryId, amount = 10) {
  return new Promise((resolve) => {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&type=multiple`;
    https.get(url, { timeout: 8000 }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.response_code !== 0) return resolve([]);
          resolve(json.results.map(item => {
            const all = shuffle([item.correct_answer, ...item.incorrect_answers]);
            return {
              q:       decodeHtml(item.question),
              options: all.map(decodeHtml),
              correct: all.indexOf(item.correct_answer),
              cat:     item.category,
            };
          }));
        } catch { resolve([]); }
      });
    }).on("error", () => resolve([])).on("timeout", function() { this.destroy(); resolve([]); });
  });
}

// ── Fetch from The Trivia API (more modern questions) ────────────────────────
function fetchFromTriviaAPI(category, amount = 10) {
  return new Promise((resolve) => {
    const apiCat = TRIVIA_API_CAT_MAP[category];
    if (!apiCat) return resolve([]);
    const url = `https://the-trivia-api.com/v2/questions?limit=${amount}&categories=${apiCat}`;
    https.get(url, { timeout: 8000 }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (!Array.isArray(json)) return resolve([]);
          resolve(
            json
              .filter(item => item.question?.text && item.correctAnswer && Array.isArray(item.incorrectAnswers) && item.incorrectAnswers.length === 3)
              .map(item => {
                const all = shuffle([item.correctAnswer, ...item.incorrectAnswers]);
                return {
                  q:       item.question.text,
                  options: all,
                  correct: all.indexOf(item.correctAnswer),
                  cat:     category,
                };
              })
          );
        } catch { resolve([]); }
      });
    }).on("error", () => resolve([])).on("timeout", function() { this.destroy(); resolve([]); });
  });
}

// ── Build question set for a game ─────────────────────────────────────────────
async function buildQuestionSet(settings, customQuestions = []) {
  const { rounds, categories } = settings;
  let pool = [];

  try {
    const active = (categories || []).filter(c => OTDB_CATEGORY_MAP[c] || TRIVIA_API_CAT_MAP[c]);
    if (active.length > 0) {
      const perCat = Math.ceil(rounds / active.length) + 3;
      const half   = Math.max(3, Math.ceil(perCat / 2));

      const results = await Promise.all(
        active.map(c =>
          Promise.all([
            fetchFromOTDB(OTDB_CATEGORY_MAP[c], half).then(qs => qs.map(q => ({ ...q, cat: c }))).catch(() => []),
            fetchFromTriviaAPI(c, half).catch(() => []),
          ]).then(([a, b]) => [...a, ...b])
        )
      );
      pool = results.flat();
    }
  } catch {}

  // Supplement with the modern fallback bank if pool is thin
  if (pool.length < rounds) {
    const filtered = FALLBACK.filter(q =>
      !categories || categories.length === 0 || categories.includes(q.cat)
    );
    // Shuffle the fallback so repeated games get different questions
    const shuffled = shuffle(filtered);
    pool = [...pool, ...shuffled, ...shuffled];
  }

  // Prepend host-added custom questions
  const formatted = (customQuestions || []).map(cq => ({
    q: cq.question, options: cq.options, correct: cq.correctIndex, cat: "custom",
  }));
  pool = [...formatted, ...pool];

  return shuffle(pool).slice(0, rounds);
}

module.exports = { buildQuestionSet };
