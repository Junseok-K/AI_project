export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#1e1e1e' }}>
      <main className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: '#007acc' }}>
          내 웹페이지
        </h1>
        <p className="text-lg text-center max-w-md" style={{ color: '#e0e0e0' }}>
          안녕하세요! 이곳은 제 개인 웹페이지입니다. 간단한 소개와 콘텐츠를 공유합니다.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="/api/users"
            className="px-6 py-3 rounded-lg hover:opacity-80 transition-opacity font-semibold"
            style={{ backgroundColor: '#007acc', color: '#ffffff' }}
          >
            사용자 목록 보기
          </a>
          <a
            href="/pokemon"
            className="px-6 py-3 rounded-lg hover:opacity-80 transition-opacity font-semibold"
            style={{ backgroundColor: '#ce9178', color: '#ffffff' }}
          >
            포켓몬 도감
          </a>
        </div>
      </main>
    </div>
  );
}
