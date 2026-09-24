export const SHOTS = {
  wide: 'wide establishing shot, 24mm lens, considered negative space',
  medium: 'medium shot, 50mm lens, clear subject separation',
  close: 'close-up detail shot, 85mm lens, shallow depth of field'
};
export const MOODS = {
  noir: 'black and white film noir, hard side lighting, deep shadows, dramatic contrast',
  soft: 'black and white cinema, soft window light, gentle tonal gradients, quiet atmosphere',
  stark: 'black and white architectural photography, stark geometry, hard sunlight, minimal composition'
};
export function validateScene(input) {
  if (!input || typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 1500) throw new Error('Describe a scene using 1–1500 characters.');
  const shot = input.shot ?? 'wide';
  const mood = input.mood ?? 'noir';
  const steps = input.steps ?? 20;
  const seed = input.seed ?? 42;
  const format = input.format ?? 'wide';
  if (!Object.hasOwn(SHOTS, shot) || !Object.hasOwn(MOODS, mood)) throw new Error('Unknown shot or lighting option.');
  if (!Number.isInteger(steps) || steps < 4 || steps > 40) throw new Error('Steps must be an integer from 4 to 40.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new Error('Seed must be an integer from 0 to 2147483647.');
  if (!['wide', 'square'].includes(format)) throw new Error('Unknown frame format.');
  return { prompt: input.prompt.trim(), shot, mood, steps, seed, format };
}
export function compileScene(scene) {
  return `${scene.prompt.replace(/\s+/g, ' ')}, ${SHOTS[scene.shot]}, ${MOODS[scene.mood]}, cinematic still, photorealistic, practical set, fine film grain, carefully composed`;
}
