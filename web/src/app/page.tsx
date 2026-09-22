import Link from 'next/link'
import { HedgeChart, HeroIllustration, Icon, Mark, StepAccept, StepClaim, StepPost } from '../components/Illustrations'
import './landing.css'

const REPO = 'https://github.com/Musaga-Technology/Outright'

const steps = [
  {
    art: <StepPost />,
    title: 'Post an offer',
    body: 'Pick an amount, a rate and a settlement date. Your side of the trade is locked in the contract right away.',
  },
  {
    art: <StepAccept />,
    title: 'Someone accepts',
    body: 'A counterparty takes the offer and locks the other currency. Offer it to anyone, or reserve it for one address.',
  },
  {
    art: <StepClaim />,
    title: 'Each side claims',
    body: 'On the settlement date the buyer claims EURC and the seller claims USDC, at the rate agreed on day one.',
  },
]

const whyArc = [
  { icon: 'chain', title: 'Both currencies, one chain', body: 'USDC and EURC are native Circle stablecoins on Arc. No bridges, no wrapped tokens.' },
  { icon: 'gas', title: 'Gas in dollars', body: 'Fees are paid in USDC, so hedging a currency never means holding a volatile token.' },
  { icon: 'final', title: 'Final when claimed', body: 'Deterministic finality: once a settlement is claimed, it is done.' },
] as const

const safety = [
  { icon: 'shield', title: 'Fully collateralized', body: 'Both legs sit in the contract from acceptance to settlement. There is nothing to default on.' },
  { icon: 'pull', title: 'Claims, not pushes', body: 'Each side withdraws its own leg, so a blocked address can never freeze the other party.' },
  { icon: 'exact', title: 'Exact amounts', body: 'Offers store both amounts, not a rate, so settlement never rounds a cent.' },
  { icon: 'test', title: 'Tested, including fuzzing', body: 'Unit and fuzz tests check that every token that goes in comes out to the right party.' },
] as const

export default function Landing() {
  return (
    <div className="landing">
      <header className="nav">
        <div className="nav__inner">
          <Link href="/" className="brand">
            <Mark />
            Outright
          </Link>
          <nav className="nav__links" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#why">Why Arc</a>
            <a href="#safety">Safety</a>
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
          <Link href="/desk" className="btn btn--ink btn--sm">
            Launch app
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">
              <span className="eyebrow__dot" /> USDC/EURC forwards on Arc
            </span>
            <h1>
              Lock today&rsquo;s exchange rate.
              <br />
              <span className="hero__accent">Settle when you&rsquo;re ready.</span>
            </h1>
            <p className="lede">
              Outright lets businesses agree a USDC/EURC rate now and swap on a date they choose. Both sides lock
              their funds upfront, so settlement can&rsquo;t fail.
            </p>
            <div className="hero__ctas">
              <Link href="/desk" className="btn btn--ink">
                Launch app <span aria-hidden>→</span>
              </Link>
              <a href="#how" className="btn btn--ghost">
                How it works
              </a>
            </div>
            <ul className="hero__facts">
              <li>Fully collateralized</li>
              <li>No oracle</li>
              <li>No margin calls</li>
            </ul>
          </div>
          <div className="hero__art">
            <HeroIllustration />
          </div>
        </section>

        <section className="story" aria-labelledby="story-title">
          <div className="story__copy">
            <p className="kicker">A real hedge</p>
            <h2 id="story-title">Know exactly what your invoice will cost.</h2>
            <p>
              An importer owes a Berlin supplier <strong className="eur">€10,000</strong> in 30 days. Today the rate is
              1.1700. They post an offer to buy 10,000 EURC for <strong className="usd">11,700 USDC</strong>, and an
              exporter holding EURC accepts.
            </p>
            <p>
              Thirty days later the euro has climbed to 1.2140. Buying then would cost 12,140 USDC. The importer
              claims their EURC at 1.1700 anyway, and <strong>saves 440 USDC</strong>.
            </p>
          </div>
          <div className="story__art card">
            <HedgeChart />
          </div>
        </section>

        <section id="how" className="section" aria-labelledby="how-title">
          <div className="section__head">
            <p className="kicker">How it works</p>
            <h2 id="how-title">Three steps, no middleman.</h2>
            <p>An outright forward is one agreement to swap two currencies at a fixed rate on a future date.</p>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title} className="step card">
                <div className="step__art">{s.art}</div>
                <span className="step__num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="steps__note">
            Changed your mind? Cancel an offer for a full refund until it&rsquo;s accepted. Once running, both sides can
            agree to unwind early and each takes back their own deposit.
          </p>
        </section>

        <section id="why" className="section" aria-labelledby="why-title">
          <div className="section__head">
            <p className="kicker">Why Arc</p>
            <h2 id="why-title">Built for a chain where both currencies are native.</h2>
          </div>
          <div className="features">
            {whyArc.map((f) => (
              <div key={f.title} className="feature">
                <span className="feature__icon">
                  <Icon name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="safety" className="section" aria-labelledby="safety-title">
          <div className="section__head">
            <p className="kicker">Safety</p>
            <h2 id="safety-title">Designed so settlement can&rsquo;t go wrong.</h2>
          </div>
          <div className="features features--four">
            {safety.map((f) => (
              <div key={f.title} className="feature feature--card card">
                <span className="feature__icon feature__icon--usd">
                  <Icon name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta">
          <div className="cta__inner">
            <div>
              <h2>Hedge your next invoice.</h2>
              <p>Connect a wallet on Arc and post your first forward in under a minute.</p>
            </div>
            <Link href="/desk" className="btn btn--light">
              Launch app <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <Link href="/" className="brand brand--sm">
          <Mark />
          Outright
        </Link>
        <p>Fully collateralized, physically settled USDC/EURC forwards on Arc.</p>
        <a href={REPO} target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </div>
  )
}
