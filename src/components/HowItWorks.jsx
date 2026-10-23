import { useLang } from '../i18n/LanguageContext'

/**
 * Cara Token Berfungsi — 4 langkah proses token, dalam kad
 * putih/hijau korporat dengan nombor serif:
 * Daftar (10 token percuma) → Cari lead → Tukar 1 token → Top-up CHIP.
 *
 * Teks langkah disimpan sebagai kunci i18n; bahasa dipilih semasa render.
 */
const STEPS = [
  { n: '1', titleKey: 'how.step1.title', textKey: 'how.step1.text', cta: 'register' },
  { n: '2', titleKey: 'how.step2.title', textKey: 'how.step2.text' },
  { n: '3', titleKey: 'how.step3.title', textKey: 'how.step3.text' },
  { n: '4', titleKey: 'how.step4.title', textKey: 'how.step4.text', cta: 'topup' },
]

export default function HowItWorks({ onRegister, onTopUp }) {
  const { t } = useLang()

  return (
    <section>
      <h2 className="sec-title">{t('how.title')}</h2>
      <p className="sec-sub">{t('how.sub')}</p>
      <div className="grid3">
        {STEPS.map((s) => (
          <div className="card stepcard" key={s.n}>
            <div className="stepnum">{s.n}</div>
            <h3>{t(s.titleKey)}</h3>
            <p>{t(s.textKey)}</p>
            {s.cta === 'register' && (
              <button type="button" className="lnk" onClick={onRegister}>
                {t('how.ctaRegister')}
              </button>
            )}
            {s.cta === 'topup' && (
              <button type="button" className="lnk" onClick={onTopUp}>
                {t('how.ctaTopup')}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
