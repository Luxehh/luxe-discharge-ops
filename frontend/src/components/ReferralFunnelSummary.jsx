function pctValue(part, whole) {
  if (!whole || whole <= 0) return 0
  return (part / whole) * 100
}

function pct(part, whole) {
  if (!whole || whole <= 0) return '0%'
  return `${pctValue(part, whole).toFixed(1)}%`
}

function rateColorClass(percent) {
  if (percent == null || Number.isNaN(percent)) return 'text-gray-500'
  if (percent >= 80) return 'text-emerald-700'
  if (percent >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function rateBgClass(percent) {
  if (percent == null || Number.isNaN(percent)) return 'bg-gray-100'
  if (percent >= 80) return 'bg-emerald-100'
  if (percent >= 50) return 'bg-amber-100'
  return 'bg-red-100'
}

function RateText({ part, whole, showDashWhenZeroWhole = false, bold = false }) {
  if (showDashWhenZeroWhole && (!whole || whole <= 0)) {
    return <span className="text-gray-400">—</span>
  }

  const value = pctValue(part, whole)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md ${rateBgClass(value)} ${rateColorClass(value)} ${
        bold ? 'font-bold' : 'font-semibold'
      }`}
    >
      {pct(part, whole)}
    </span>
  )
}

function SummaryCard({ label, value, subPart, subWhole }) {
  const hasSub = subPart != null && subWhole != null
  const subValue = hasSub ? pctValue(subPart, subWhole) : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {hasSub ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${rateBgClass(subValue)} ${rateColorClass(subValue)}`}
          >
            {pct(subPart, subWhole)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function SectionTable({
  title,
  total,
  totalRatePart,
  totalRateWhole,
  headerClass,
  columns,
  rows,
  emptyLabel = 'None recorded',
  rateAsDashWhenZeroWhole = false,
  totalRow = null,
}) {
  const showHeaderRate =
    totalRatePart != null && totalRateWhole != null

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div
        className={`flex items-center justify-between px-4 py-3 text-white ${headerClass}`}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-white/20 text-sm font-bold">
          {showHeaderRate
            ? `${total} (${pct(totalRatePart, totalRateWhole)})`
            : total}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm text-gray-500">{emptyLabel}</td>
                <td className="px-4 py-3 text-sm text-gray-700">0</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${rateBgClass(0)} ${rateColorClass(0)}`}
                  >
                    0%
                  </span>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.count}</td>
                  <td className="px-4 py-3 text-sm">
                    <RateText
                      part={row.ratePart}
                      whole={row.rateWhole}
                      showDashWhenZeroWhole={rateAsDashWhenZeroWhole}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {totalRow && (
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {totalRow.count}
                </td>
                <td className="px-4 py-3 text-sm font-bold">
                  <RateText
                    part={totalRow.ratePart}
                    whole={totalRow.rateWhole}
                    bold
                  />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  )
}

export default function ReferralFunnelSummary({
  houseName,
  location,
  monthLabel,
  totalDischarge,
  dischargeWithHomeHealth,
  notAbleRows,
  ableRows,
  reasons,
}) {
  const notAbleTotal = notAbleRows.reduce((sum, row) => sum + row.count, 0)
  const ableTotal = ableRows.reduce((sum, row) => sum + row.count, 0)
  const acceptedTotal = ableRows.reduce((sum, row) => sum + row.accepted, 0)
  const notAdmittedTotal = ableRows.reduce((sum, row) => sum + row.notAdmitted, 0)

  const categoryMap = new Map()

  notAbleRows.forEach((row) => {
    const reason = reasons.find((r) => r.id === row.reasonId)
    const categoryName =
      row.categoryName || reason?.categoryName || 'Uncategorized'
    const categoryId = row.categoryId || reason?.categoryId || categoryName

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        rows: [],
        total: 0,
      })
    }

    const group = categoryMap.get(categoryId)
    group.rows.push({
      key: row.reasonId || row.key,
      label: row.reasonName || reason?.name || 'Unknown',
      count: row.count,
    })
    group.total += row.count
  })

  const categorySections = Array.from(categoryMap.values()).map((group) => ({
    ...group,
    rows: group.rows.map((row) => ({
      ...row,
      ratePart: row.count,
      rateWhole: group.total,
    })),
  }))

  const ableTableRows = ableRows.map((row) => ({
    key: row.insuranceId,
    label: row.insuranceName,
    count: row.count,
    ratePart: row.count,
    rateWhole: ableTotal,
  }))

  const acceptedTableRows = ableRows.map((row) => ({
    key: `accepted-${row.insuranceId}`,
    label: row.insuranceName,
    count: row.accepted,
    ratePart: row.accepted,
    rateWhole: row.count,
  }))

  const notAdmittedTableRows = ableRows.map((row) => ({
    key: `not-admitted-${row.insuranceId}`,
    label: row.insuranceName,
    count: row.notAdmitted,
    ratePart: row.notAdmitted,
    rateWhole: row.accepted,
  }))

  return (
    <div className="w-full space-y-5">
      <div className="bg-navy text-white rounded-xl px-5 py-4">
        <h3 className="text-lg font-bold">
          {houseName}
          {location ? `, ${location}` : ''}
        </h3>
        <p className="text-sm text-white/80 mt-0.5">
          Discharge funnel{monthLabel ? ` · ${monthLabel}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <SummaryCard label="DC Total" value={totalDischarge} />
        <SummaryCard label="DC with HH" value={dischargeWithHomeHealth} />
        <SummaryCard label="Not Able to Accept" value={notAbleTotal} />
        <SummaryCard
          label="Able to Accept"
          value={ableTotal}
          subPart={ableTotal}
          subWhole={dischargeWithHomeHealth}
        />
        <SummaryCard
          label="Received/Accepted"
          value={acceptedTotal}
          subPart={acceptedTotal}
          subWhole={ableTotal}
        />
        <SummaryCard
          label="Not Admitted"
          value={notAdmittedTotal}
          subPart={notAdmittedTotal}
          subWhole={acceptedTotal}
        />
      </div>

      {categorySections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categorySections.map((section) => (
            <SectionTable
              key={section.id}
              title={`Not Able to Accept — ${section.name}`}
              total={section.total}
              headerClass="bg-rose-700"
              columns={['Reason', 'Count', `% of ${section.name}`]}
              rows={section.rows}
              totalRow={{
                count: section.total,
                ratePart: section.total,
                rateWhole: section.total || 1,
              }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionTable
          title="Able to Accept"
          total={ableTotal}
          headerClass="bg-amber-600"
          columns={['Insurance', 'Count', '% of Able to Accept']}
          rows={ableTableRows}
          totalRow={{
            count: ableTotal,
            ratePart: ableTotal,
            rateWhole: ableTotal || 1,
          }}
        />
        <SectionTable
          title="Received/Accepted"
          total={acceptedTotal}
          totalRatePart={acceptedTotal}
          totalRateWhole={ableTotal}
          headerClass="bg-emerald-700"
          columns={['Insurance', 'Count', 'Accept Rate']}
          rows={acceptedTableRows}
          rateAsDashWhenZeroWhole
          totalRow={{
            count: acceptedTotal,
            ratePart: acceptedTotal,
            rateWhole: ableTotal,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionTable
          title="Not Admitted"
          total={notAdmittedTotal}
          totalRatePart={notAdmittedTotal}
          totalRateWhole={acceptedTotal}
          headerClass="bg-teal-700"
          columns={['Insurance', 'Count', 'Not Admitted Rate']}
          rows={notAdmittedTableRows}
          rateAsDashWhenZeroWhole
          totalRow={{
            count: notAdmittedTotal,
            ratePart: notAdmittedTotal,
            rateWhole: acceptedTotal,
          }}
        />
      </div>
    </div>
  )
}
