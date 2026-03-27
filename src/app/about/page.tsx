export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">About SauDRS</h1>

      <section className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Overview</h2>
        <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
          SauDRS (Saudi Prediabetes-to-Diabetes Risk Score) is a clinical decision support
          system developed at Prince Sultan Military Medical City (PSMMC), Ministry of Defense
          Health Services, Riyadh, Kingdom of Saudi Arabia.
        </p>
        <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
          The system estimates the 2-year risk of prediabetes-to-diabetes conversion using
          a validated prediction model trained on Saudi prediabetic patients.
        </p>
      </section>

      <section className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Intended Use</h2>
        <ul className="mt-2 space-y-2 text-gray-700 text-sm list-disc pl-5 leading-relaxed">
          <li><strong>Users:</strong> Licensed physicians, endocrinologists, internists, primary care practitioners</li>
          <li><strong>Population:</strong> Adults aged 18&ndash;80 with diagnosed prediabetes (HbA1c 5.7&ndash;6.4%)</li>
          <li><strong>Context:</strong> Outpatient risk stratification for follow-up intensity and intervention selection</li>
          <li><strong>NOT for:</strong> Emergency settings, pediatric patients, pregnant patients, Type 1 diabetes</li>
        </ul>
      </section>

      <section className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Privacy &amp; Security</h2>
        <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
          All computation occurs entirely in your browser. Patient data is never transmitted
          to any server. No cookies, no database, no network requests containing clinical data.
          Closing or refreshing the page clears all entered data.
        </p>
      </section>

      <section className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Clinical Disclaimer</h2>
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
          <p>
            This clinical decision support tool has been developed to assist qualified healthcare
            professionals in risk stratification for prediabetes-to-diabetes conversion.
            All predictions must be interpreted in the context of the individual patient&apos;s
            complete clinical picture. This system is not intended to serve as the sole basis
            for clinical decision-making. The developers assume no liability for clinical
            decisions made using this system.
          </p>
        </div>
      </section>
    </div>
  );
}
