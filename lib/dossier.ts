import type { StarCount } from "@/lib/types";

export interface TokenDossier {
  ticker: string;
  name: string;
  stars: StarCount;
  business: string;
  capture: string;
  supply: string;
  verdict: string;
}

export const DOSSIER_AS_OF = "septiembre 2026";

export const TOKEN_DOSSIERS: TokenDossier[] = [
  {
    ticker: "AAVE",
    name: "Aave",
    stars: 5,
    business:
      "El marketplace de crédito DeFi. Los usuarios depositan y piden prestado; el protocolo cobra un spread. Es una empresa on-chain: hay ingresos, tesorería y gobernanza. V4 está en mainnet.",
    capture:
      "Los fees de borrowing llegan al protocolo. Desde 2025 hay buybacks de AAVE; en 2026 el presupuesto anual se recortó de ~50 M USD a ~30 M para preservar caja, pero el token sigue siendo el activo que recicla el superávit. Eso es captura real, no un logo.",
    supply:
      "Suministro acotado. El riesgo no es una lluvia de unlocks: es que el volumen de préstamos (y por tanto el buyback) caiga en bear.",
    verdict:
      "El núcleo del book. Se compra en zona porque el negocio ya existe, no porque DeFi 'vuelva'. Si el semanal invalida, se corta.",
  },
  {
    ticker: "UNI",
    name: "Uniswap",
    stars: 5,
    business:
      "El DEX de Ethereum. El flujo es el volumen spot. La pregunta nunca fue si Uniswap factura: fue si UNI cobraba.",
    capture:
      "UNIfication / protocol fees: una fracción de las fees de pools pasa al protocolo (TokenJar / quema). En 2026 esa tubería ya movió decenas de millones. Sigue siendo una fracción chica del fee total de LPs, pero el switch dejó de ser un mito.",
    supply:
      "Máximo 1 B. El drag no es vesting de VCs a esta altura; es si gobernanza vuelve a apagar el take-rate.",
    verdict:
      "Misma liga que AAVE: producto dominante + captura encendida. El TP1 (ATH previo) es donde se saca costo; el resto es ciclo.",
  },
  {
    ticker: "LINK",
    name: "Chainlink",
    stars: 5,
    business:
      "Oráculos, CCIP y servicios que bancos y DeFi ya pagan. SWIFT, Euroclear, Aave y otros lo usan en producción. No es una L1 con partnerships: es infraestructura que factura fees.",
    capture:
      "Staking y Payment Abstraction empujan fees hacia una reserva de LINK. La captura al holder no es 1:1 con el revenue de nodos, pero hay demanda estructural de token para seguridad y settlement. CCIP es el brazo que crece.",
    supply:
      "1 B máximo. Circulante alto. El techo de este ciclo es adopción + narrativa de oráculo institucional, no un unlock cliff.",
    verdict:
      "El 5★ más defendible. No entrar en 11,55: la zona está escrita (11,0–11,3 / add 9,5–10,3).",
  },
  {
    ticker: "ADA",
    name: "Cardano",
    stars: 4,
    business:
      "L1 con comunidad y ciclo propio. El negocio on-chain (DeFi, stablecoins, RWA) es menor que el de Ethereum. El token es beta de L1 en euforia, no un equity.",
    capture:
      "Fees de red en ADA. No hay buyback. La tesis es market-cap de L1 en bull, con techo de cap: TP1 a 2,00 (no el ATH 3,09) porque 3,09 era ~116 B.",
    supply:
      "Máximo ~45 B. Emisión restante suave vs. los unlocks de L2s nuevas. El riesgo es narrativa, no una fecha de cliff.",
    verdict:
      "Ciclo L1 clásico. Se respeta el techo de cap. 4★ porque el producto existe y el supply es predecible; no es 5★ porque ADA no cobra como AAVE.",
  },
  {
    ticker: "AVAX",
    name: "Avalanche",
    stars: 4,
    business:
      "L1 de subnets / L1s de empresas y DeFi. El uso real oscila; el token es el gas y el staking de la red primaria.",
    capture:
      "Fees quemadas / staking. En euforia de L1 el market cap se va lejos (TP3 220 ≈ 97 B). Eso es el escenario de manía, no el caso base.",
    supply:
      "Emisión de staking. No hay un unlock de team el martes, pero hay inflación de validadores. El piso del plan (5,68 / INV 5,5) es semanal.",
    verdict:
      "Beta de L1 con convexidad si el ciclo es agresivo. Starter 7,0–7,5; no perseguir. 4★: red real, captura mediocre, upside de ciclo alto.",
  },
  {
    ticker: "TAO",
    name: "Bittensor",
    stars: 4,
    business:
      "Mercado de inteligencia: subnets compiten por emisiones de TAO. El primer halving ya ocurrió (~10,5 M emitidos); el siguiente cerca de 15,75 M. Emisión actual ~0,5 TAO/bloque.",
    capture:
      "TAO es el colateral y el premio. Las subnets maduras pueden reciclar TAO comprando su propio alpha. Eso es mecánica interna, no un P&L de clientes Fortune 500. FDV del plan ~2× el cap circulante: ya está caro vs. float.",
    supply:
      "Máximo 21 M, estilo Bitcoin. Halvings. El float todavía sube. El riesgo es que las subnets no generen demanda externa y TAO sea solo un juego de emisiones.",
    verdict:
      "Apuesta de ciclo a AI on-chain con supply tipo BTC. 4★ por diseño monetario y narrativa; se entra solo en 180–200.",
  },
  {
    ticker: "HBAR",
    name: "Hedera",
    stars: 4,
    business:
      "Hashgraph con Hedera Council (Google, IBM, Boeing, Accenture y bancos, entre otros). Fees en USD, convertidas a HBAR. Eso enamora a empresas: costo predecible.",
    capture:
      "Las fees van a nodos del Council y tesorería, no a un burn ni a un dividendo del holder. El Council valida la red; no obliga a que HBAR se escasifique. Se puede adoptar sin que el token pague.",
    supply:
      "Máximo fijo 50 B (no se cambia sin unanimidad del Council). La tesorería libera circulante según política; el camino 25 B → 40 B+ es el drag. No es un cliff de VC: es goteo de tesorería.",
    verdict:
      "Instituciones de verdad, captura de token débil. 4★, no 5★. Se compra el descuento a la red, no el logo de Google.",
  },
  {
    ticker: "ONDO",
    name: "Ondo",
    stars: 3,
    business:
      "RWA / tesorerías tokenizadas. El producto institucional es el fondo, no necesariamente ONDO.",
    capture:
      "ONDO es gobernanza y alineación. El AUM puede crecer mientras el token diluye. Eso es el gap clásico RWA.",
    supply:
      "Máximo 10 B. Circulante ~48,7% (≈4,87 B). El próximo cliff gordo es el 18 ene 2027: ~1,7 B (ecosistema + protocol development + private sales), ~17% del supply total. Enero 2028 y 2029 siguen.",
    verdict:
      "3★: el sector es el trade de este ciclo; el token entra después del cliff o en add, no en euforia pre-unlock. INV 0,20.",
  },
  {
    ticker: "JUP",
    name: "Jupiter",
    stars: 3,
    business:
      "El aggregator de Solana. El flujo es routing y perps. El producto se usa; el token era una máquina de airdrops.",
    capture:
      "Staking / ASR. En feb 2026 el DAO aprobó Net-Zero Emissions: se postergó Jupuary (700 M JUP a un multisig comunitario) y se pausaron emisiones del team. Eso mejora el supply near-term; no convierte a JUP en un fee-switch tipo UNI.",
    supply:
      "Máximo 7 B. Circulante ~mitad. El 700 M de Jupuary queda congelado hasta otro voto. Reservas estratégicas siguen siendo un TBD.",
    verdict:
      "3★ mejorado por net-zero, no por magia de ingresos. Zonas 0,20–0,22 / add 0,16–0,17. INV 0,135.",
  },
  {
    ticker: "RAY",
    name: "Raydium",
    stars: 3,
    business:
      "AMM flagship de Solana. El volumen sigue a SOL y a memes. Fees de swap son el negocio.",
    capture:
      "Buybacks / staking de RAY existen en el diseño. No es AAVE, pero tampoco es un ticker vacío.",
    supply:
      "Máximo 555 M; mint authority off. Vesting de team/seed terminó feb 2024. Queda reserva de mining (~1,9 M RAY/año). Circulante de mercado ~mitad del max: el resto está en reservas, no en un cliff semanal.",
    verdict:
      "3★: DEX de L1 ganadora, supply ya viejo. 70% en 1,10–1,25. La nota 4,5 B → 9,5 B es el cap en TPs, no un unlock.",
  },
  {
    ticker: "LINEA",
    name: "Linea",
    stars: 3,
    business:
      "zkEVM de Consensys (MetaMask). Gas se paga en ETH, no en LINEA. LINEA no tiene gobernanza. El ledger de SWIFT con bancos (Citi y otros, piloto jul–dic 2026) usa arquitectura derivada de Linea en red permissioned: no es que los bancos paguen gas en LINEAUSDT.",
    capture:
      "Docs oficiales: 20% del surplus de fees se quema en ETH; 80% se cambia a LINEA y se quema en L1. Eso es captura potencial si hay surplus después de costos de L1. Hoy el token es overhand de ecosistema, no un equity.",
    supply:
      "Génesis 72.009.990.000. ~34% circulante. Consensys 15% locked 5 años. El 75% del Ecosystem Fund veste ~10 años (más pesado al inicio). El unlock de sep 2026 fue a Consortium (Ignition / long-term), no a holders retail.",
    verdict:
      "3★: ambición (Consensys + SWIFT) y burn dual; no hay fecha en la que los bancos paguen el token. No perseguir > 0,00287.",
  },
  {
    ticker: "ARB",
    name: "Arbitrum",
    stars: 2,
    business:
      "L2 de Ethereum con TVL y orbit chains. El token es gobernanza. El gas es ETH.",
    capture:
      "ARB no cobra el sequencer. Es voto + incentivos. El L2 puede ganar y ARB no.",
    supply:
      "10 B. Team e investors terminan vesting mar 2027. El cofundador aclaró (sep 2026) que lo locked de team/investors es ~7,7% del supply; la tesorería del DAO (~2,84 B) no es locked al estilo VC: sale con voto. Unlock mensual típico ~1,4% del supply hasta esa fecha.",
    verdict:
      "2★: L2 real, token de gobernanza con unlocks hasta 2027. 70% en 0,09–0,11. INV 0,07.",
  },
  {
    ticker: "ENA",
    name: "Ethena",
    stars: 2,
    business:
      "USDe: dólar sintético con basis/hedge. El producto factura cuando hay funding y AUM. El riesgo es el mecanismo (exchange, funding negativo, custodia).",
    capture:
      "Hay propuesta de fee switch / buybacks si USDe llega a umbrales (el primero citado: 7,5 B). Hasta que eso esté on-chain y el AUM lo justifique, ENA es un claim sobre un stablecoin cíclico.",
    supply:
      "15 B máximo. Circulante ~9,8 B (~65%). Team veste hasta ~mar 2028. En 2026 rearmaron investors: buyout de sellers + unlock concentrado hacia el 5 oct 2026 (fin del goteo mensual de VCs; un tramo puede ser muy grande). Dilución a 15 B sigue siendo el techo.",
    verdict:
      "2★: producto con revenue, token con 15 B y eventos de supply. Starter 0,138–0,145; el size grande es add/pánico. INV 0,065.",
  },
  {
    ticker: "ASTER",
    name: "Aster",
    stars: 2,
    business:
      "DEX de perps. 99% de las fees diarias compran ASTER para stakers (veASTER). Por cada buyback se quema el mismo monto de reserva (prioridad: team) hasta supply 3 B.",
    capture:
      "El buyback va a stakers, no a un holder spot pasivo. Quienes no stakean no cobran el 99%. El burn reduce reserva, no necesariamente el float de inmediato.",
    supply:
      "Confirmado el 1 sep 2026 por Aster: el cliff del team (400 M ASTER, 5% del max, 10 M/mes) se atrasó 12 meses, de 17 sep 2026 a 17 sep 2027. El team sigue 0% unlocked. Eso alivia 2026–27, no cancela el resto: airdrop 53,5% gotea ~80 meses; ecosystem pasó a emisiones de staking; tesorería 7% locked. La liquidez de listing (4,5%) ya salió en el TGE.",
    verdict:
      "El atraso del team es real y es bueno para el overhang de 2026. Sigue 2★: perp token, airdrop largo, captura vía stake. Zonas 0,585–0,62 / 0,507 / 0,403. INV 0,39.",
  },
  {
    ticker: "RON",
    name: "Ronin",
    stars: 2,
    business:
      "L1 de juegos (Sky Mavis / Axie). El uso sigue a un vertical: si el gamefi no es el tema del bull, RON no es AVAX.",
    capture:
      "Gas y staking. Sky Mavis tiene el 30%. No hay fee-switch tipo UNI.",
    supply:
      "Máximo 1 B a lo largo de ~108 meses desde 2022. Rewards 25%, community 30%, Sky Mavis 30%, ecosystem 15%. El circulante reportado se alineó al whitepaper (re-lock 2025). Sigue diluyendo hacia 1 B. ATH 4,45 era ~3,4 B de cap; el FDV a 1 B es otra película. No perseguir > 0,063.",
    verdict:
      "2★: supply path a 1 B y negocio de games. Compra 0,049–0,056 / add 0,046–0,047. INV 0,044.",
  },
];

export function dossierByTicker(ticker: string): TokenDossier | undefined {
  return TOKEN_DOSSIERS.find((item) => item.ticker === ticker);
}
