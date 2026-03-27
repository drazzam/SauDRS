export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">SauDRS</h1>
        <h2 className="mt-2 text-lg sm:text-xl text-gray-600">Saudi Prediabetes-to-Diabetes Risk Score</h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
          A clinical decision support system for estimating the risk of
          prediabetes-to-diabetes conversion, developed for Saudi Arabian healthcare settings.
        </p>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-xl border border-gray-200 p-5 sm:p-6 text-left bg-white">
            <h3 className="font-semibold text-[#1E3A5F]">Risk Scoring</h3>
            <p className="mt-2 text-sm text-gray-600">
              Provides a 0&ndash;100 risk score with 6 clinically-anchored risk levels,
              each with specific recommended follow-up actions.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-5 sm:p-6 text-left bg-white">
            <h3 className="font-semibold text-[#1E3A5F]">Patient Privacy</h3>
            <p className="mt-2 text-sm text-gray-600">
              All computation runs entirely in your browser. Patient data is never
              transmitted to any server. Closing or refreshing the page clears all data.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-5 sm:p-6 text-left bg-white">
            <h3 className="font-semibold text-[#1E3A5F]">Explainable Results</h3>
            <p className="mt-2 text-sm text-gray-600">
              Shows which clinical factors are driving the risk prediction,
              helping physicians understand and communicate findings to patients.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 px-4 sm:px-0">
          <a
            href="/predict"
            className="inline-block rounded-lg bg-[#1E3A5F] px-8 py-3.5 text-white font-semibold hover:bg-[#2a4f7a] transition-colors w-full sm:w-auto text-center min-h-[48px] leading-[48px] sm:leading-normal sm:min-h-0"
          >
            Open Risk Calculator
          </a>
        </div>
      </div>
    </div>
  );
}
