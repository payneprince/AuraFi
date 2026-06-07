'use client';

import { useState, useEffect } from 'react';
import { Video, FileText, TrendingUp, Shield, DollarSign, X, PlayCircle, Clock, ArrowRight, CheckCircle2, Circle, BookOpen } from 'lucide-react';

const COURSES = [
  {
    title: 'Crypto Basics', description: 'Learn the fundamentals', icon: TrendingUp, color: '#f97316', level: 'Beginner', estTime: '2h 10m',
    lessons: [
      { title: 'What is Blockchain?', content: 'A blockchain is a shared, tamper-resistant ledger maintained by a network of computers instead of one central authority. Every transaction is bundled into a "block," cryptographically linked to the block before it, and copied across thousands of nodes — so altering history would mean rewriting every copy at once. This is what lets Bitcoin and other cryptocurrencies guarantee scarcity and ownership without a bank in the middle.' },
      { title: 'Bitcoin vs. Altcoins', content: 'Bitcoin was the first cryptocurrency and is generally treated as "digital gold" — a scarce store of value with a fixed 21 million coin supply. "Altcoins" (alternative coins) cover everything else, from Ethereum (a programmable platform for apps and smart contracts) to stablecoins pegged to the dollar. Each altcoin has its own purpose, risk profile, and tokenomics, so it pays to understand what problem a coin is actually trying to solve before buying it.' },
      { title: 'Setting Up a Wallet Safely', content: 'A crypto wallet stores the private keys that prove you own your coins — whoever holds the keys controls the funds. Use strong, unique passwords and enable two-factor authentication on any exchange account, and never share your seed phrase (the 12–24 word recovery backup) with anyone or store it in a screenshot or cloud note. Treat your seed phrase like the master key to a vault: write it on paper, store it offline, and keep multiple secure copies.' },
      { title: 'Understanding Market Cap & Supply', content: 'Market capitalization (price × circulating supply) tells you the total value the market assigns to a coin — and is a far better size comparison than price alone, since a "cheap" coin with billions of units can be worth more than an "expensive" one with a tiny supply. Also watch circulating vs. total vs. max supply: large amounts of locked tokens that unlock later can dilute holders and pressure the price downward.' },
      { title: 'Reading Crypto Exchanges', content: 'Exchanges display an order book (live buy and sell orders), a price chart, and your balance across different assets. The "spread" is the gap between the highest buy offer and lowest sell offer — tighter spreads generally mean a more liquid, easier-to-trade market. Before placing any order, double check the trading pair (e.g., BTC/USD vs. BTC/USDT) since mixing these up is a common beginner mistake.' },
      { title: 'Spotting Scams & Rug Pulls', content: 'A "rug pull" happens when developers hype a token, attract investment, then drain the project\'s liquidity and disappear. Red flags include anonymous teams, promises of guaranteed returns, pressure to buy quickly, and tokens where a handful of wallets hold most of the supply. If something promises risk-free profits or asks you to send crypto to "verify" your wallet, it is almost always a scam — legitimate projects never operate that way.' },
      { title: 'Cold Storage vs. Hot Wallets', content: 'A "hot wallet" is connected to the internet (an app or exchange account) — convenient for active trading, but more exposed to hacks. "Cold storage" (a hardware wallet or offline paper backup) keeps your private keys completely offline, making it far safer for long-term holdings. A common approach: keep a small "spending" balance in a hot wallet and move the bulk of your holdings into cold storage.' },
      { title: 'Your First Trade', content: 'Before placing your first trade, decide on an amount you are fully prepared to lose, choose between a market order (executes immediately at the current price) or a limit order (executes only at a price you set), and double-check the asset, network, and amount before confirming. Start small, get comfortable with the mechanics and fees, and resist the urge to chase sudden price spikes — most costly mistakes happen when emotions override a plan.' },
    ],
    initialDone: 5,
  },
  {
    title: 'Stock Market 101', description: 'Understanding stocks', icon: DollarSign, color: '#3b82f6', level: 'Beginner', estTime: '2h 45m',
    lessons: [
      { title: 'How Stock Markets Work', content: 'A stock represents a small slice of ownership in a company. Stock exchanges are marketplaces where buyers and sellers agree on a price in real time — when more people want to buy than sell, prices rise, and vice versa. Companies list shares to raise money for growth, and in return investors get a claim on future profits (and the risk that the business underperforms).' },
      { title: 'Reading Ticker Symbols & Quotes', content: 'A ticker symbol (like AAPL or TSLA) is a company\'s shorthand identifier on an exchange. A quote shows the current price plus the "bid" (highest price a buyer will pay) and "ask" (lowest price a seller will accept), along with the day\'s change in dollars and percentage. Learning to read these at a glance helps you quickly judge whether a stock is moving and how actively it\'s being traded.' },
      { title: 'Market Orders vs. Limit Orders', content: 'A market order buys or sells immediately at the best available current price — fast, but you may pay slightly more (or receive slightly less) than expected in a fast-moving market. A limit order lets you set the exact price you\'re willing to pay or accept; it won\'t execute until the market reaches that price, giving you control at the cost of a guaranteed fill.' },
      { title: 'Understanding P/E Ratios', content: 'The price-to-earnings (P/E) ratio divides a company\'s share price by its earnings per share, giving a rough sense of how expensive a stock is relative to its profits. A high P/E can mean investors expect strong future growth — or that the stock is overvalued — while a low P/E might signal a bargain or a struggling business. P/E is most useful when compared against similar companies in the same industry, not in isolation.' },
      { title: 'Dividends Explained', content: 'Some companies share a portion of their profits with shareholders as cash payments called dividends, usually paid quarterly. The "dividend yield" expresses this payout as a percentage of the share price, making it easy to compare income potential across stocks. Dividend payments aren\'t guaranteed — companies can cut or suspend them during tough times, so a high yield alone isn\'t a reason to buy.' },
      { title: 'Index Funds & ETFs', content: 'An index fund or ETF (exchange-traded fund) holds a basket of many stocks designed to track a market index like the S&P 500, instantly giving you broad diversification in a single purchase. They typically charge low fees and remove the need to pick individual winners — a major reason they\'re a popular core holding for long-term investors. ETFs trade like stocks throughout the day, while traditional index funds price once daily.' },
      { title: 'Bull vs. Bear Markets', content: 'A "bull market" describes a sustained period of rising prices and investor optimism, while a "bear market" is a prolonged decline — commonly defined as a drop of 20% or more from recent highs. Both are a normal part of market cycles; the key is having a strategy for each, since panic-selling during a downturn often locks in losses that a patient investor would have recovered from.' },
      { title: 'Earnings Reports 101', content: 'Public companies report their financial results every quarter, revealing revenue, profit, and forward guidance — and these reports often move stock prices sharply. Pay attention not just to whether a company beat or missed expectations, but to the trends behind the numbers and what management says about the future, since markets react as much to outlook as to past performance.' },
      { title: 'Building a Watchlist', content: 'A watchlist is a curated set of stocks you track without necessarily owning them — useful for studying price behavior, news reactions, and patterns before committing real money. A good watchlist mixes companies you understand, across a few different sectors, so you build a broad sense of how different parts of the market move relative to each other.' },
      { title: 'Placing Your First Trade', content: 'Before your first trade, decide how much you\'re comfortable risking, pick an order type (market for speed, limit for price control), and review the trade summary — symbol, quantity, and estimated cost — before confirming. Many new investors start with a small position in a company or fund they understand well, then build experience and conviction over time rather than going all-in immediately.' },
    ],
    initialDone: 3,
  },
  {
    title: 'Risk Management', description: 'Protect your investments', icon: Shield, color: '#8b5cf6', level: 'Intermediate', estTime: '1h 35m',
    lessons: [
      { title: 'Why Risk Management Matters', content: 'Even the best investment strategy fails without a plan for when things go wrong — markets are unpredictable, and protecting your downside is what keeps you in the game long enough to benefit from growth. Risk management isn\'t about avoiding risk entirely; it\'s about taking deliberate, sized risks you can recover from, rather than ones that could wipe out your portfolio.' },
      { title: 'Position Sizing Basics', content: 'Position sizing means deciding how much of your portfolio to put into any single investment. A common guideline is to avoid risking more than a small percentage of your total portfolio on one trade or asset, so that even a complete loss on that position leaves the rest of your holdings intact. This single habit — sizing positions sensibly — prevents more financial damage than almost any other technique.' },
      { title: 'Stop-Loss & Take-Profit Orders', content: 'A stop-loss order automatically sells a position if it falls to a price you set, capping potential losses without requiring you to watch the market constantly. A take-profit order does the opposite — locking in gains once a target price is reached. Using both removes emotion from exit decisions and enforces the discipline that separates sustainable investors from impulsive traders.' },
      { title: 'Diversification Strategies', content: 'Diversification means spreading investments across different asset classes (stocks, crypto, gold, cash), sectors, and geographies so that a downturn in any single area doesn\'t sink your entire portfolio. It won\'t eliminate risk — markets can fall together in a crisis — but historically it smooths out returns and reduces how violently your portfolio swings day to day.' },
      { title: 'Hedging with Stable Assets', content: 'Holding a portion of your portfolio in lower-volatility assets — cash, stablecoins, gold, or short-term bonds — acts as a buffer during turbulent markets and gives you "dry powder" to buy quality assets when prices drop. This isn\'t about avoiding growth; it\'s about ensuring you\'re never forced to sell your best holdings at the worst possible time just to cover an emergency.' },
      { title: 'Measuring Portfolio Volatility', content: 'Volatility measures how much an asset\'s price swings over a given period — higher volatility means bigger potential gains and losses. Metrics like standard deviation and beta help quantify this, letting you compare how "bumpy" different investments are and build a mix that matches your personal comfort with uncertainty. Understanding your portfolio\'s volatility profile helps you avoid panic decisions when normal swings occur.' },
    ],
    initialDone: 0,
  },
];

type Lesson = typeof COURSES[number]['lessons'][number];
type Course = typeof COURSES[number];

const LEARN_PROGRESS_KEY = 'auravest_learn_progress';

function loadStoredProgress(): Record<string, string[]> {
  const fallback: Record<string, string[]> = {};
  COURSES.forEach((course) => {
    fallback[course.title] = course.lessons.slice(0, course.initialDone).map((l) => l.title);
  });
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(LEARN_PROGRESS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export default function LearnPage() {
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showVideos, setShowVideos] = useState(false);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ course: Course; lesson: Lesson; index: number } | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, string[]>>(loadStoredProgress);

  useEffect(() => {
    try {
      window.localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(completedLessons));
    } catch {}
  }, [completedLessons]);

  const courses = COURSES;

  const articles = [
    {
      title: 'How to Build a Diversified Portfolio', category: 'Portfolio Management', readTime: '6 min read',
      paragraphs: [
        'Diversification spreads your money across different asset classes — crypto, stocks, gold, cash, and local investments — so that a downturn in any single area doesn\'t sink your whole portfolio. The logic is simple: different assets react differently to the same economic event. When stocks fall on rate-hike fears, gold or cash holdings often hold steady or even rise, smoothing out the bumps in your overall balance.',
        'A well-diversified portfolio isn\'t just "owning a lot of things" — it\'s owning things that don\'t all move in the same direction at the same time. Two tech stocks in the same sector aren\'t diversification; a tech stock, a gold position, a stablecoin allocation, and a government bond fund are. Look at correlation, not just count, when judging how spread out your risk really is.',
        'Your ideal mix depends on your risk tolerance, goals, and time horizon. A 25-year-old investing for retirement can typically absorb more volatility (and lean further into growth assets like stocks and crypto) than someone five years from needing the money. Whatever mix you choose, allocations drift as prices move — rebalance periodically (e.g., quarterly or when an asset class drifts more than 5–10% from its target) to keep your risk profile where you intended it.',
      ],
    },
    {
      title: 'Understanding Market Volatility', category: 'Trading', readTime: '4 min read',
      paragraphs: [
        'Volatility measures how much an asset\'s price swings over a given period — statistically, it\'s often expressed as standard deviation of returns. A stock that moves 1–2% a day is far less volatile than a crypto asset that can swing 10–20% in the same window. Higher volatility means bigger potential gains, but also bigger potential losses, in both directions.',
        'Volatility isn\'t inherently "bad" — it\'s the price of admission for higher long-term returns. Assets that barely move (like cash) also barely grow. The goal isn\'t to avoid volatility altogether, but to hold a level of it that matches your time horizon and temperament, so a rough month doesn\'t push you into a panic decision you\'ll regret.',
        'Practically, understanding volatility helps you size positions sensibly — putting a smaller share of your portfolio into highly volatile assets — and recognize when a price swing is "normal turbulence" versus a genuine change in an asset\'s fundamentals. Watching volatility metrics over time can also help you decide when to add to a position gradually (dollar-cost averaging) rather than committing all at once.',
      ],
    },
    {
      title: 'Tax Implications of Crypto Trading', category: 'Taxes', readTime: '7 min read',
      paragraphs: [
        'In most jurisdictions, crypto is treated as property for tax purposes — meaning nearly every disposal (selling for cash, swapping one coin for another, or even spending crypto on goods) can trigger a taxable capital gain or loss. The gain or loss is the difference between your "cost basis" (what you paid, including fees) and the value at the time of disposal.',
        'How long you hold an asset often matters too: many tax systems apply a lower rate to long-term holdings (typically those held over a year) than to short-term trades. This means a buy-and-hold approach can sometimes be significantly more tax-efficient than frequent trading — one more reason to factor taxes into your strategy, not just your entry and exit prices.',
        'Because crypto transactions can pile up quickly, keeping detailed records — dates, amounts, cost basis, and fair market value at the time of each transaction — makes filing dramatically easier and helps you avoid costly mistakes. Strategies like tax-loss harvesting (intentionally realizing losses to offset gains elsewhere in your portfolio) can also reduce your bill, though the specific rules vary by jurisdiction, so it\'s worth consulting a tax professional familiar with digital assets.',
      ],
    },
    {
      title: 'Gold as a Hedge Against Inflation', category: 'Commodities', readTime: '5 min read',
      paragraphs: [
        'Gold has been used as a store of value for millennia, and it has a long track record of holding its purchasing power when fiat currencies weaken. When inflation erodes the value of cash, gold has historically tended to retain — or even gain — real value, which is why many investors treat it as a defensive "ballast" within a broader portfolio.',
        'Unlike stocks or bonds, gold doesn\'t generate income — there\'s no dividend or interest payment, and its price is driven largely by supply, demand, and sentiment rather than earnings growth. That means it shouldn\'t be viewed as a primary growth engine, but rather as a stabilizer that can reduce how violently your overall portfolio swings during turbulent economic periods.',
        'A modest allocation — often cited in the range of 5–10% of a portfolio — can provide diversification benefits without significantly dragging on long-term growth. As always, the right amount depends on your broader goals: someone prioritizing capital preservation might lean higher, while a growth-focused investor with a long time horizon might keep the allocation smaller.',
      ],
    },
  ];

  const videos = [
    { title: 'Reading Candlestick Charts', duration: '12 min', level: 'Beginner', query: 'how to read candlestick charts for beginners' },
    { title: 'Building a DCA Strategy', duration: '9 min', level: 'Beginner', query: 'dollar cost averaging strategy explained' },
    { title: 'Spotting Market Trends with RSI & MACD', duration: '18 min', level: 'Intermediate', query: 'RSI and MACD indicators explained trading' },
    { title: 'Portfolio Rebalancing Walkthrough', duration: '14 min', level: 'Intermediate', query: 'how to rebalance your investment portfolio' },
  ];

  const toggleLesson = (courseTitle: string, lessonTitle: string) => {
    setCompletedLessons((prev) => {
      const done = prev[courseTitle] || [];
      const next = done.includes(lessonTitle) ? done.filter((t) => t !== lessonTitle) : [...done, lessonTitle];
      return { ...prev, [courseTitle]: next };
    });
  };

  const markLessonComplete = (course: Course, lesson: Lesson) => {
    setCompletedLessons((prev) => {
      const done = prev[course.title] || [];
      if (done.includes(lesson.title)) return prev;
      return { ...prev, [course.title]: [...done, lesson.title] };
    });
  };

  const openLesson = (course: Course, lesson: Lesson, index: number) => {
    setActiveLesson({ course, lesson, index });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-2xl font-bold">Learn & Grow</h1>
        <p className="text-muted-foreground">Educational resources to help you invest smarter</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '40ms' }}>
        <h2 className="font-semibold text-lg mb-4">Investment Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map((course, idx) => {
            const Icon = course.icon;
            const done = completedLessons[course.title] || [];
            const progress = Math.round((done.length / course.lessons.length) * 100);
            const isDone = progress >= 100;
            const nextLesson = course.lessons.find((l) => !done.includes(l.title));
            return (
              <div
                key={idx}
                className="group relative overflow-hidden bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${80 + idx * 70}ms`, animationDuration: '350ms' }}
                onClick={() => setActiveCourse(course)}
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity duration-300 group-hover:opacity-30" style={{ background: course.color }} />
                <div className="relative flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${course.color}1a` }}>
                    <Icon className="w-5 h-5" style={{ color: course.color }} />
                  </div>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{course.level} · {course.estTime}</span>
                  )}
                </div>
                <h3 className="relative font-semibold mb-1">{course.title}</h3>
                <p className="relative text-sm text-muted-foreground mb-3">{course.description}</p>
                <div className="relative">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{done.length}/{course.lessons.length} lessons</span>
                    <span className="font-medium" style={{ color: course.color }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: course.color }} />
                  </div>
                </div>
                <p className="relative mt-3 text-xs font-medium flex items-center gap-1 transition-all duration-200 group-hover:gap-1.5" style={{ color: course.color }}>
                  <span className="truncate">{isDone ? 'Review course' : progress === 0 ? 'Start course' : `Next: ${nextLesson?.title}`}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '120ms' }}>
        <h2 className="font-semibold text-lg mb-4">Featured Articles</h2>
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {articles.map((article, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedArticle(article)}
              className="group p-4 hover:bg-accent transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
              style={{ animationDelay: `${160 + idx * 50}ms`, animationDuration: '300ms' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium truncate transition-colors duration-200 group-hover:text-primary">{article.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {article.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {article.readTime}
                    </span>
                  </div>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay: '200ms' }}
      >
        <div className="absolute -bottom-10 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-2 mb-3">
          <Video className="w-5 h-5" />
          <h2 className="font-bold">Video Tutorials</h2>
        </div>
        <p className="relative text-sm opacity-90 mb-4">
          Expert-led tutorials on trading strategies and market analysis
        </p>
        <button
          onClick={() => setShowVideos(true)}
          className="relative bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-all active:scale-95"
        >
          Browse Videos
        </button>
      </div>

      {/* Course lesson breakdown modal */}
      {activeCourse && (() => {
        const course = activeCourse;
        const Icon = course.icon;
        const done = completedLessons[course.title] || [];
        const progress = Math.round((done.length / course.lessons.length) * 100);
        const isDone = progress >= 100;
        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setActiveCourse(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${course.color}, ${course.color}66, ${course.color}22)` }} />
              <div className="relative px-5 pt-5 pb-4 border-b border-border/60 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${course.color}1a` }}>
                    <Icon className="w-5 h-5" style={{ color: course.color }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate pr-8">{course.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{course.level} · {course.estTime} · {course.lessons.length} lessons</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCourse(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{isDone ? 'Course completed' : `${done.length}/${course.lessons.length} lessons complete`}</span>
                    <span className="font-semibold" style={{ color: course.color }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: course.color }} />
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 space-y-1.5 overflow-y-auto">
                {course.lessons.map((lesson, idx) => {
                  const checked = done.includes(lesson.title);
                  return (
                    <button
                      key={lesson.title}
                      onClick={() => openLesson(course, lesson, idx)}
                      className="group/lesson w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-accent/60 transition-all duration-150 text-left animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                      style={{ animationDelay: `${idx * 35}ms`, animationDuration: '250ms' }}
                    >
                      <span
                        className="flex-shrink-0 transition-transform duration-150 group-hover/lesson:scale-110"
                        onClick={(e) => { e.stopPropagation(); toggleLesson(course.title, lesson.title); }}
                      >
                        {checked ? (
                          <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: course.color }} />
                        ) : (
                          <Circle className="w-[18px] h-[18px] text-muted-foreground/40" />
                        )}
                      </span>
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`text-sm flex-1 truncate ${checked ? 'text-muted-foreground line-through' : ''}`}>{lesson.title}</span>
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 transition-all duration-150 group-hover/lesson:text-foreground group-hover/lesson:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
              <div className="px-5 py-4 border-t border-border/60 flex-shrink-0 flex items-center justify-between gap-3">
                {isDone ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-500">
                    <CheckCircle2 className="w-4 h-4" /> You&apos;ve completed this course
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" /> Tap a lesson to read it
                  </span>
                )}
                <button
                  onClick={() => setActiveCourse(null)}
                  className="px-5 py-2 rounded-xl text-white text-sm font-bold transition-transform active:scale-95 flex-shrink-0"
                  style={{ background: course.color }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lesson content reader modal */}
      {activeLesson && (() => {
        const { course, lesson, index } = activeLesson;
        const done = completedLessons[course.title] || [];
        const checked = done.includes(lesson.title);
        const hasNext = index < course.lessons.length - 1;
        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setActiveLesson(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${course.color}, ${course.color}66, ${course.color}22)` }} />
              <div className="relative px-5 pt-5 pb-4 border-b border-border/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-semibold text-white flex-shrink-0" style={{ background: course.color }}>
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground truncate">{course.title} · Lesson {index + 1} of {course.lessons.length}</span>
                </div>
                <h3 className="font-bold text-lg mt-1.5 pr-8">{lesson.title}</h3>
                <button
                  onClick={() => setActiveLesson(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto">
                <p className="text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-300">{lesson.content}</p>
              </div>
              <div className="px-5 py-4 border-t border-border/60 flex-shrink-0 flex items-center justify-between gap-3">
                <button
                  onClick={() => toggleLesson(course.title, lesson.title)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${checked ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {checked ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  {checked ? 'Completed' : 'Mark as complete'}
                </button>
                <button
                  onClick={() => {
                    markLessonComplete(course, lesson);
                    if (hasNext) {
                      setActiveLesson({ course, lesson: course.lessons[index + 1], index: index + 1 });
                    } else {
                      setActiveLesson(null);
                      setActiveCourse(course);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-white text-sm font-bold transition-transform active:scale-95 flex-shrink-0 flex items-center gap-1.5"
                  style={{ background: course.color }}
                >
                  {hasNext ? 'Next lesson' : 'Finish course'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Article reader modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/40 flex-shrink-0" />
            <div className="relative px-5 pt-5 pb-4 border-b border-border/60 flex-shrink-0">
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{selectedArticle.category}</span>
              <h3 className="font-bold text-lg mt-2 pr-8">{selectedArticle.title}</h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> {selectedArticle.readTime}
              </p>
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto">
              {selectedArticle.paragraphs.map((para: string, pIdx: number) => (
                <p
                  key={pIdx}
                  className="text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${pIdx * 80}ms`, animationDuration: '300ms' }}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video tutorials modal */}
      {showVideos && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowVideos(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-400 to-blue-400" />
            <div className="relative flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/60">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400/80 border-r-blue-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
                <div className="absolute inset-[3px] rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                  <Video className="w-4.5 h-4.5 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Video Tutorials</h3>
                <p className="text-[11px] text-muted-foreground">Pick a topic to dive into</p>
              </div>
              <button
                onClick={() => setShowVideos(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              {videos.map((video, idx) => (
                <a
                  key={video.title}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-purple-400/40 hover:bg-purple-500/5 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${idx * 60}ms`, animationDuration: '300ms' }}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <PlayCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-[11px] text-muted-foreground">{video.level} · {video.duration} · YouTube</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground transition-all duration-200 group-hover:text-purple-400 group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
