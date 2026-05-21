// ─── src/services/questionService.js ─────────────────────────────────────────
const https = require("https");

const CATEGORY_MAP = {
  sports:      21,
  science:     17,
  popculture:  14,
  history:     23,
  movies:      11,
  music:       12,
  geography:   22,
};

const FALLBACK = [
  { q:"What is the capital of Australia?",           options:["Sydney","Melbourne","Canberra","Brisbane"],           correct:2, cat:"geography" },
  { q:"How many bones are in the adult human body?", options:["196","206","216","226"],                              correct:1, cat:"science"   },
  { q:"Which planet has the most moons?",            options:["Jupiter","Saturn","Uranus","Neptune"],                correct:1, cat:"science"   },
  { q:"In what year did the Titanic sink?",          options:["1910","1911","1912","1913"],                          correct:2, cat:"history"   },
  { q:"What element has the chemical symbol 'Au'?",  options:["Silver","Copper","Gold","Platinum"],                  correct:2, cat:"science"   },
  { q:"Who directed 'Inception'?",                   options:["Spielberg","Nolan","Cameron","Scott"],                correct:1, cat:"movies"    },
  { q:"What sport uses a shuttlecock?",              options:["Tennis","Squash","Badminton","Pickleball"],           correct:2, cat:"sports"    },
  { q:"Which band released 'Abbey Road'?",           options:["Rolling Stones","The Beatles","Led Zeppelin","Floyd"],correct:1, cat:"music"     },
  { q:"What is the largest ocean on Earth?",         options:["Atlantic","Indian","Arctic","Pacific"],              correct:3, cat:"geography" },
  { q:"How many sides does a hexagon have?",         options:["5","6","7","8"],                                      correct:1, cat:"science"   },
  { q:"Who painted the Mona Lisa?",                  options:["Michelangelo","Raphael","da Vinci","Donatello"],      correct:2, cat:"history"   },
  { q:"What is the fastest land animal?",            options:["Lion","Cheetah","Pronghorn","Greyhound"],            correct:1, cat:"science"   },
  { q:"How many players on a basketball team?",      options:["4","5","6","7"],                                      correct:1, cat:"sports"    },
  { q:"What is the hardest natural substance?",      options:["Sapphire","Ruby","Diamond","Quartz"],                correct:2, cat:"science"   },
  { q:"What gas do plants absorb from the air?",     options:["Oxygen","Hydrogen","Carbon Dioxide","Nitrogen"],     correct:2, cat:"science"   },
];

function decodeHtml(str) {
  return str
    .replace(/&quot;/g,'"').replace(/&#039;/g,"'")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<")
    .replace(/&gt;/g,">").replace(/&ldquo;/g,'"')
    .replace(/&rdquo;/g,'"').replace(/&lsquo;/g,"'").replace(/&rsquo;/g,"'");
}

function fetchFromAPI(categoryId, amount = 12) {
  return new Promise((resolve, reject) => {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&type=multiple`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.response_code !== 0) return resolve([]);
          const questions = json.results.map(item => {
            const all = [item.correct_answer, ...item.incorrect_answers];
            for (let i = all.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [all[i], all[j]] = [all[j], all[i]];
            }
            return {
              q: decodeHtml(item.question),
              options: all.map(decodeHtml),
              correct: all.indexOf(item.correct_answer),
              cat: item.category,
            };
          });
          resolve(questions);
        } catch { resolve([]); }
      });
    }).on("error", () => resolve([]));
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildQuestionSet(settings, customQuestions = []) {
  const { rounds, categories } = settings;
  let pool = [];

  // Fetch from API
  try {
    const active = (categories || []).filter(c => CATEGORY_MAP[c]);
    if (active.length > 0) {
      const perCat = Math.ceil(rounds / active.length) + 3;
      const results = await Promise.all(
        active.map(c => fetchFromAPI(CATEGORY_MAP[c], perCat).catch(() => []))
      );
      pool = results.flat();
    }
  } catch {}

  // Supplement with fallback
  if (pool.length < rounds) {
    const filtered = FALLBACK.filter(q =>
      !categories || categories.length === 0 || categories.includes(q.cat)
    );
    pool = [...pool, ...filtered, ...filtered]; // duplicate fallback if needed
  }

  // Prepend custom questions
  const formatted = (customQuestions || []).map(cq => ({
    q: cq.question, options: cq.options, correct: cq.correctIndex, cat: "custom",
  }));
  pool = [...formatted, ...pool];

  return shuffle(pool).slice(0, rounds);
}

module.exports = { buildQuestionSet };
