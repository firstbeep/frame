export const SHOTS = {
  wide: 'wide establishing photograph, 24mm lens',
  medium: 'medium photograph, 50mm lens, clear subject separation',
  close: 'close-up photograph, 85mm lens, shallow depth of field'
};
export const MOODS = {
  daylight: 'natural daylight, accurate colors, balanced exposure',
  golden: 'warm late-afternoon sunlight, natural colors, soft long shadows',
  studio: 'large softbox lighting, true-to-life colors, clean studio photography',
  soft: 'soft window light, natural colors, gentle shadows',
  noir: 'dramatic side lighting, natural colors, deep shadows',
  stark: 'hard sunlight, natural colors, architectural contrast'
};
export const FORMATS = { wide: [1152, 768], square: [1024, 1024], portrait: [768, 1152] };
export function validateScene(input) {
  if (!input || typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 1000) throw new Error('Describe a scene using 1–1000 characters. Put crew instructions in Shot notes.');
  const shot = input.shot ?? 'medium';
  const mood = input.mood ?? 'daylight';
  const steps = input.steps ?? 28;
  const seed = input.seed ?? 42;
  const format = input.format ?? 'wide';
  const title = input.title ?? 'Untitled shot';
  const notes = input.notes ?? '';
  if (typeof title !== 'string' || title.length > 80 || typeof notes !== 'string' || notes.length > 800) throw new Error('Shot title must fit 80 characters and notes 800 characters.');
  if (!Object.hasOwn(SHOTS, shot) || !Object.hasOwn(MOODS, mood)) throw new Error('Unknown shot or lighting option.');
  if (!Number.isInteger(steps) || steps < 12 || steps > 40) throw new Error('Steps must be an integer from 12 to 40.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new Error('Seed must be an integer from 0 to 2147483647.');
  if (!Object.hasOwn(FORMATS, format)) throw new Error('Unknown frame format.');
  return { prompt: input.prompt.trim(), title: title.trim() || 'Untitled shot', notes: notes.trim(), shot, mood, steps, seed, format };
}
export function compileScene(scene) {
  // Subject first; avoid conflicting cinematic/grain/style suffixes.
  return `${scene.prompt.replace(/\s+/g, ' ')}, ${SHOTS[scene.shot]}, ${MOODS[scene.mood]}, realistic materials, professional photography`;
}
