import Link from 'next/link'
import { FlowDiagram, Guilloche, HedgeChart, Mark, SettledStamp } from '../components/Illustrations'
import './landing.css'

const REPO = 'https://github.com/Musaga-Technology/Outright'

const steps = [
  {
    title: 'Post an offer',
    body: 'Choose an amount, a rate and a value date. Your side of the trade goes into the contract straight away, and you can cancel for a full refund until someone accepts.',
  },
  {
    title: 'A counterparty accepts',
    body: 'They lock the other currency, and the rate is fixed from that moment. Leave the offer open to anyone, or reserve it for a single address.',
  },
  {
    title: 'Each side claims',
    body: 'On the value date the buyer claims the EURC and the seller claims the USDC. If both agree before then, they can unwind and take back their own deposits.',
  },
]

const arc = [
  ['Both currencies on one chain', 'USDC and EURC are both issued natively by Circle on Arc, so a forward is one contract holding two tokens. No bridges, no wrapped assets.'],
  ['Fees in dollars', 'Gas on Arc is paid in USDC. Hedging a currency never means buying a volatile token first.'],
  ['Final when it settles', 'Arc has deterministic finality. Once a leg is claimed, it cannot be reversed.'],
]

const safety = [
  ['Collateral in full, on both legs', 'Nothing is lent and nothing is netted. Every unit that will change hands is already in the contract.'],
  ['Each party claims its own leg', 'Payouts are pulled, not pushed. If one address is ever blocked by the token issuer, the other side still claims.'],
  ['Amounts, not a rate', 'An offer records exactly how much of each currency moves. Settlement never rounds.'],
  ['Tested for conservation', 'Fuzz tests check that every token deposited leaves the contract, to the right party, in every path through a trade.'],
  ['One pair per contract', 'The two currencies are fixed when the contract is deployed. Another pair means another deployment, never shared collateral and never a token list to get wrong.'],
]

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
            <a href="#arc">Why Arc</a>
            <a href="#safety">Safety</a>
            <a href={REPO} target="_blank" rel="noreferrer">
              Source
            </a>
          </nav>
          <Link href="/desk" className="btn btn--ink btn--sm">
            Open the desk
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <p className="hero__over">Forward contracts for USDC and EURC, on Arc</p>
            <h1 className="display">
              Fix the rate today.
              <br />
              <em>Exchange on the day you choose.</em>
            </h1>
            <p className="lede">
              Outright is an outright forward, the oldest tool in foreign exchange, rebuilt as a contract that
              can&rsquo;t default. Both sides lock their currency upfront, and each claims the other&rsquo;s on the value
              date.
            </p>
            <div className="hero__ctas">
              <Link href="/desk" className="btn btn--ink">
                Open the desk
              </Link>
              <a href="#how" className="textlink">
                How a forward settles <span aria-hidden>↓</span>
              </a>
            </div>
          </div>

          <div className="hero__art">
            <Guilloche className="hero__rosette" />
            <article className="slip" aria-label="Specimen trade confirmation">
              <header className="slip__head">
                <span>Trade confirmation</span>
                <span>No. 000142</span>
              </header>
              <p className="slip__title">Outright forward, EURC/USDC</p>
              <div className="slip__rate">
                <span className="rate rate--lg">
                  <span className="rate__big">1.17</span>
                  <span className="rate__pips">00</span>
                </span>
                <span className="slip__unit">USDC per EURC</span>
              </div>
              <dl className="slip__rows">
                <div>
                  <dt>Buyer pays</dt>
                  <dd className="usd">11,700.00 USDC</dd>
                </div>
                <div>
                  <dt>Seller delivers</dt>
                  <dd className="eur">10,000.00 EURC</dd>
                </div>
                <div>
                  <dt>Trade date</dt>
                  <dd>22 Sep 2026</dd>
                </div>
                <div>
                  <dt>Value date</dt>
                  <dd>22 Oct 2026</dd>
                </div>
              </dl>
              <footer className="slip__foot">Both legs held in full by the Outright contract on Arc.</footer>
              <span className="slip__specimen" aria-hidden>
                Specimen
              </span>
            </article>
            <SettledStamp />
          </div>
        </section>

        <section className="terms" aria-label="Terms at a glance">
          <dl>
            <div>
              <dt>Collateral</dt>
              <dd>100% of both legs</dd>
            </div>
            <div>
              <dt>Settlement</dt>
              <dd>Physical, on the value date</dd>
            </div>
            <div>
              <dt>Price source</dt>
              <dd>None needed</dd>
            </div>
            <div>
              <dt>Margin calls</dt>
              <dd>Never</dd>
            </div>
          </dl>
        </section>

        <section className="chapter story" aria-labelledby="story-title">
          <div className="chapter__side">
            <h2 id="story-title" className="display display--md">
              An invoice in euros, a budget in dollars.
            </h2>
          </div>
          <div className="chapter__main">
            <p className="prose">
              An importer owes a Berlin supplier <strong className="eur">€10,000</strong> in thirty days. Today the rate
              is 1.1700, so they post an offer to buy 10,000 EURC for <strong className="usd">11,700 USDC</strong>. An
              exporter holding euros accepts.
            </p>
            <p className="prose">
              By day thirty the euro has risen to 1.2140. Buying then would have cost 12,140 USDC. The importer claims
              their EURC at the agreed 1.1700 and pays <strong>440 USDC less</strong>. The exporter knew their price on
              day one, too. That certainty is the point.
            </p>
            <figure className="figure">
              <HedgeChart />
              <figcaption>
                <span>Fig. 1</span> Illustrative: EUR/USD over the life of the forward, against the rate locked on
                day one. Figures on this page are an example, not a live quote.
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="how" className="chapter chapter--stacked" aria-labelledby="how-title">
          <div className="chapter__side">
            <h2 id="how-title" className="display display--md">
              How a forward settles
            </h2>
            <p className="chapter__sub">Two parties, one contract, three moments.</p>
          </div>
          <figure className="figure figure--wide">
            <div className="flow-wrap">
              <FlowDiagram />
            </div>
          </figure>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="steps__n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="arc" className="chapter" aria-labelledby="arc-title">
          <div className="chapter__side">
            <h2 id="arc-title" className="display display--md">
              Why it lives on Arc
            </h2>
          </div>
          <dl className="spec chapter__main">
            {arc.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="safety" className="chapter" aria-labelledby="safety-title">
          <div className="chapter__side">
            <h2 id="safety-title" className="display display--md">
              Built so settlement can&rsquo;t fail
            </h2>
            <p className="chapter__sub">
              <a href={REPO} target="_blank" rel="noreferrer" className="textlink">
                Read the contract and tests
              </a>
            </p>
          </div>
          <dl className="spec chapter__main">
            {safety.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="closing">
          <Guilloche className="closing__rosette" size={640} />
          <div className="closing__inner">
            <h2 className="display">
              Your next invoice,
              <br />
              <em>at today&rsquo;s rate.</em>
            </h2>
            <Link href="/desk" className="btn btn--paper">
              Open the desk
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
