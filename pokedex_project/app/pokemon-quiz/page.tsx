const pokemonMaps = [
  { generation: '전체', region: '전체 지방', image: '/pokemon_regions/region_0.png', route: '/pokemon-quiz/all' },
  { generation: 1, region: '관동', image: '/pokemon_regions/region_1.png', route: '/pokemon-quiz/kanto' },
  { generation: 2, region: '성도', image: '/pokemon_regions/region_2.png', route: '/pokemon-quiz/johto' },
  { generation: 3, region: '호연', image: '/pokemon_regions/region_3.png', route: '/pokemon-quiz/hoenn' },
  { generation: 4, region: '신오', image: '/pokemon_regions/region_4.png', route: '/pokemon-quiz/sinnoh' },
  { generation: 5, region: '하나', image: '/pokemon_regions/region_5.png', route: '/pokemon-quiz/unova' },
  { generation: 6, region: '칼로스', image: '/pokemon_regions/region_6.png', route: '/pokemon-quiz/kalos' },
  { generation: 7, region: '알로라', image: '/pokemon_regions/region_7.png', route: '/pokemon-quiz/alola' },
  { generation: 8, region: '가라르', image: '/pokemon_regions/region_8.png', route: '/pokemon-quiz/galar' },
  { generation: 9, region: '팔데아', image: '/pokemon_regions/region_9.png', route: '/pokemon-quiz/paldea' },
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
              <div className="relative h-32 overflow-hidden bg-[#111318]">
                <img
                  src={map.image}
                  alt={`${map.region} 지도`}
                  className="h-full w-full scale-[1.04] object-cover transition duration-300 group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />
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
