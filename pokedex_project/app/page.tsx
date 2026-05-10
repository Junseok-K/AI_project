export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1e1e1e]">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <h1 className="mb-4 text-4xl font-bold text-[#007acc]">포켓몬 도감</h1>
        <p className="max-w-md text-center text-lg text-[#e0e0e0]">
          포켓몬 정보를 검색하고 세대별로 탐색할 수 있는 도감입니다.
        </p>
        <div className="mt-8">
          <a
            href="/pokemon"
            className="rounded-lg bg-[#ce9178] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-80"
          >
            도감 열기
          </a>
        </div>
      </main>
    </div>
  );
}
