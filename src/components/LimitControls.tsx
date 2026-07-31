import { View } from 'react-native';

import { useGame } from '../game/GameContext';
import { LIMIT_STEP, TOURS_STEP, type Mode, roundsPerTour } from '../game/limit';
import { Notice, Segmented, StepperRow } from './ui';

const MODES: { key: Mode; label: string }[] = [
  { key: 'points', label: 'Aux points' },
  { key: 'tours', label: 'Aux tours' },
];

/**
 * Choix de la condition d'arrêt et de sa valeur. Utilisé à la configuration
 * comme en cours de partie.
 */
export default function LimitControls({
  /** Nombre de joueurs, pour expliquer un tour en manches. */
  playerCount,
}: {
  playerCount: number;
}) {
  const { state, setMode, setScoreLimit, setTourLimit } = useGame();
  const { mode, scoreLimit, tourLimit, endSuspended } = state;

  const perTour = roundsPerTour(playerCount);

  return (
    <View style={{ gap: 10 }}>
      <Segmented options={MODES} value={mode} onChange={setMode} />

      {mode === 'points' ? (
        <StepperRow
          title="Limite de points"
          hint="Le premier qui l'atteint termine la partie"
          value={`${scoreLimit}`}
          onMinus={() => setScoreLimit(scoreLimit - LIMIT_STEP)}
          onPlus={() => setScoreLimit(scoreLimit + LIMIT_STEP)}
        />
      ) : (
        <StepperRow
          title="Nombre de tours"
          hint={
            playerCount
              ? `Un tour = ${perTour} manches, soit ${tourLimit * perTour} au total`
              : 'Un tour = une manche par joueur'
          }
          value={`${tourLimit}`}
          onMinus={() => setTourLimit(tourLimit - TOURS_STEP)}
          onPlus={() => setTourLimit(tourLimit + TOURS_STEP)}
        />
      )}

      {endSuspended ? (
        <Notice>
          Partie prolongée : la condition d'arrêt est déjà franchie, elle est
          donc en sommeil. Relevez-la pour la réactiver, ou arrêtez la partie
          depuis le tableau.
        </Notice>
      ) : null}
    </View>
  );
}
