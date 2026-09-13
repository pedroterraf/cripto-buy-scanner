"use client";

import { TOKENS } from "@/lib/tokens";
import { formatPrice, formatZoneRange } from "@/lib/format";

export function ThesisView() {
  return (
    <article className="thesis">
      <section>
        <h2>Qué trata este proyecto</h2>
        <p>
          Herramienta personal para un plan de ciclo 2026–2029, no un bot ni
          un consejo de inversión. Compara el spot de Binance (pares USDT)
          con zonas de compra del semanal: demanda, piso de rango y ATL. El
          % es sobre lo que vas a meter en ese token, no del portfolio. Tocá
          la card y el semanal se abre acá. No es asesoramiento financiero.
        </p>
        <p>
          La tesis es comprar barato (drawdown vs ATH + cap vs negocio) y
          vender en el bull entero: 20% ATH viejo / 30% ATH nuevo / 50%
          euforia. El primer techo semanal no es destino.
        </p>
      </section>
      <section>
        <h2>Qué no es</h2>
        <ul>
          <li>No predice el timing. Si la zona no llega, no se persigue.</li>
          <li>
            No lee Bitcoin. Semanal &lt; 76k frena zona 1; &lt; 62k solo
            pánico: eso lo mirás vos.
          </li>
          <li>No dibuja H&amp;S ni Elliott. Estructura + niveles + cap.</li>
          <li>
            El cruce dorado / de la muerte confirma tendencia, no dispara la
            compra.
          </li>
          <li>Invalidación = cierre semanal, no un wick intradía. El daily confirma, no mueve las zonas.</li>
        </ul>
      </section>
      <section>
        <h2>El gráfico</h2>
        <p>
          Semanal o diario, a elección. Las zonas, INV y TPs son los mismos
          precios (el plan no cambia). Cambian las velas y las SMA 50/200
          de ese timeframe. Escala log. Las flechas marcan cruces de ese
          gráfico.
        </p>
        <p>
          Cruce dorado = SMA 50 cruza arriba de la 200. Cruce de la muerte =
          SMA 50 cruza abajo. Diario es la definición clásica; semanal
          confirma el ciclo. Llegan tarde: no se compra ni se vende por el
          cruce.
        </p>
      </section>
      <section>
        <h2>Cómo comprar</h2>
        <ul>
          <li>3 zonas: 30% starter / 40% add / 30% pánico.</li>
          <li>2 zonas: 40% arriba / 60% más barata.</li>
          <li>
            1 zona: 70% en el rango, 30% reserva si perfora y el semanal no
            cierra bajo INV.
          </li>
        </ul>
      </section>
      <section>
        <h2>Cómo vender (ciclo, no swing)</h2>
        <ul>
          <li>20% en el ATH previo (o techo de cap: ADA 2,00 no 3,09).</li>
          <li>30% en un máximo nuevo (~1,5× el ATH viejo).</li>
          <li>50% euforia / ~2× ATH, trailing por cierre semanal.</li>
        </ul>
      </section>
      <section>
        <h2>Los 15 del escáner</h2>
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
        <h2>Bitcoin (manual)</h2>
        <p>
          Semanal &lt; 76k: no llenar zona 1. Semanal &lt; 62k: solo pánico.
          Esta app no consulta BTC.
        </p>
      </section>
      <section>
        <h2>Pros</h2>
        <ul>
          <li>Precio escrito: no “comprar porque bajó un 20%”.</li>
          <li>El semanal filtra ruido. INV es cierre, no wick.</li>
          <li>El % ya está decidido: no improvisás en caliente.</li>
          <li>Las ventas miran el bull entero.</li>
        </ul>
      </section>
      <section>
        <h2>Contras</h2>
        <ul>
          <li>No dice cuándo llega la zona.</li>
          <li>Si el piso no se retestea, no llenás el add.</li>
          <li>ASTER, ENA, ONDO, JUP, TAO diluyen.</li>
          <li>El cruce llega tarde. Tokens nuevos pueden no tener SMA 200 semanal.</li>
        </ul>
      </section>
      <section>
        <h2>Lo más importante</h2>
        <ul>
          <li>Hoy suele haber 1–3 tokens en zona, y solo ese tramo.</li>
          <li>No all-in. No perseguir. Sacar costo en el ATH o techo de cap.</li>
          <li>SMA 50/200 confirman, no disparan.</li>
          <li>Si BTC semanal pierde 76k, zona 1 se pausa aunque la card esté en oro.</li>
        </ul>
      </section>
    </article>
  );
}
