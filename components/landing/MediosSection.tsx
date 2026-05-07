const MEDIOS = ['TV', 'Radio', 'OOH', 'DOOH', 'Digital', 'Impresos', 'Cine']

export function MediosSection() {
  return (
    <section style={{ background: 'var(--color-bg-subtle)', padding: '48px 0' }}>
      <div className="max-w-6xl mx-auto px-6">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          Evalúa publicidad en todos los medios
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {MEDIOS.map((medio) => (
            <span key={medio} className="medio-pill">
              {medio}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
