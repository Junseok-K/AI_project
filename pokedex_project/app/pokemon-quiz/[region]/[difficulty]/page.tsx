import PokemonQuizGame from './pokemon-quiz-game';

interface PokemonQuizPlayPageProps {
  params: Promise<{
    region: string;
    difficulty: string;
  }>;
}

export default async function PokemonQuizPlayPage({ params }: PokemonQuizPlayPageProps) {
  const { region, difficulty } = await params;

  return <PokemonQuizGame difficulty={difficulty} region={region} />;
}
