const pokemonMaps = [
  { generation: '전체', region: '전체 지방', color: '#007acc', route: '/pokemon-quiz/all' },
  { generation: 1, region: '관동', color: '#ef4444', route: '/pokemon-quiz/kanto' },
  { generation: 2, region: '성도', color: '#f59e0b', route: '/pokemon-quiz/johto' },
  { generation: 3, region: '호연', color: '#10b981', route: '/pokemon-quiz/hoenn' },
  { generation: 4, region: '신오', color: '#38bdf8', route: '/pokemon-quiz/sinnoh' },
  { generation: 5, region: '하나', color: '#a855f7', route: '/pokemon-quiz/unova' },
  { generation: 6, region: '칼로스', color: '#ec4899', route: '/pokemon-quiz/kalos' },
  { generation: 7, region: '알로라', color: '#22c55e', route: '/pokemon-quiz/alola' },
  { generation: 8, region: '가라르', color: '#6366f1', route: '/pokemon-quiz/galar' },
  { generation: 9, region: '팔데아', color: '#f97316', route: '/pokemon-quiz/paldea' },
];

export default function PokemonQuizPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1e1e1e] px-4 py-8 text-[#e0e0e0]">
      <main className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <a
            href="/"
            className="inline-block rounded-lg bg-[#007acc] px-4 py-2 font-semibold text-white transition-opacity hover:opacity-80"
          >
            돌아가기
          </a>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-[#ce9178]">포켓몬 퀴즈</h1>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pokemonMaps.map((map) => (
            <a
              key={map.generation}
              href={map.route}
              className="group overflow-hidden rounded-lg border border-white/10 bg-[#252526] transition hover:-translate-y-1 hover:border-white/25 hover:shadow-xl"
            >
              <div
                className="relative h-32"
                style={{
                  background: `linear-gradient(135deg, ${map.color}33, #111318 70%)`,
                }}
              >
                <div
                  className="absolute left-[12%] top-[18%] h-24 w-32 rounded-[42%_58%_45%_55%] opacity-90"
                  style={{ backgroundColor: map.color }}
                />
                <div
                  className="absolute right-[15%] top-[30%] h-20 w-24 rounded-[55%_45%_60%_40%] opacity-70"
                  style={{ backgroundColor: map.color }}
                />
                <div
                  className="absolute bottom-[16%] left-[38%] h-16 w-28 rounded-[50%_50%_42%_58%] opacity-80"
                  style={{ backgroundColor: map.color }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="absolute right-4 top-4 rounded-md bg-black/35 px-3 py-1 text-xl font-bold text-white">
                  {typeof map.generation === 'number' ? `${map.generation}세대` : map.generation}
                </div>
              </div>

              <div className="flex min-h-16 items-center justify-between px-5 py-3">
                <h2 className="text-2xl font-bold text-white">
                  {map.region.endsWith('지방') ? map.region : `${map.region} 지방`}
                </h2>
                <span className="text-2xl font-bold text-[#007acc] transition group-hover:translate-x-1">
                  &gt;
                </span>
              </div>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
