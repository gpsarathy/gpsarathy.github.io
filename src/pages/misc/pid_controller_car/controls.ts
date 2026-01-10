export function setupControls({
  initialSeed,
  onSeedOrRandomize,
  onTrackChange,
}: {
  initialSeed: number;
  onSeedOrRandomize: (newSeed: number, type: 'CIRCLE' | 'ELLIPSE') => void;
  onTrackChange: (type: 'CIRCLE' | 'ELLIPSE') => void;
}) {
  const select = document.getElementById('trackTypeSelect') as HTMLSelectElement | null;
  const seedInput = document.getElementById('seedInput') as HTMLInputElement | null;
  const randomizeBtn = document.getElementById('randomizeSeedBtn') as HTMLButtonElement | null;

  if (seedInput) seedInput.value = String(initialSeed);

  const readType = (): 'CIRCLE' | 'ELLIPSE' => (select ? (select.value as 'CIRCLE' | 'ELLIPSE') : 'CIRCLE');

  const handleSelectChange = () => {
    onTrackChange(readType());
  };

  const handleSeedChange = () => {
    if (!seedInput) return;
    const parsed = parseInt(seedInput.value, 10);
    if (!isNaN(parsed)) onSeedOrRandomize(parsed, readType());
  };

  const handleRandomize = () => {
    const newSeed = Math.floor(Math.random() * 2147483646) + 1;
    if (seedInput) seedInput.value = String(newSeed);
    onSeedOrRandomize(newSeed, readType());
  };

  if (select) select.addEventListener('change', handleSelectChange);
  if (seedInput) seedInput.addEventListener('change', handleSeedChange);
  if (randomizeBtn) randomizeBtn.addEventListener('click', handleRandomize);

  return () => {
    if (select) select.removeEventListener('change', handleSelectChange);
    if (seedInput) seedInput.removeEventListener('change', handleSeedChange);
    if (randomizeBtn) randomizeBtn.removeEventListener('click', handleRandomize);
  };
}
