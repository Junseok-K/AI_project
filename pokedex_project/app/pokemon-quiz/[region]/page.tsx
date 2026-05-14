const regionNames: Record<string, string> = {
  all: '전체 지방',
  kanto: '관동',
  johto: '성도',
  hoenn: '호연',
  sinnoh: '신오',
  unova: '하나',
  kalos: '칼로스',
  alola: '알로라',
  galar: '가라르',
  paldea: '팔데아',
};

const difficulties = [
  { slug: 'beginner', label: '초보', description: '실루엣과 여러 힌트로 풀기', color: '#22c55e', hidden: true },
  { slug: 'intermediate', label: '중수', description: '핵심 정보만 보고 풀기', color: '#f59e0b', hidden: true },
  { slug: 'expert', label: '고수', description: '최소 힌트로 도전하기', color: '#ef4444', hidden: true },
  { slug: 'silhouette-choice', label: '선택해서 맞히기', description: '', color: '#a78bfa' },
  { slug: 'silhouette', label: '입력해서 맞히기', description: '', color: '#38bdf8' },
];

interface PokemonQuizRegionPageProps {
  params: Promise<{
    region: string;
  }>;
}

export default async function PokemonQuizRegionPage({ params }: PokemonQuizRegionPageProps) {
  const { region } = await params;
  const regionName = regionNames[region] || '포켓몬';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1e1e1e] px-4 py-8 text-[#e0e0e0]">
      <main className="mx-auto w-full max-w-6xl">
        <a
          href="/pokemon-quiz"
          className="inline-block rounded-lg bg-[#007acc] px-4 py-2 font-semibold text-white transition-opacity hover:opacity-80"
        >
          지도 선택으로 돌아가기
        </a>

        <header className="mt-8">
          <h1 className="text-4xl font-bold text-[#ce9178]">{regionName}</h1>
          <p className="mt-3 text-lg text-[#bdbdbd]">퀴즈 진행 방식을 선택하세요.</p>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {difficulties.filter((difficulty) => !difficulty.hidden).map((difficulty) => (
            <a
              key={difficulty.slug}
              href={`/pokemon-quiz/${region}/${difficulty.slug}`}
              className="group rounded-lg border border-white/10 bg-[#252526] px-6 py-8 text-left transition hover:-translate-y-1 hover:border-white/25 hover:shadow-xl"
            >
              <span
                className="mb-5 block h-2 w-16 rounded-full transition group-hover:w-24"
                style={{ backgroundColor: difficulty.color }}
              />
              <span className="block text-2xl font-bold text-white">{difficulty.label}</span>
              {difficulty.description && (
                <span className="mt-3 block text-base font-semibold text-[#858585]">
                  {difficulty.description}
                </span>
              )}
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
