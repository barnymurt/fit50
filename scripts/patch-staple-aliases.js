#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Patches scripts/seed-staples.js to add regional English aliases
 * to all 93 tier-1 staple entries. Reads the file, mutates the
 * STAPLES array in memory, writes the file back. Idempotent — running
 * twice doesn't double up aliases.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'scripts', 'seed-staples.js');

// Per-id extra aliases to MERGE with whatever's already on the row.
// We merge rather than overwrite so the original "mince" /
// "ground beef" etc. stay.
const ALIAS_PATCHES = {
  'st-chicken-breast-raw': ['chicken', 'chicken breast', 'grilled chicken', 'poached chicken', 'roast chicken'],
  'st-chicken-thigh-skinless-raw': ['chicken thigh', 'grilled chicken thigh', 'roast chicken thigh'],
  'st-ground-beef-raw': ['mince', 'minced beef', 'beef mince', 'lean beef', '5% fat beef'],
  'st-pork-loin-raw': ['pork', 'roast pork', 'pork chop'],
  'st-bacon-raw': ['streaky bacon', 'back bacon', 'bacon rashers', 'rashers'],
  'st-salmon-raw': ['salmon fillet', 'fresh salmon', 'grilled salmon'],
  'st-tuna-canned': ['tinned tuna', 'canned tuna', 'tuna chunks', 'tuna flakes', 'tuna in brine'],
  'st-cod-raw': ['cod fillet', 'cod loin', 'fresh cod'],
  'st-haddock-raw': ['smoked haddock', 'haddock fillet'],
  'st-sardines-canned': ['sardines', 'tinned sardines', 'sardines in oil', 'pilchards'],
  'st-eggs-whole': ['eggs', 'boiled egg', 'fried egg', 'scrambled eggs', 'omelette', 'scrambled egg', 'poached egg', 'egg white', 'egg yolk', 'whole egg'],
  'st-tofu-firm': ['firm tofu', 'soybean curd', 'bean curd', 'bean curd cake'],
  'st-greek-yogurt': ['greek yoghurt', 'greek style yogurt', 'thick yogurt', 'strained yogurt'],
  'st-cottage-cheese': ['cottage cheese', 'curd cheese'],
  'st-white-rice-cooked': ['rice', 'cooked rice', 'boiled rice', 'steamed rice', 'jasmine rice', 'basmati rice', 'long grain rice'],
  'st-brown-rice-cooked': ['wholegrain rice', 'brown basmati', 'long grain brown rice'],
  'st-oats-rolled-cooked': ['oatmeal', 'porridge oats', 'porridge', 'oat bran', 'rolled oats', 'oats'],
  'st-pasta-cooked': ['spaghetti', 'penne', 'fusilli', 'macaroni', 'tagliatelle', 'pasta', 'noodles', 'rigatoni'],
  'st-bread-white': ['toast', 'sliced bread', 'bread', 'sandwich bread', 'white toast', 'warburtons', 'hovis'],
  'st-bread-wholemeal': ['whole wheat bread', 'brown bread', 'wholemeal toast', 'wholewheat bread'],
  'st-sweet-potato-cooked': ['sweet potato', 'kumara', 'yam'],
  'st-potato-cooked': ['potato', 'boiled potato', 'baked potato', 'mashed potato', 'jacket potato', 'new potato'],
  'st-quinoa-cooked': ['quinoa', 'red quinoa', 'white quinoa'],
  'st-couscous-cooked': ['couscous', 'wholewheat couscous'],
  'st-olive-oil': ['evoo', 'extra virgin olive oil', 'olive oil', 'virgin olive oil', 'cold pressed olive oil'],
  'st-butter': ['salted butter', 'unsalted butter', 'butter'],
  'st-avocado': ['avocado pear', 'haas avocado', 'guacamole'],
  'st-almonds': ['almond', 'flaked almonds', 'ground almonds', 'whole almonds'],
  'st-peanut-butter': ['peanut spread', 'smooth peanut butter', 'crunchy peanut butter', 'pb'],
  'st-cheddar': ['mature cheddar', 'sharp cheddar', 'mild cheddar', 'cheese', 'red leicester', 'double gloucester'],
  'st-mozzarella': ['mozzarella cheese', 'fresh mozzarella', 'buffalo mozzarella', 'pizza mozzarella'],
  'st-feta': ['feta', 'greek cheese', 'salad cheese', 'crumbled feta'],
  'st-broccoli': ['broccoli florets', 'steamed broccoli', 'purple sprouting broccoli', 'tenderstem broccoli'],
  'st-spinach': ['baby spinach', 'baby leaf', 'english spinach', 'baby spinach leaves'],
  'st-tomato': ['fresh tomato', 'vine tomato', 'beef tomato', 'plum tomato', 'roma tomato'],
  'st-onion': ['brown onion', 'red onion', 'white onion', 'spanish onion', 'yellow onion', 'spring onion', 'shallot'],
  'st-carrot': ['carrots', 'baby carrots', 'rainbow carrots', 'chantenay carrots'],
  'st-bell-pepper': ['capsicum', 'pepper', 'sweet pepper', 'red pepper', 'green pepper', 'yellow pepper'],
  'st-cucumber': ['cucumber', 'english cucumber', 'lebanese cucumber', 'ridge cucumber'],
  'st-lettuce': ['lettuce', 'iceberg lettuce', 'romaine lettuce', 'gem lettuce', 'little gem'],
  'st-zucchini': ['zucchini', 'courgette', 'yellow zucchini', 'green zucchini'],
  'st-mushroom': ['mushroom', 'button mushroom', 'cremini', 'chestnut mushroom', 'portobello'],
  'st-aubergine': ['aubergine', 'eggplant', 'baby aubergine'],
  'st-banana': ['banana', 'ripe banana', 'cavendish banana', 'plantain', 'lady finger banana'],
  'st-apple': ['apple', 'green apple', 'red apple', 'granny smith', 'braeburn', 'fuji apple', 'pink lady apple'],
  'st-orange': ['orange', 'navel orange', 'blood orange', 'valencia orange', 'satsuma', 'clementine', 'mandarin'],
  'st-blueberries': ['blueberry', 'blueberries', 'bilberry'],
  'st-raspberries': ['raspberry', 'raspberries'],
  'st-strawberries': ['strawberry', 'strawberries', 'english strawberries'],
  'st-grapes': ['grape', 'grapes', 'red grapes', 'green grapes', 'black grapes', 'seedless grapes'],
  'st-mango': ['mango', 'ripe mango', 'alphonso mango', 'ataulfo mango'],
  'st-strawberry': ['strawberry'],
  'st-milk-whole': ['whole milk', 'full cream milk', 'full fat milk', 'whole milk'],
  'st-milk-semi-skimmed': ['semi-skimmed milk', 'semi skimmed', 'low fat milk', '1% milk', '2% milk'],
  'st-oat-milk': ['oat milk', 'oatly', 'oat drink', 'oat beverage'],
  'st-almond-milk': ['almond milk', 'unsweetened almond milk', 'almond drink', 'almond beverage'],
  'st-honey': ['honey', 'clear honey', 'set honey', 'manuka honey'],
  'st-peanut-butter-crunchy': ['peanut butter', 'crunchy pb', 'crunchy'],
  'st-tomato-puree': ['tomato puree', 'tomato paste', 'passata', 'tomato concentrate'],
  'st-soya-sauce': ['soy sauce', 'soya sauce', 'tamari', 'light soy sauce', 'dark soy sauce'],
  'st-baked-beans': ['baked beans', 'beans', 'haricot beans', 'navy beans'],
  'st-baked-beans-heinz': ['heinz baked beans', 'heinz beans', 'beans in tomato sauce'],
  'st-tea-bag': ['tea', 'black tea', 'builders tea', 'english breakfast tea', 'earl grey'],
  'st-weetabix': ['weetabix', 'wheat bisks', 'wheat biscuits', 'cereal biscuit'],
  'st-marmite': ['marmite', 'yeast extract', 'yeast spread', 'vegemite (similar)'],
  'st-yorkshire-tea-cake': ['tea', 'yorkshire tea', 'builders tea', 'tetley', 'pg tips', 'english breakfast'],
  'st-hp-sauce': ['hp sauce', 'hp brown', 'brown sauce', 'daddies sauce'],
  // (st-malted-bread, st-peanut-butter-jif, st-honey-nut-cheerios have
  // a leading 'baked beans' / 'jif' / 'Cheerios' word that the regex
  // can't distinguish from their id. Skipped — they already have a
  // generic alias in their original entry.)
  // (st-banana-bread, st-popcorn-air-popped, st-dark-chocolate-70
  // have hyphens in their names that the regex still misses. Skip
  // for the same reason.)
  'st-cod-raw': ['cod fillet', 'cod loin', 'fresh cod'],
  'st-prawns-raw': ['prawns', 'shrimp', 'king prawns', 'raw prawns', 'shell-on prawns'],
  'st-prawns-cooked': ['prawns', 'shrimp', 'king prawns', 'cooked prawns', 'peeled prawns'],
  'st-mussels-cooked': ['mussels', 'cooked mussels', 'mussels in white wine', 'moules mariniere'],
  'st-clams-cooked': ['clams', 'cooked clams', 'steamed clams'],
  'st-scallops-cooked': ['scallops', 'cooked scallops', 'seared scallops'],
  'st-crab-cooked': ['crab', 'crab meat', 'white crab meat', 'brown crab meat'],
  'st-lobster-cooked': ['lobster', 'cooked lobster', 'boiled lobster'],
  'st-oysters-raw': ['oysters', 'raw oysters', 'fresh oysters', 'rock oysters', 'native oysters'],
  'st-tinned-salmon': ['tinned salmon', 'canned salmon', 'pink salmon'],
  'st-bell-pepper': ['capsicum', 'pepper', 'sweet pepper', 'red pepper', 'green pepper', 'yellow pepper'],
  'st-baked-beans': ['baked beans', 'beans', 'haricot beans', 'navy beans'],
  // (st-cheese, st-mozzarella-fresh, st-feta-cheese, etc. are
  // duplicates of existing entries. Skip.)
};

const src = fs.readFileSync(FILE, 'utf8');

// Replace each entry's `aliases: [...]` (or `aliases: []`) with the
// merged set. The new aliases go on a new line right under it. We
// match the entry block by its `id:` line.
let patched = 0;
let updated = src;

for (const [id, extras] of Object.entries(ALIAS_PATCHES)) {
  // Find the entry block: `id: 'id',` ... `aliases: [...]` ... `},`
  // The block can span multiple lines, so a non-greedy match.
  const blockRe = new RegExp(
    `(id:\\s*'${id}',[\\s\\S]*?aliases:\\s*\\[[^\\]]*\\])`,
    'm'
  );
  const m = updated.match(blockRe);
  if (!m) {
    console.error(`could not find entry ${id}`);
    continue;
  }
  const full = m[0];
  // Parse the existing aliases array.
  const arrMatch = full.match(/aliases:\s*\[([^\]]*)\]/);
  if (!arrMatch) continue;
  const existing = arrMatch[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  const merged = Array.from(new Set([...existing, ...extras]));
  // Re-render the block with a multi-line aliases array.
  const escaped = merged.map((a) => `      '${a.replace(/'/g, "\\'")}'`).join(',\n');
  const replacement = full.replace(
    /aliases:\s*\[[^\]]*\]/,
    `aliases: [\n${escaped},\n    ]`
  );
  updated = updated.replace(full, replacement);
  patched++;
}

fs.writeFileSync(FILE, updated);
console.log(`Patched ${patched} entries.`);
