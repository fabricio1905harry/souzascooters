import { useId, useState } from 'react'
import { Table2 } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Helpers de geometria e escala                                       */
/* ------------------------------------------------------------------ */

/** Gera ticks "redondos" (0, passo, 2×passo...) cobrindo até `max`. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const rough = max / count
  const mag = 10 ** Math.floor(Math.log10(rough || 1))
  const norm = rough / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const ticks: number[] = []
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v))
  return ticks
}

/** Path de uma barra vertical com cantos superiores arredondados (4px), base reta. */
function verticalBarPath(x: number, yTop: number, width: number, height: number, r = 4): string {
  if (height <= 0) return ''
  const rr = Math.min(r, width / 2, height)
  const yBase = yTop + height
  return `M${x},${yBase} L${x},${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} L${x + width - rr},${yTop} Q${x + width},${yTop} ${x + width},${yTop + rr} L${x + width},${yBase} Z`
}

/* ------------------------------------------------------------------ */
/* Tooltip flutuante compartilhado                                     */
/* ------------------------------------------------------------------ */

function ChartTooltip({
  leftPct,
  label,
  value,
}: {
  leftPct: number
  label: string
  value: string
}) {
  return (
    <div
      className="pointer-events-none absolute -top-1.5 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lift"
      style={{ left: `${leftPct}%` }}
      role="tooltip"
    >
      <span className="font-semibold">{value}</span>
      <span className="ml-1.5 text-white/60">{label}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Gráfico de colunas mensal (série única — vendas ou faturamento)     */
/* ------------------------------------------------------------------ */

interface MonthlyDatum {
  label: string
  value: number
}

export function MonthlyBarChart({
  title,
  subtitle,
  data,
  color,
  valueFormatter = (v) => v.toLocaleString('pt-BR'),
}: {
  title: string
  subtitle?: string
  data: MonthlyDatum[]
  color: string
  valueFormatter?: (v: number) => string
}) {
  const [active, setActive] = useState<number | null>(null)
  const [tableView, setTableView] = useState(false)
  const titleId = useId()

  const W = 560
  const H = 200
  const padTop = 16
  const padBottom = 24
  const padX = 8
  const plotH = H - padTop - padBottom
  const max = Math.max(1, ...data.map((d) => d.value))
  const ticks = niceTicks(max, 3)
  const tickMax = ticks[ticks.length - 1] || max

  const slot = (W - padX * 2) / Math.max(1, data.length)
  const barWidth = Math.min(28, slot * 0.5)

  const scaleY = (v: number) => (v / tickMax) * plotH

  return (
    <section
      className="rounded-xl border border-border bg-surface p-5"
      aria-labelledby={titleId}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 id={titleId} className="font-semibold text-text">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setTableView((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
          aria-pressed={tableView}
        >
          <Table2 className="h-3.5 w-3.5" />
          {tableView ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </div>

      {tableView ? (
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="py-1.5 font-medium">Mês</th>
              <th className="py-1.5 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border last:border-0">
                <td className="py-1.5 text-text">{d.label}</td>
                <td className="py-1.5 tabular-nums text-text">{valueFormatter(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          {active !== null && (
            <ChartTooltip
              leftPct={((active + 0.5) / data.length) * 100}
              label={data[active].label}
              value={valueFormatter(data[active].value)}
            />
          )}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[180px] w-full overflow-visible"
            role="img"
            aria-label={`${title}: ${data.map((d) => `${d.label} ${valueFormatter(d.value)}`).join(', ')}`}
          >
            {/* Gridlines horizontais (hairline, recessivas) */}
            {ticks.map((t) => {
              const y = padTop + plotH - scaleY(t)
              return (
                <g key={t}>
                  <line
                    x1={padX}
                    x2={W - padX}
                    y1={y}
                    y2={y}
                    stroke="#E2E6F0"
                    strokeWidth={1}
                  />
                  <text x={0} y={y - 3} fontSize="9" fill="#5F6577">
                    {t.toLocaleString('pt-BR')}
                  </text>
                </g>
              )
            })}

            {/* Barras */}
            {data.map((d, i) => {
              const cx = padX + slot * i + slot / 2
              const h = scaleY(d.value)
              const isLast = i === data.length - 1
              const isActive = active === i
              return (
                <g
                  key={d.label}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: ${valueFormatter(d.value)}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {/* hit target maior que a barra */}
                  <rect
                    x={cx - slot / 2}
                    y={padTop}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                  />
                  <path
                    d={verticalBarPath(cx - barWidth / 2, padTop + plotH - h, barWidth, h)}
                    fill={color}
                    opacity={isActive ? 1 : 0.9}
                  />
                  {isLast && d.value > 0 && (
                    <text
                      x={cx}
                      y={padTop + plotH - h - 6}
                      fontSize="10"
                      fontWeight={700}
                      textAnchor="middle"
                      fill="#12141C"
                    >
                      {valueFormatter(d.value)}
                    </text>
                  )}
                  <text
                    x={cx}
                    y={H - 6}
                    fontSize="9"
                    textAnchor="middle"
                    fill="#5F6577"
                  >
                    {d.label}
                  </text>
                </g>
              )
            })}

            {/* Baseline */}
            <line
              x1={padX}
              x2={W - padX}
              y1={padTop + plotH}
              y2={padTop + plotH}
              stroke="#C3C2B7"
              strokeWidth={1}
            />
          </svg>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Barras horizontais genéricas (status / categorias nominais)         */
/* ------------------------------------------------------------------ */

export interface HBarDatum {
  label: string
  value: number
  color: string
  icon?: React.ReactNode
}

export function HorizontalBarChart({
  title,
  subtitle,
  data,
  valueFormatter = (v) => v.toLocaleString('pt-BR'),
}: {
  title: string
  subtitle?: string
  data: HBarDatum[]
  valueFormatter?: (v: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const titleId = useId()

  return (
    <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby={titleId}>
      <h3 id={titleId} className="font-semibold text-text">
        {title}
      </h3>
      {subtitle && <p className="mb-3 text-xs text-muted">{subtitle}</p>}
      <ul className="mt-3 space-y-3">
        {data.map((d) => {
          const pct = (d.value / max) * 100
          return (
            <li key={d.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-text">
                  {d.icon}
                  {d.label}
                </span>
                <span className="tabular-nums font-semibold text-text">
                  {valueFormatter(d.value)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: d.color }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
