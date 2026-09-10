export const reactions = ['pop', 'bounce', 'wiggle', 'float', 'twirl'] as const
export type Reaction = (typeof reactions)[number]
export type Animal = {
  id: string
  name: string
  image: string
  reaction: Reaction
}
const entries = [
  ['dog', 'いぬ'],
  ['cat', 'ねこ'],
  ['rabbit', 'うさぎ'],
  ['bear', 'くま'],
  ['panda', 'ぱんだ'],
  ['elephant', 'ぞう'],
  ['giraffe', 'きりん'],
  ['monkey', 'さる'],
  ['lion', 'らいおん'],
  ['tiger', 'とら'],
  ['sheep', 'ひつじ'],
  ['cow', 'うし'],
  ['pig', 'ぶた'],
  ['horse', 'うま'],
  ['squirrel', 'りす'],
  ['fox', 'きつね'],
  ['tanuki', 'たぬき'],
  ['koala', 'こあら'],
  ['hippo', 'かば'],
  ['rhino', 'さい'],
  ['penguin', 'ぺんぎん'],
  ['duck', 'あひる'],
  ['chick', 'ひよこ'],
  ['chicken', 'にわとり'],
  ['owl', 'ふくろう'],
  ['dolphin', 'いるか'],
  ['seal', 'あざらし'],
  ['whale', 'くじら'],
  ['frog', 'かえる'],
  ['turtle', 'かめ'],
] as const
export const animals: readonly Animal[] = entries.map(([id, name], index) => ({
  id,
  name,
  image: `/animals/${id}.webp`,
  reaction: reactions[index % reactions.length],
}))
