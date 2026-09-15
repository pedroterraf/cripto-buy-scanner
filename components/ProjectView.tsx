"use client";

import { DOSSIER_AS_OF, TOKEN_DOSSIERS, dossierByTicker } from "@/lib/dossier";
import { TOKENS } from "@/lib/tokens";
import { formatPrice, formatZoneRange } from "@/lib/format";
import type { StarCount } from "@/lib/types";

const STAR_SLOTS = [1, 2, 3, 4, 5] as const;

interface ProjectViewProps {
  ticker: string | null;
  showGuide: boolean;
  fromZonas: boolean;
  onBack: () => void;
  onOpenToken: (ticker: string) => void;
  onOpenGuide: () => void;
}

function StarRow({ stars, labeled = true }: { stars: StarCount; labeled?: boolean }) {
  return (
    <span className="stars" aria-hidden={labeled ? undefined : true} aria-label={labeled ? `${stars} de 5` : undefined}>
      {STAR_SLOTS.map((slot) => (
        <span key={slot} className={slot <= stars ? "on" : "off"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProjectView({
  ticker,
  showGuide,
  fromZonas,
  onBack,
  onOpenToken,
  onOpenGuide,
}: ProjectViewProps) {
  if (showGuide) {
    return <GuideView onBack={onBack} />;
  }

  const item = ticker ? dossierByTicker(ticker) : undefined;
  if (item) {
    return (
      <TokenDossierView
        ticker={item.ticker}
        fromZonas={fromZonas}
        onBack={onBack}
      />
    );
  }

  return (
    <ProjectCatalog onBack={onBack} onOpenToken={onOpenToken} onOpenGuide={onOpenGuide} />
  );
}

function ProjectCatalog({
  onBack,
  onOpenToken,
  onOpenGuide,
}: {
  onBack: () => void;
  onOpenToken: (ticker: string) => void;
  onOpenGuide: () => void;
}) {
  return (
    <div className="project-view">
      <header className="project-bar">
        <button className="back" type="button" onClick={onBack} aria-label="Volver a zonas">
          ←
        </button>
        <div className="bar-main">
          <h1>Proyectos</h1>
          <p className="stamp">Fundamentos · {DOSSIER_AS_OF}</p>
        </div>
        <button className="bar-link" type="button" onClick={onOpenGuide}>
          Reglas
        </button>
      </header>
      <div className="project-catalog">
        <div className="project-grid">
          {TOKEN_DOSSIERS.map((item) => (
            <button
              key={item.ticker}
              type="button"
              className="pick-card"
              aria-label={`${item.ticker}, ${item.stars} de 5, abrir ficha`}
              onClick={() => onOpenToken(item.ticker)}
            >
              <span className="pick-top">
                <span className="pick-ticker">{item.ticker}</span>
                <StarRow stars={item.stars} labeled={false} />
              </span>
              <span className="pick-name">{item.name}</span>
              <span className="pick-verdict">{item.verdict}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenDossierView({
  ticker,
  fromZonas,
  onBack,
}: {
  ticker: string;
  fromZonas: boolean;
  onBack: () => void;
}) {
  const item = dossierByTicker(ticker);
  const plan = TOKENS.find((token) => token.ticker === ticker);
  if (!item) return null;

  return (
    <div className="project-view">
      <header className="project-bar">
        <button
          className="back"
          type="button"
          onClick={onBack}
          aria-label={fromZonas ? "Volver a zonas" : "Volver a proyectos"}
        >
          ←
        </button>
        <div className="bar-main">
          <h1>{item.ticker}</h1>
          <p className="stamp">{item.name}</p>
        </div>
      </header>
      <div className="dossier-page">
        <article className="dossier-body">
          <div className="dossier-id">
            <p className="dossier-kicker">Ficha</p>
            <h2>
              {item.ticker} · {item.name} <StarRow stars={item.stars} />
            </h2>
            {plan ? (
              <p className="dossier-plan">
                {plan.zones
                  .map((zone) => zone.label + " " + formatZoneRange(zone, plan.digits))
                  .join(" · ")}
                {plan.invalidation != null
                  ? " · INV < " + formatPrice(plan.invalidation, plan.digits)
                  : ""}
                {" · "}
                {plan.tps
                  .map((tp) => tp.label + " " + formatPrice(tp.price, plan.digits))
                  .join(" / ")}
              </p>
            ) : null}
          </div>
          <div className="dossier-copy">
            <p>
              <b>Negocio.</b> {item.business}
            </p>
            <p>
              <b>Captura.</b> {item.capture}
            </p>
            <p>
              <b>Supply.</b> {item.supply}
            </p>
            <p>
              <b>Veredicto.</b> {item.verdict}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

function GuideView({ onBack }: { onBack: () => void }) {
  return (
    <div className="project-view">
      <header className="project-bar">
        <button className="back" type="button" onClick={onBack} aria-label="Volver a proyectos">
          ←
        </button>
        <div className="bar-main">
          <h1>Reglas</h1>
          <p className="stamp">Plan · {DOSSIER_AS_OF}</p>
        </div>
      </header>
      <article className="thesis guide-copy">
        <section>
          <h2>Por qué existe esto</h2>
          <p>
            Herramienta personal para un plan de ciclo 2026–2029. No es un bot, no
            predice el día, no es consejo de inversión. Compara el spot de Binance
            (USDT) con zonas del semanal: demanda, piso de rango y ATL. El % es de lo
            que vas a meter en ese token, no del portfolio.
          </p>
          <p>
            La tesis es comprar barato (drawdown vs ATH + cap vs negocio) y vender
            el bull entero: 20% ATH viejo / 30% ATH nuevo / 50% euforia. El primer
            techo semanal no es destino. Las estrellas miden potencial de ciclo
            (si el token cobra). La lista ordena cuándo actuar: venta (TP más
            alto primero), compra (zona más baja primero), espera con filtro
            cerca de compra o de venta.
          </p>
        </section>

        <section>
          <h2>Reglas que no se negocian</h2>
          <ul>
            <li>Si la zona no llega, no se persigue.</li>
            <li>
              La app no lee Bitcoin. Semanal &lt; 76k frena zona 1; &lt; 62k solo
              pánico. Eso lo mirás vos.
            </li>
            <li>Invalidación = cierre semanal, no un wick. El daily confirma, no mueve zonas.</li>
            <li>SMA 50/200 confirman tendencia. No disparan la compra ni la venta.</li>
            <li>Hoy suele haber 1–3 tokens en zona, y solo ese tramo.</li>
          </ul>
        </section>

        <section>
          <h2>Cómo comprar y vender</h2>
          <ul>
            <li>3 zonas: 30% starter / 40% add / 30% pánico.</li>
            <li>2 zonas: 40% arriba / 60% más barata.</li>
            <li>1 zona: 70% en el rango, 30% reserva si perfora y el semanal no cierra bajo INV.</li>
            <li>Venta: 20% ATH previo o techo de cap · 30% máximo nuevo (~1,5×) · 50% euforia / ~2×, trailing semanal.</li>
          </ul>
        </section>

        <section>
          <h2>Cómo leer las estrellas</h2>
          <ul>
            <li>5 — el token ya tiene (o está a un switch de) caja: AAVE, UNI, LINK.</li>
            <li>4 — red/producto serio, captura floja o dilución de tesorería: ADA, AVAX, TAO, HBAR.</li>
            <li>3 — negocio plausible, tokenomics o timing flojos: RAY, ONDO, JUP, LINEA.</li>
            <li>2 — unlocks, dilución o captura dudosa: ARB, ENA, ASTER, RON.</li>
          </ul>
        </section>

        <section>
          <h2>Tabla de disparo</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Compra</th>
                  <th>INV</th>
                  <th>TP1</th>
                  <th>TP2</th>
                  <th>TP3</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {TOKENS.map((token) => (
                  <tr key={token.ticker}>
                    <td>{token.ticker}</td>
                    <td>
                      {token.zones
                        .map(
                          (zone) =>
                            formatZoneRange(zone, token.digits) + " " + zone.pct + "%",
                        )
                        .join(" · ")}
                    </td>
                    <td>
                      {token.invalidation == null
                        ? "—"
                        : "< " + formatPrice(token.invalidation, token.digits)}
                    </td>
                    {token.tps.map((tp) => (
                      <td key={tp.label}>{formatPrice(tp.price, token.digits)}</td>
                    ))}
                    <td>{token.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Fuera del escáner</h2>
          <ul>
            <li>APT: 0,51–0,55. TP 19,92 / 30 / 40.</li>
            <li>AR: starter 2,55 · add 1,70 / 1,49. INV &lt; 1,40. TP 91 / 130 / 180.</li>
            <li>XMR y ZEC: ya corrieron. No add.</li>
          </ul>
        </section>

        <section>
          <h2>Pros</h2>
          <ul>
            <li>Precio escrito. No se compra porque bajó un 20%.</li>
            <li>El semanal filtra ruido. INV es cierre, no mecha.</li>
            <li>El % ya está decidido: no se improvisa en caliente.</li>
            <li>Las ventas miran el bull entero, no el primer techo.</li>
            <li>Las estrellas separan calidad de timing: un 2★ en zona se llena; un 5★ caro se espera.</li>
          </ul>
        </section>

        <section>
          <h2>Contras</h2>
          <ul>
            <li>No dice cuándo llega la zona. Si el piso no se retestea, no hay add.</li>
            <li>ONDO tiene cliff ene 2027. ENA puede concentrar investors ~5 oct 2026. ARB gotea hasta mar 2027.</li>
            <li>ASTER atrasó el team a sep 2027; el airdrop sigue 80 meses. LINEA veste a 10 años sobre 72 B.</li>
            <li>HBAR: Council ≠ captura. Fees a nodos/tesorería.</li>
            <li>El cruce SMA llega tarde. Tokens nuevos pueden no tener SMA 200 semanal.</li>
            <li>Si BTC semanal pierde 76k, zona 1 se pausa aunque la card esté en oro.</li>
          </ul>
        </section>

        <section>
          <h2>Conclusión</h2>
          <p>
            El edge no es adivinar el fondo. Es no pagar euforia y no financiar
            unlocks. Técnico: zonas y TPs del semanal, daily como testigo, BTC
            76k/62k a mano. Fundamental: size grande solo donde el token cobra
            (AAVE, UNI, LINK). El resto es satellite con el % ya escrito.
          </p>
          <p>
            Prioridad de capital cuando las zonas vengan: 5★ primero, 4★ como
            beta de ciclo (ADA/AVAX/TAO/HBAR) con el drag de supply en la cabeza,
            3★ después de sus cliffs (ONDO ene 2027; JUP ya sin Jupuary 2026).
            2★ solo en el tramo barato y chico: ARB hasta que termine vesting,
            ENA contra 15 B y el evento de octubre, ASTER con team corrido a 2027
            pero airdrop vivo, RON hacia 1 B.
          </p>
          <p>
            SWIFT/Linea y el Council de Hedera son reales y no alcanzan para
            subir de estrella: el piloto de SWIFT no liquida en LINEA público;
            HBAR no le paga al holder. Quien ignore eso va a confundir un press
            release con un P&amp;L.
          </p>
          <p>
            Fuentes de supply y captura consultadas en {DOSSIER_AS_OF}: docs de
            Linea (tokenomics / dual-burn), Aster (tokenomics + anuncio 1 sep 2026
            del cliff), Hedera Council (tesorería, max 50 B), Jupiter DAO
            (Net-Zero), Ethena Foundation (investors / oct 2026), Arbitrum
            (Goldfeder, vesting mar 2027), Ondo (cliff ene 2027), Raydium docs,
            Ronin docs, gobernanza Aave (buybacks), UNIfication.
          </p>
        </section>
      </article>
    </div>
  );
}
