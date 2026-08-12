'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Fraunces, Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--dk-font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--dk-font-body',
  display: 'swap',
});

/* ============================================================
   Taxonomy
   ============================================================ */
const FLAVOURS = {
  citrus:   'Citrus & Zesty',
  berry:    'Berry & Fruity',
  herbal:   'Herbal & Green',
  warming:  'Warming & Spiced',
  ginger:   'Ginger & Sharp',
  tropical: 'Tropical',
  coffee:   'Coffee & Chocolate',
  creamy:   'Creamy & Dessert-like',
  floral:   'Tart & Floral',
} as const;

const OCCASIONS = {
  everyday:    'Everyday hydration',
  postworkout: 'Post-workout',
  afternoon:   'Afternoon pick-me-up',
  dinner:      'Dinner mocktail',
  party:       'Party / celebration',
  cosy:        'Cosy evening',
  dessert:     'Dessert replacement',
  batch:       'Batch & top up',
} as const;

type FlavourKey = keyof typeof FLAVOURS;
type OccasionKey = keyof typeof OCCASIONS;

interface Macros { c: number; p: number; f: number; }

interface Drink {
  n: number;
  name: string;
  kcal: string;
  servings: number;
  size: string;
  effort: string;
  keeps: string;
  blurb: string;
  ingredients: string[];
  method: string[];
  flavour: FlavourKey[];
  occasions: OccasionKey[];
  macros?: Macros;
  batch_note?: string;
}

/* ============================================================
   Data — 50 drinks
   ============================================================ */
const DRINKS: Drink[] = [
  { n: 1, name: 'Lemon–Mint Cooler', kcal: '5–10', servings: 4, size: '250 ml', effort: '5 min + chill', keeps: '3 days refrigerated', blurb: 'Fresh mint and citrus. As close to free calories as drinks get.', ingredients: ['1 lemon, sliced', '1 large handful fresh mint', '1 L cold water', 'Ice', 'Zero-calorie sweetener (optional)'], method: ['Muddle the mint lightly.', 'Add lemon and water to a jug.', 'Refrigerate 2–4 hours; strain if you prefer a clean serve.', 'Top up with 250–500 ml water as the infusion gets stronger.'], flavour: ['citrus', 'herbal'], occasions: ['everyday'] },
  { n: 2, name: 'Cucumber Lime Water', kcal: '5', servings: 4, size: '250 ml', effort: '3 min + chill', keeps: '2–3 days refrigerated', blurb: 'Cool, clean, impossible to overthink. Spa-water simple.', ingredients: ['½ cucumber, thinly sliced', '1 lime, sliced', '1 L water', 'Fresh mint (optional)'], method: ['Combine everything in a jug.', 'Refrigerate for 2–4 hours before serving.', 'Remove cucumber after ~24 hours for best flavour.'], flavour: ['citrus', 'herbal'], occasions: ['everyday'] },
  { n: 3, name: 'Raspberry & Lime Infusion', kcal: '10', servings: 4, size: '250 ml', effort: '2 min + overnight', keeps: '3 days refrigerated', blurb: 'Overnight jug of frozen raspberries and lime. Pink and cheap.', ingredients: ['75 g frozen raspberries', '1 lime, sliced', '1 L water', 'Mint (optional)'], method: ['Add everything to a jug.', 'Refrigerate overnight.', 'Serve over ice. Frozen berries make this particularly cheap.'], flavour: ['berry', 'citrus'], occasions: ['everyday'] },
  { n: 4, name: 'Strawberry Basil Cooler', kcal: '12', servings: 4, size: '250 ml', effort: '5 min + chill', keeps: '2–3 days refrigerated', blurb: 'Strawberries and basil sound fancy; the recipe is four steps.', ingredients: ['100 g strawberries, sliced', '5–8 basil leaves', '1 L water', '½ lemon, sliced'], method: ['Lightly crush the strawberries for more flavour.', 'Add basil, lemon and water.', 'Refrigerate 3–4 hours before serving.'], flavour: ['berry', 'herbal'], occasions: ['everyday'] },
  { n: 5, name: 'Ginger Lemon Water', kcal: '5', servings: 4, size: '250 ml', effort: '15 min + cool', keeps: '4–5 days refrigerated', blurb: 'One pot, four days. The workhorse batch drink.', ingredients: ['20–30 g fresh ginger, sliced', '1 lemon', '1 L water'], method: ['Simmer the ginger in ~500 ml water for 10 minutes.', 'Cool, then add lemon juice.', 'Top up with cold water to reach 1 L.', 'Dilute further to taste.'], flavour: ['ginger', 'citrus'], occasions: ['batch', 'postworkout'] },
  { n: 6, name: 'Iced Green Tea & Lemon', kcal: '2', servings: 4, size: '250 ml', effort: '5 min + cool', keeps: '3–4 days refrigerated', blurb: 'Two calories. Bottomless. The everyday default.', ingredients: ['3 green tea bags', '1 L water', '½ lemon', 'Ice', 'Zero-calorie sweetener (optional)'], method: ['Steep tea in hot water for 3–4 minutes.', 'Cool completely.', 'Add lemon and refrigerate. Serve over ice.'], flavour: ['herbal', 'citrus'], occasions: ['everyday'] },
  { n: 7, name: 'Peach Iced Tea', kcal: '10–15', servings: 4, size: '250 ml', effort: '5 min + overnight', keeps: '3–4 days refrigerated', blurb: 'Frozen peach does the heavy lifting. No sugar syrup required.', ingredients: ['3 black tea bags', '100 g frozen peach', '1 L water', 'Zero-calorie sweetener (optional)'], method: ['Brew the tea in hot water.', 'Add frozen peach while cooling — it releases flavour as it thaws.', 'Refrigerate overnight, then strain and serve.'], flavour: ['tropical', 'herbal'], occasions: ['afternoon'] },
  { n: 8, name: 'Apple & Cinnamon Iced Tea', kcal: '5–10', servings: 4, size: '250 ml', effort: '8 min + chill', keeps: '3 days refrigerated', blurb: 'Autumn in a jug. Warms up cold; brews up cheap.', ingredients: ['3 black tea bags', '½ apple, thinly sliced', '1 cinnamon stick', '1 L water'], method: ['Brew the tea with the cinnamon stick for 5 minutes.', 'Cool, then add the sliced apple.', 'Refrigerate at least 2 hours before serving.'], flavour: ['warming', 'herbal'], occasions: ['cosy'] },
  { n: 9, name: 'Hibiscus Berry Cooler', kcal: '5–10', servings: 4, size: '250 ml', effort: '10 min + chill', keeps: '4 days refrigerated', blurb: 'Tart, ruby-red, naturally sugar-free. Sweeten if you want.', ingredients: ['2–3 hibiscus tea bags', '50 g frozen berries', '1 L water', 'Lemon or lime', 'Zero-calorie sweetener (optional)'], method: ['Steep hibiscus in hot water for 5–10 minutes.', 'Cool completely.', 'Add berries and citrus. Refrigerate before serving.'], flavour: ['floral', 'berry'], occasions: ['afternoon'] },
  { n: 10, name: 'Orange–Ginger Spritz', kcal: '15–20', servings: 4, size: '250 ml', effort: '12 min + cool', keeps: 'Base 4 days; fizz fresh', blurb: 'Just enough OJ for flavour; ginger for the kick; fizz to finish.', ingredients: ['50 ml orange juice', '20 g fresh ginger', '750 ml water', '250 ml sparkling water', 'Orange slices'], method: ['Make a ginger tea with 250 ml hot water; cool.', 'Combine with orange juice and the remaining still water.', 'Add sparkling water when serving. Garnish with orange.'], batch_note: 'Keep the base ready in the fridge; carbonate glass by glass.', flavour: ['citrus', 'ginger'], occasions: ['postworkout'] },
  { n: 11, name: 'Lime & Ginger Cordial', kcal: '5–10', servings: 8, size: '60 ml concentrate', effort: '15 min + cool', keeps: '5 days refrigerated', blurb: 'One batch, a week of drinks. Top up 60 ml with water and go.', ingredients: ['Juice of 3 limes', '30 g fresh ginger, sliced', '400 ml water', 'Zero-calorie sweetener to taste'], method: ['Simmer ginger in the water for 10 minutes.', 'Cool and strain.', 'Stir in lime juice and sweetener.', 'Serve 50–60 ml concentrate topped with 200–300 ml water or fizz.'], batch_note: 'Best make-once, top-up-all-week option in the collection.', flavour: ['citrus', 'ginger'], occasions: ['batch'] },
  { n: 12, name: 'Lemon–Ginger Concentrate', kcal: '5', servings: 10, size: '50 ml concentrate', effort: '15 min + cool', keeps: '5 days refrigerated', blurb: 'The same trick with lemon. Five days in the fridge, ready when you are.', ingredients: ['Juice of 2 lemons', '25–30 g fresh ginger, sliced', '400 ml water', 'Zero-calorie sweetener (optional)'], method: ['Simmer ginger in the water for 10 minutes.', 'Cool and strain.', 'Stir in lemon juice and sweetener.', 'Use 50 ml concentrate per glass, topped with water or fizz.'], flavour: ['citrus', 'ginger'], occasions: ['batch'] },
  { n: 13, name: 'Cucumber Mint Concentrate', kcal: '5', servings: 8, size: '100 ml concentrate', effort: '10 min', keeps: '3 days refrigerated', blurb: 'Blend, strain, top up. Twenty minutes of prep for a week of sipping.', ingredients: ['½ cucumber', 'Large handful mint', 'Juice of 1 lemon', '600 ml water'], method: ['Blend cucumber, mint and water until smooth.', 'Strain if you want a clearer drink.', 'Stir in lemon.', 'Serve 100 ml topped with cold water.'], flavour: ['herbal', 'citrus'], occasions: ['batch'] },
  { n: 14, name: 'Berry Lime Squash', kcal: '10', servings: 8, size: '60 ml concentrate', effort: '15 min + cool', keeps: '4–5 days refrigerated', blurb: 'Simmered berry base with lime. Kids will drink it too.', ingredients: ['100 g frozen mixed berries', 'Juice of 2 limes', '400 ml water', 'Zero-calorie sweetener'], method: ['Simmer berries and water for 10 minutes.', 'Strain, pressing to extract juice.', 'Cool, then stir in lime and sweetener.', 'Serve 50–60 ml concentrate topped with 250 ml water.'], flavour: ['berry', 'citrus'], occasions: ['batch'] },
  { n: 15, name: 'Raspberry Lemon Iced Tea', kcal: '10–15', servings: 4, size: '250 ml', effort: '5 min + overnight', keeps: '3–4 days refrigerated', blurb: 'Black tea plus frozen raspberries. Overnight in the fridge.', ingredients: ['3 black tea bags', '75 g frozen raspberries', '½ lemon', '1 L water'], method: ['Brew the tea in hot water.', 'Add raspberries while cooling.', 'Stir in lemon.', 'Refrigerate overnight and strain to serve.'], flavour: ['berry', 'citrus'], occasions: ['afternoon'] },
  { n: 16, name: 'Tropical Green Tea', kcal: '10–15', servings: 4, size: '250 ml', effort: '5 min + cool', keeps: '3 days refrigerated', blurb: 'Green tea with a splash of pineapple. Enough flavour, not much sugar.', ingredients: ['3 green tea bags', '100 ml pineapple juice', '1 L water', 'Lime'], method: ['Brew the tea in hot water; cool completely.', 'Stir in pineapple juice and lime.', 'Refrigerate. Serve over plenty of ice.'], flavour: ['tropical', 'herbal'], occasions: ['afternoon'] },
  { n: 17, name: 'Cola-Style Spice Cooler', kcal: '5', servings: 4, size: '250 ml', effort: '15 min + cool', keeps: 'Infusion 5 days; carbonate fresh', blurb: "Cinnamon, cloves, citrus peel. Cola's flavour, none of its damage.", ingredients: ['1 L sparkling water', '1 cinnamon stick', '2 strips orange peel', '2 strips lemon peel', '2 cloves', 'Tiny pinch nutmeg', 'Zero-calorie sweetener'], method: ['Make a strong spice infusion in 300 ml water; simmer 10 minutes.', 'Cool and strain.', 'Combine with sparkling water at serving time.', 'Add sweetener to taste.'], flavour: ['warming'], occasions: ['dinner'] },
  { n: 18, name: 'Chai Iced Tea', kcal: '5–15', servings: 4, size: '250 ml', effort: '10 min + cool', keeps: '4 days refrigerated (no milk)', blurb: 'Spice-brewed and cold. Splash of almond milk optional.', ingredients: ['3 chai or black tea bags', '1 cinnamon stick', '3 cardamom pods', '2 cloves', '1 L water', 'Unsweetened almond milk (optional)'], method: ['Brew everything together for 5–7 minutes.', 'Cool and refrigerate.', 'Serve over ice; add a splash of almond milk if you want creamier.'], flavour: ['warming'], occasions: ['cosy'] },
  { n: 19, name: 'Lemon–Cucumber Green Tea', kcal: '3–5', servings: 4, size: '250 ml', effort: '5 min + chill', keeps: '3 days refrigerated', blurb: 'The refill-forever drink. Practically calorie-free.', ingredients: ['3 green tea bags', '½ cucumber, sliced', '½ lemon, sliced', '1 L water', 'Mint (optional)'], method: ['Brew the green tea in hot water; cool.', 'Add cucumber and lemon.', 'Refrigerate 2 hours before serving.'], flavour: ['citrus', 'herbal'], occasions: ['everyday'] },
  { n: 20, name: 'Cherry Lime Fizz', kcal: '15–20', servings: 4, size: '250 ml', effort: '5 min', keeps: 'Base 3–4 days; fizz fresh', blurb: 'Tart cherry juice and lime. Deep red, dry-tasting, grown-up.', ingredients: ['100 ml unsweetened tart cherry juice', 'Juice of 1 lime', '750 ml cold water', '250 ml sparkling water'], method: ['Mix everything except sparkling water.', 'Refrigerate the base.', 'Add sparkling water when serving.'], flavour: ['berry', 'citrus'], occasions: ['dinner'] },
  { n: 21, name: 'No-Sugar Mojito', kcal: '10', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', blurb: "Muddle, ice, fizz. A mojito that doesn't cost you the evening.", ingredients: ['½ lime, cut into wedges', '8–10 mint leaves', '1–2 tsp zero-calorie sweetener', '200–250 ml sparkling water', 'Ice'], method: ['Muddle lime, mint and sweetener in a glass.', 'Add ice.', 'Top with sparkling water and stir gently.'], batch_note: 'Add 30–50 ml of the Lime & Ginger Cordial (No. 11) for an upgraded version.', flavour: ['herbal', 'citrus'], occasions: ['party'] },
  { n: 22, name: 'Strawberry Mojito', kcal: '20–25', servings: 1, size: '300 ml', effort: '4 min', keeps: 'Base 3 days; fizz fresh', blurb: 'Strawberries do the sweetening. Mint and lime do the rest.', ingredients: ['50 g strawberries', '½ lime', '8 mint leaves', 'Zero-calorie sweetener', '250 ml sparkling water', 'Ice'], method: ['Muddle strawberries, lime and mint.', 'Add ice.', 'Top with sparkling water.'], batch_note: 'Make a strawberry-lime-mint base for 3 days and top with fizz when serving.', flavour: ['berry', 'herbal'], occasions: ['party'] },
  { n: 23, name: 'Virgin Margarita', kcal: '15–20', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Salt rim, lime, sparkling. Tastes far more cocktail than mock.', ingredients: ['30 ml fresh lime juice', '15 ml lemon juice', '100–150 ml sparkling water', 'Salt for rim', 'Ice', 'Zero-calorie sweetener (optional)'], method: ['Salt the rim of your glass.', 'Shake lime, lemon and sweetener with ice.', 'Pour into the glass over fresh ice.', 'Top with sparkling water.'], flavour: ['citrus'], occasions: ['party', 'dinner'] },
  { n: 24, name: 'Spicy Margarita', kcal: '15', servings: 1, size: '250 ml', effort: '4 min', keeps: 'Best fresh', blurb: 'Muddled jalapeño and lime. Chilli-lime rim seals the deal.', ingredients: ['30 ml lime juice', '15 ml lemon juice', '150 ml sparkling water', '2–3 slices jalapeño', 'Zero-calorie sweetener', 'Pinch of salt', 'Ice'], method: ['Muddle jalapeño with lime, salt and sweetener.', 'Add ice and lemon.', 'Top with sparkling water. Rim with Tajín-style seasoning if you have it.'], flavour: ['citrus', 'warming'], occasions: ['party'] },
  { n: 25, name: 'Pineapple Ginger Mule', kcal: '25–30', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Fifty ml of pineapple for the flavour; ginger and fizz for the punch.', ingredients: ['50 ml pineapple juice', '20–30 ml ginger concentrate (No. 11 or 12)', '150 ml sparkling water', 'Lime juice', 'Ice'], method: ['Fill a glass with plenty of ice.', 'Add pineapple juice, ginger concentrate and lime.', 'Top with sparkling water and stir.'], flavour: ['tropical', 'ginger'], occasions: ['postworkout'] },
  { n: 26, name: 'Raspberry Moscow Mule', kcal: '20', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Muddled raspberries meet ginger concentrate. Pink and sharp.', ingredients: ['50 g raspberries', '20 ml lime juice', '20–30 ml ginger concentrate (No. 11 or 12)', '200 ml sparkling water', 'Ice'], method: ['Muddle raspberries and lime in a glass.', 'Add ginger concentrate and ice.', 'Top with sparkling water.'], flavour: ['berry', 'ginger'], occasions: ['party'] },
  { n: 27, name: 'Dark Berry Fizz', kcal: '20–30', servings: 1, size: '250 ml', effort: '4 min', keeps: 'Best fresh', blurb: 'Blend, strain, top up. Looks like a restaurant mocktail.', ingredients: ['75 g frozen blackberries or blueberries', '20 ml lemon juice', '200 ml sparkling water', 'Zero-calorie sweetener', 'Ice'], method: ['Blend or muddle berries with lemon and sweetener.', 'Strain into a glass over ice for a cleaner look.', 'Top with sparkling water.'], flavour: ['berry'], occasions: ['dinner'] },
  { n: 28, name: 'Cherry Cola Mocktail', kcal: '20–25', servings: 1, size: '250 ml', effort: '2 min', keeps: 'Best fresh', blurb: 'Zero-sugar cola gets a serious upgrade. Orange peel is the trick.', ingredients: ['50 ml unsweetened tart cherry juice', '150–200 ml zero-sugar cola', '10 ml lime juice', 'Ice', 'Strip of orange peel'], method: ['Fill a glass with ice.', 'Add cherry juice, lime and cola.', 'Twist the orange peel over the top and drop it in.'], flavour: ['berry', 'warming'], occasions: ['dinner'] },
  { n: 29, name: 'Apple Ginger Fizz', kcal: '20–25', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Cloudy apple juice, ginger, cinnamon. Slightly festive.', ingredients: ['50 ml cloudy apple juice', '20 ml ginger concentrate', '150–200 ml sparkling water', 'Lemon juice', 'Tiny pinch of cinnamon', 'Ice'], method: ['Shake apple juice, ginger and lemon with ice.', 'Strain into a fresh glass over ice.', 'Top with sparkling water; dust with cinnamon.'], flavour: ['warming', 'ginger'], occasions: ['dinner'] },
  { n: 30, name: 'Peach Bellini-Style Fizz', kcal: '25', servings: 1, size: '200 ml', effort: '4 min', keeps: 'Best fresh', blurb: 'Blended peach and sparkling water. Serve in a wine glass.', ingredients: ['75 g frozen peach', '150–200 ml sparkling water', '10 ml lemon juice', 'Zero-calorie sweetener'], method: ['Blend peach with a little water until smooth.', 'Pour into a champagne flute or wine glass.', 'Top slowly with sparkling water; stir gently.'], flavour: ['tropical'], occasions: ['party'] },
  { n: 31, name: 'Cucumber Elderflower Spritz', kcal: '15–20', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Sugar-free elderflower does the work. Ribbons of cucumber, plenty of ice.', ingredients: ['20–30 ml sugar-free elderflower cordial', '3–4 cucumber ribbons', '200 ml sparkling water', 'Lemon', 'Mint', 'Ice'], method: ['Build in a large wine glass.', 'Add cordial, cucumber, mint and ice.', 'Top with sparkling water; finish with lemon.'], flavour: ['floral', 'herbal'], occasions: ['party', 'dinner'] },
  { n: 32, name: 'Pink Grapefruit Spritz', kcal: '20–25', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Grapefruit, lime, and a slapped rosemary sprig. Bar-quality mocktail.', ingredients: ['50 ml pink grapefruit juice', '10 ml lime juice', '150–200 ml sparkling water', 'Zero-calorie sweetener', '1 rosemary sprig', 'Ice'], method: ['Shake grapefruit, lime and sweetener with ice.', 'Strain over fresh ice.', 'Top with sparkling water.', 'Slap the rosemary between your hands before adding it.'], flavour: ['floral', 'citrus'], occasions: ['dinner'] },
  { n: 33, name: 'Blood Orange Fizz', kcal: '25–30', servings: 1, size: '250 ml', effort: '2 min', keeps: 'Best fresh', blurb: 'Simple, striking, sunset-coloured. Two ingredients plus fizz.', ingredients: ['50 ml blood orange juice', '15 ml lemon juice', '150 ml sparkling water', 'Zero-calorie sweetener', 'Strip of orange peel', 'Ice'], method: ['Fill a glass with ice.', 'Add blood orange, lemon and sweetener.', 'Top with sparkling water; garnish with orange peel.'], flavour: ['citrus'], occasions: ['dinner'] },
  { n: 34, name: 'Passionfruit Cooler', kcal: '25', servings: 1, size: '250 ml', effort: '2 min', keeps: 'Best fresh', blurb: 'Half a passionfruit, ice, and sparkling water. Ready in a minute.', ingredients: ['½ passionfruit', '15 ml lime juice', '150–200 ml sparkling water', 'Zero-calorie sweetener', 'Ice'], method: ['Scoop passionfruit into the glass.', 'Add lime and sweetener.', 'Fill with ice, top with sparkling water and stir.'], flavour: ['tropical'], occasions: ['party'] },
  { n: 35, name: 'Virgin Piña Colada', kcal: '50–60', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', macros: { c: 4, p: 1, f: 4 }, blurb: 'Blended coconut milk and pineapple. Creamy, tropical, actually macro-manageable.', ingredients: ['50 ml pineapple juice', '50 ml unsweetened coconut milk', '100 ml cold water', 'Lime juice', 'Ice', 'Zero-calorie sweetener (optional)'], method: ['Add everything to a blender with ice.', 'Blend until frothy.', 'Pour into a glass and garnish with a lime wedge.'], flavour: ['tropical', 'creamy'], occasions: ['party'] },
  { n: 36, name: 'Coconut Lime Cooler', kcal: '25–35', servings: 1, size: '250 ml', effort: '2 min', keeps: 'Best fresh', blurb: 'Coconut water plus lime and mint. Post-workout adjacent.', ingredients: ['100 ml unsweetened coconut water', '100 ml water', '20 ml lime juice', 'Fresh mint', 'Ice', 'Zero-calorie sweetener (optional)'], method: ['Shake or briefly blend everything with ice.', 'Pour into a glass with fresh mint.'], batch_note: 'Not a formal electrolyte drink, but a nice step up from plain water after a session.', flavour: ['tropical', 'citrus'], occasions: ['postworkout'] },
  { n: 37, name: 'Iced Vanilla Latte', kcal: '30–50', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', macros: { c: 2, p: 1, f: 3 }, blurb: 'Espresso, almond milk, vanilla, salt. Coffee-shop sweetness, none of the sugar.', ingredients: ['1–2 espresso shots', '150 ml unsweetened almond milk', '¼ tsp vanilla extract', 'Zero-calorie sweetener', 'Tiny pinch of salt', 'Ice'], method: ['Combine everything in a shaker with ice.', 'Shake vigorously until cold and frothy.', 'Pour over fresh ice.'], batch_note: 'Salt makes the coffee taste sweeter without adding sugar.', flavour: ['coffee'], occasions: ['afternoon'] },
  { n: 38, name: 'Mocha Protein Iced Coffee', kcal: '80–120', servings: 1, size: '300 ml', effort: '4 min', keeps: 'Best fresh', macros: { c: 5, p: 12, f: 3 }, blurb: 'Coffee that hits your protein target. Blender required.', ingredients: ['1 espresso or 100 ml strong coffee', '100 ml unsweetened almond milk', '½ scoop chocolate or vanilla protein powder', '1 tsp cocoa powder', 'Ice', 'Sweetener if needed'], method: ['Add everything to a blender.', 'Blend until smooth.', 'Pour over ice.'], batch_note: 'One of the few drinks here where protein becomes part of your macro strategy, not just flavour.', flavour: ['coffee', 'creamy'], occasions: ['postworkout'] },
  { n: 39, name: 'Cinnamon Roll Iced Coffee', kcal: '40–60', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', macros: { c: 2, p: 1, f: 3 }, blurb: 'Cinnamon, vanilla, a pinch of salt. Bakery taste, black-coffee macros.', ingredients: ['1–2 espresso shots', '150 ml unsweetened almond milk', '½ tsp cinnamon', '¼ tsp vanilla extract', 'Zero-calorie sweetener', 'Tiny pinch of salt', 'Ice'], method: ['Combine everything in a shaker with ice.', 'Shake hard until cold and frothy.', 'Pour into a glass over fresh ice.'], flavour: ['coffee', 'warming'], occasions: ['afternoon'] },
  { n: 40, name: 'Chocolate Orange Iced Coffee', kcal: '40–60', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', macros: { c: 3, p: 2, f: 3 }, blurb: 'Cocoa and orange zest — no juice needed. Punches above its calories.', ingredients: ['1 espresso', '150 ml unsweetened almond milk', '1 tsp cocoa powder', 'Zest of ½ orange', 'Zero-calorie sweetener', 'Ice'], method: ['Combine everything in a shaker or blender with ice.', 'Shake or blend until smooth.', 'Pour over fresh ice.'], batch_note: 'Use orange zest, not juice — you get more flavour for almost no calories.', flavour: ['coffee', 'citrus'], occasions: ['afternoon'] },
  { n: 41, name: 'Vanilla Chai Latte', kcal: '40–60', servings: 1, size: '300 ml', effort: '3 min (chai brewed ahead)', keeps: 'Chai base 4 days', macros: { c: 2, p: 1, f: 3 }, blurb: 'Cold-brewed chai plus almond milk. Cosy without being creamy.', ingredients: ['150 ml strong chilled chai tea', '100 ml unsweetened almond milk', '¼ tsp vanilla extract', 'Pinch of cinnamon', 'Zero-calorie sweetener', 'Ice'], method: ['Combine everything in a shaker or blender.', 'Shake or blend with ice.', 'Pour over fresh ice.'], flavour: ['coffee', 'warming'], occasions: ['cosy'] },
  { n: 42, name: 'Strawberry Cream Fizz', kcal: '35–45', servings: 1, size: '300 ml', effort: '4 min', keeps: 'Best fresh', macros: { c: 5, p: 1, f: 2 }, blurb: 'Blended strawberries, almond milk, sparkling water. Weirdly luxurious.', ingredients: ['75 g strawberries', '50 ml unsweetened almond milk', '100–150 ml sparkling water', 'Squeeze of lemon', 'Zero-calorie sweetener', 'Ice'], method: ['Blend strawberries, almond milk and lemon until smooth.', 'Pour over ice.', 'Slowly add sparkling water and stir gently.'], flavour: ['berry', 'creamy'], occasions: ['dessert'] },
  { n: 43, name: 'Chocolate Mint Shake', kcal: '60–80', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', macros: { c: 4, p: 10, f: 2 }, blurb: 'Dessert replacement, actual protein. Blend it thick.', ingredients: ['150 ml unsweetened almond milk', '1 tsp cocoa powder', '2–3 drops mint extract', '½ scoop protein powder', 'Ice', 'Zero-calorie sweetener'], method: ['Add everything to a blender.', 'Blend until thick and cold.', 'Pour into a glass.'], batch_note: 'Particularly useful when the craving is for something sweet rather than something thirst-quenching.', flavour: ['coffee', 'creamy'], occasions: ['dessert', 'postworkout'] },
  { n: 44, name: 'Salted Caramel Coffee', kcal: '40–60', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', macros: { c: 2, p: 1, f: 3 }, blurb: 'Sugar-free caramel plus salt. The salt is what sells it.', ingredients: ['1–2 espresso shots', '150 ml unsweetened almond milk', '1–2 tsp sugar-free caramel syrup', 'Tiny pinch of salt', 'Ice'], method: ['Combine everything in a shaker with ice.', 'Shake aggressively until cold and frothy.', 'Pour into a glass over fresh ice.'], flavour: ['coffee'], occasions: ['afternoon'] },
  { n: 45, name: 'Apple Pie Fizz', kcal: '25–30', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Apple juice, cinnamon, vanilla. Pie flavour, drink calories.', ingredients: ['50 ml cloudy apple juice', '20 ml lemon juice', '150 ml sparkling water', 'Pinch of cinnamon', '¼ tsp vanilla extract', 'Zero-calorie sweetener', 'Ice'], method: ['Shake apple juice, lemon, cinnamon and vanilla with ice.', 'Strain into a glass over fresh ice.', 'Top with sparkling water.'], flavour: ['warming'], occasions: ['cosy'] },
  { n: 46, name: 'Gingerbread Fizz', kcal: '10–20', servings: 1, size: '250 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Ginger, cinnamon, nutmeg, vanilla. Christmas drink, January calories.', ingredients: ['20–30 ml ginger concentrate', '150–200 ml sparkling water', 'Pinch of cinnamon', '¼ tsp vanilla extract', 'Tiny pinch of nutmeg', 'Zero-calorie sweetener', 'Ice'], method: ['Fill a glass with ice.', 'Add ginger concentrate, vanilla, spices and sweetener.', 'Top with sparkling water; stir gently.'], flavour: ['ginger', 'warming'], occasions: ['cosy'] },
  { n: 47, name: 'Blackberry Rosemary Sour', kcal: '20–25', servings: 1, size: '200 ml', effort: '5 min', keeps: 'Best fresh', blurb: 'Muddled blackberries and rosemary. Serious mocktail energy.', ingredients: ['50 g blackberries', '25 ml lemon juice', '10 ml lime juice', '1 rosemary sprig', 'Zero-calorie sweetener', '100 ml sparkling water', 'Ice'], method: ['Muddle blackberries and rosemary in a shaker.', 'Add citrus, sweetener and ice; shake hard.', 'Strain into a glass.', 'Top with sparkling water.'], flavour: ['berry', 'floral'], occasions: ['dinner'] },
  { n: 48, name: 'Ginger Peach Sour', kcal: '25–30', servings: 1, size: '250 ml', effort: '4 min', keeps: 'Best fresh', blurb: 'Blended frozen peach with lemon and ginger. Bright and grown-up.', ingredients: ['50 g frozen peach', '20 ml lemon juice', '20 ml ginger concentrate', '100–150 ml sparkling water', 'Zero-calorie sweetener', 'Ice'], method: ['Blend peach, lemon and ginger concentrate until smooth.', 'Pour over ice.', 'Top with sparkling water and stir.'], flavour: ['tropical', 'ginger'], occasions: ['dinner'] },
  { n: 49, name: 'Frozen Berry Slush', kcal: '30–40', servings: 1, size: '300 ml', effort: '3 min', keeps: 'Best fresh', blurb: 'Blended frozen berries. When you need something to chew.', ingredients: ['100 g frozen mixed berries', '100–150 ml cold water', 'Squeeze of lemon or lime', 'Zero-calorie sweetener', 'Lots of ice'], method: ['Add everything to a blender.', 'Blend until slushy — add water in small amounts as needed.', 'Serve immediately.'], batch_note: 'Try with mint, ginger, or a splash of zero-sugar lemonade as a variation.', flavour: ['berry'], occasions: ['dessert'] },
  { n: 50, name: 'Espresso Tonic', kcal: '5–10', servings: 1, size: '250 ml', effort: '1 min', keeps: 'Best fresh', blurb: 'Espresso poured over tonic and ice. Thirty seconds; looks like a cocktail.', ingredients: ['1–2 espresso shots', '150–200 ml zero-sugar tonic water', 'Strip of orange or lemon peel', 'Lots of ice'], method: ['Fill a tall glass with ice.', 'Pour in the tonic water.', 'Slowly pour the espresso over the top.', 'Twist the citrus peel over the drink and drop it in.'], flavour: ['coffee', 'floral'], occasions: ['afternoon'] },
];

/* ============================================================
   Helpers
   ============================================================ */
const pad = (n: number) => String(n).padStart(2, '0');

/* ============================================================
   Component
   ============================================================ */
export default function DrinksPage() {
  const [flavours, setFlavours] = useState<Set<FlavourKey>>(new Set());
  const [occasions, setOccasions] = useState<Set<OccasionKey>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get('f');
    const o = params.get('o');
    if (f) setFlavours(new Set(f.split(',').filter((v): v is FlavourKey => v in FLAVOURS)));
    if (o) setOccasions(new Set(o.split(',').filter((v): v is OccasionKey => v in OCCASIONS)));
    const hashMatch = window.location.hash.match(/^#drink-(\d+)$/);
    if (hashMatch) {
      const n = parseInt(hashMatch[1], 10);
      if (DRINKS.find((x) => x.n === n)) setOpenId(n);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const params = new URLSearchParams();
    if (flavours.size) params.set('f', [...flavours].join(','));
    if (occasions.size) params.set('o', [...occasions].join(','));
    const q = params.toString();
    const hash = openId !== null ? `#drink-${pad(openId)}` : '';
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + hash);
  }, [flavours, occasions, openId]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (openId !== null && !dlg.open) dlg.showModal();
    else if (openId === null && dlg.open) dlg.close();
  }, [openId]);

  const filtered = useMemo(
    () =>
      DRINKS.filter((d) => {
        if (flavours.size && !d.flavour.some((f) => flavours.has(f))) return false;
        if (occasions.size && !d.occasions.some((o) => occasions.has(o))) return false;
        return true;
      }),
    [flavours, occasions]
  );

  const grouped = useMemo(() => {
    const order = Object.keys(OCCASIONS) as OccasionKey[];
    return order
      .map((key) => ({
        key,
        label: OCCASIONS[key],
        items: filtered.filter((d) => d.occasions[0] === key),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const toggleFlavour = (key: FlavourKey) => {
    setFlavours((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleOccasion = (key: OccasionKey) => {
    setOccasions((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const clearFilters = () => { setFlavours(new Set()); setOccasions(new Set()); };
  const batchPreset = () => {
    setFlavours(new Set());
    setOccasions(new Set(['batch']));
    document.getElementById('dk-library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyRecipe = useCallback((d: Drink, btn: HTMLButtonElement) => {
    const lines = [
      d.name,
      '',
      `Makes: ${d.servings} × ${d.size}`,
      `Kcal per serving: ${d.kcal}`,
      d.macros ? `Macros: ${d.macros.c}g C · ${d.macros.p}g P · ${d.macros.f}g F` : null,
      '',
      'Ingredients:',
      ...d.ingredients.map((i) => `- ${i}`),
      '',
      'Method:',
      ...d.method.map((m, i) => `${i + 1}. ${m}`),
      '',
      `Keeps: ${d.keeps}`,
      d.batch_note ? `\nBatch trick: ${d.batch_note}` : null,
      '',
      'From The Drinks · FIT50 Challenge',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }).catch(() => { btn.textContent = 'Copy failed'; });
  }, []);

  const active = openId !== null ? DRINKS.find((d) => d.n === openId) ?? null : null;

  return (
    <div className={`dk-root ${fraunces.variable} ${inter.variable}`}>
      <section className="dk-hero">
        <div className="dk-wrap">
          <span className="dk-eyebrow">Rule 03 companion · Crispy Clarity</span>
          <h1 className="dk-h1">The <em>Drinks</em>.</h1>
          <p className="dk-lede">Fifty zero-proof, low-sugar drinks for the FIT50 Challenge. Browsable by flavour and occasion — most under 50 kcal a serve.</p>
          <div className="dk-cta-row">
            <a href="#dk-library" className="dk-btn dk-btn-primary">Browse the fifty</a>
            <button type="button" className="dk-btn dk-btn-ghost" onClick={batchPreset}>Batch drinks only</button>
          </div>
        </div>
      </section>

      <div className="dk-marquee" aria-hidden="true">
        <div className="dk-marquee-track">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="dk-marquee-group">
              <span>Fifty drinks</span><span className="dk-star">✦</span>
              <span>Zero proof</span><span className="dk-star">✦</span>
              <span>Low sugar</span><span className="dk-star">✦</span>
              <span>All year</span><span className="dk-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section id="dk-library" className="dk-library">
        <div className="dk-wrap">
          <div className="dk-filter-wrap">
            <div className="dk-filter-groups">
              <div className="dk-filter-group">
                <span className="dk-filter-label">Flavour</span>
                <div className="dk-pills">
                  {(Object.entries(FLAVOURS) as [FlavourKey, string][]).map(([k, label]) => (
                    <button key={k} type="button" className="dk-pill" aria-pressed={flavours.has(k)} onClick={() => toggleFlavour(k)}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="dk-filter-group">
                <span className="dk-filter-label">Occasion</span>
                <div className="dk-pills">
                  {(Object.entries(OCCASIONS) as [OccasionKey, string][]).map(([k, label]) => (
                    <button key={k} type="button" className="dk-pill" aria-pressed={occasions.has(k)} onClick={() => toggleOccasion(k)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="dk-filter-meta">
              <span className="dk-count">{filtered.length} drink{filtered.length === 1 ? '' : 's'}</span>
              <button type="button" className="dk-clear-btn" onClick={clearFilters}>Clear filters</button>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="dk-empty">
              <h3>Nothing matches that combo.</h3>
              <p>Try clearing a filter.</p>
              <button type="button" className="dk-btn dk-btn-ghost" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            grouped.map(({ key, label, items }) => (
              <section key={key} className="dk-occ-section" id={`dk-occ-${key}`}>
                <div className="dk-occ-header">
                  <h2 className="dk-occ-title">{label}</h2>
                  <div className="dk-occ-count">{items.length} drink{items.length === 1 ? '' : 's'}</div>
                </div>
                <div className="dk-grid" role="list">
                  {items.map((d) => (
                    <button key={d.n} type="button" className="dk-tile" role="listitem" onClick={() => setOpenId(d.n)}>
                      <div className="dk-tile-top">
                        <div className="dk-tile-num">{pad(d.n)}</div>
                        {d.macros && <div className="dk-tile-macro-flag">Macros</div>}
                      </div>
                      <div className="dk-tile-name">{d.name}</div>
                      <div className="dk-tile-blurb">{d.blurb}</div>
                      <div className="dk-tile-meta">
                        <span className="dk-chip dk-chip-kcal">{d.kcal} kcal</span>
                        <span className="dk-chip dk-chip-effort">{d.effort}</span>
                      </div>
                      <div className="dk-tile-tags">
                        {d.flavour.slice(0, 2).map((f, i) => (
                          <span key={i} className="dk-tile-tag">{FLAVOURS[f]}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>

      <div className="dk-marquee" aria-hidden="true">
        <div className="dk-marquee-track">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="dk-marquee-group">
              <span>Batch on Sunday</span><span className="dk-star">✦</span>
              <span>Sip all week</span><span className="dk-star">✦</span>
              <span>Fresh mint helps</span><span className="dk-star">✦</span>
              <span>Ice is free</span><span className="dk-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="dk-coda">
        <div className="dk-wrap">
          <h2 className="dk-coda-h2">Fifty days doesn&apos;t have to be fifty days of water.</h2>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="dk-modal"
        aria-label="Drink recipe"
        onClose={() => setOpenId(null)}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('dk-modal')) setOpenId(null);
        }}
      >
        {active && (
          <div className="dk-modal-body">
            <div className="dk-modal-header">
              <div>
                <div className="dk-modal-eyebrow">No. {pad(active.n)}</div>
                <div className="dk-modal-title">{active.name}</div>
              </div>
              <button type="button" className="dk-modal-close" aria-label="Close" onClick={() => setOpenId(null)}>×</button>
            </div>
            <div className="dk-modal-blurb">{active.blurb}</div>
            {active.macros && (
              <div className="dk-modal-macros" role="group" aria-label="Macros per serving">
                <div><span>Kcal</span><strong>{active.kcal}</strong></div>
                <div><span>Carbs</span><strong>{active.macros.c}g</strong></div>
                <div><span>Protein</span><strong>{active.macros.p}g</strong></div>
                <div><span>Fat</span><strong>{active.macros.f}g</strong></div>
              </div>
            )}
            <div className="dk-modal-meta">
              <div><span>Servings</span><strong>{active.servings} × {active.size}</strong></div>
              <div><span>Kcal / serve</span><strong>{active.kcal}</strong></div>
              <div><span>Keeps</span><strong>{active.keeps}</strong></div>
              <div><span>Effort</span><strong>{active.effort}</strong></div>
            </div>
            <div className="dk-modal-section-title">Ingredients</div>
            <ul className="dk-modal-ingredients">
              {active.ingredients.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
            <div className="dk-modal-section-title">Method</div>
            <ol className="dk-modal-method">
              {active.method.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ol>
            {active.batch_note && <div className="dk-modal-note"><strong>Batch trick</strong>{active.batch_note}</div>}
            <div className="dk-modal-note"><strong>Flavour</strong>{active.flavour.map((f) => FLAVOURS[f]).join(' · ')}</div>
            <div className="dk-modal-note"><strong>Best for</strong>{active.occasions.map((o) => OCCASIONS[o]).join(' · ')}</div>
            <div className="dk-modal-actions">
              <button type="button" className="dk-modal-action-btn" onClick={(e) => copyRecipe(active, e.currentTarget)}>Copy recipe</button>
              <button type="button" className="dk-modal-action-btn" onClick={() => window.print()}>Print</button>
            </div>
          </div>
        )}
      </dialog>

      <style jsx>{`
        .dk-root {
          --dk-lavender: #e4def3;
          --dk-lavender-soft: #efeaf9;
          --dk-paper: #fbf7ee;
          --dk-paper-warm: #f3ecdc;
          --dk-coral: #f05a3e;
          --dk-coral-deep: #d8422c;
          --dk-ink: #1a1730;
          --dk-ink-2: #4c4568;
          --dk-ink-3: #7a7396;
          --dk-border: rgba(26, 23, 48, 0.1);
          --dk-border-strong: rgba(26, 23, 48, 0.2);
          --dk-fd: var(--dk-font-display, 'Fraunces', Georgia, serif);
          --dk-fb: var(--dk-font-body, 'Inter', system-ui, sans-serif);
          --dk-radius: 20px;
          --dk-radius-sm: 10px;
          --dk-radius-pill: 999px;
          --dk-shadow: 0 1px 0 rgba(26, 23, 48, 0.04), 0 12px 28px -14px rgba(26, 23, 48, 0.2);
          --dk-shadow-hover: 0 1px 0 rgba(26, 23, 48, 0.06), 0 22px 40px -18px rgba(26, 23, 48, 0.28);
          --dk-tx-fast: 160ms cubic-bezier(0.4, 0, 0.2, 1);
          --dk-tx-mid: 260ms cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--dk-lavender);
          color: var(--dk-ink);
          font-family: var(--dk-fb);
          font-size: 16px;
          line-height: 1.5;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        :where(.dk-root *) { box-sizing: border-box; }
        :where(.dk-root button) { font: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
        :where(.dk-root a) { color: inherit; text-decoration: none; }
        :where(.dk-root ul, .dk-root ol) { list-style: none; padding: 0; margin: 0; }

        .dk-wrap { max-width: 1240px; margin: 0 auto; padding: 0 28px; }
        .dk-hero { padding: 48px 0 64px; }
        .dk-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dk-coral); margin-bottom: 28px; }
        .dk-eyebrow::before { content: ''; width: 32px; height: 1.5px; background: var(--dk-coral); }
        .dk-h1 { font-family: var(--dk-fd); font-weight: 900; font-size: clamp(60px, 11vw, 140px); line-height: 0.9; letter-spacing: -0.04em; color: var(--dk-ink); margin: 0 0 28px; }
        .dk-h1 em { font-style: italic; color: var(--dk-coral); font-weight: 400; }
        .dk-lede { font-size: 20px; max-width: 580px; color: var(--dk-ink-2); margin: 0 0 36px; line-height: 1.5; }
        .dk-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .dk-btn { display: inline-flex; align-items: center; gap: 8px; padding: 15px 26px; border-radius: var(--dk-radius-pill); font-weight: 600; font-size: 15px; transition: background var(--dk-tx-fast), border-color var(--dk-tx-fast), color var(--dk-tx-fast), transform var(--dk-tx-fast); border: none; }
        .dk-btn:active { transform: translateY(1px); }
        .dk-btn-primary { background: var(--dk-ink); color: var(--dk-paper); }
        .dk-btn-primary:hover { background: var(--dk-coral); }
        .dk-btn-ghost { border: 1.5px solid var(--dk-ink); color: var(--dk-ink); background: transparent; }
        .dk-btn-ghost:hover { border-color: var(--dk-coral); color: var(--dk-coral); }

        .dk-marquee { border-top: 1.5px solid var(--dk-ink); border-bottom: 1.5px solid var(--dk-ink); overflow: hidden; white-space: nowrap; font-family: var(--dk-fd); font-size: 15px; font-weight: 600; letter-spacing: 0.14em; padding: 16px 0; background: var(--dk-lavender); text-transform: uppercase; }
        .dk-marquee-track { display: inline-flex; animation: dk-marquee 42s linear infinite; will-change: transform; }
        .dk-marquee-group span { padding: 0 24px; }
        .dk-marquee-group .dk-star { color: var(--dk-coral); font-size: 18px; }
        @keyframes dk-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }

        .dk-library { padding-top: 36px; padding-bottom: 60px; }
        .dk-filter-wrap { position: sticky; top: 0; z-index: 30; background: var(--dk-lavender); padding: 22px 0 18px; border-bottom: 1px solid var(--dk-border); margin-bottom: 32px; }
        .dk-filter-groups { display: flex; flex-direction: column; gap: 14px; }
        .dk-filter-group { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .dk-filter-label { font-family: var(--dk-fd); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--dk-ink); min-width: 80px; }
        .dk-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .dk-pill { padding: 7px 14px; border-radius: var(--dk-radius-pill); background: var(--dk-paper); border: 1px solid var(--dk-border); font-size: 13px; color: var(--dk-ink-2); font-weight: 500; transition: background var(--dk-tx-fast), color var(--dk-tx-fast), border-color var(--dk-tx-fast); }
        .dk-pill:hover { border-color: var(--dk-coral); color: var(--dk-coral); }
        .dk-pill[aria-pressed='true'] { background: var(--dk-coral); color: var(--dk-paper); border-color: var(--dk-coral); }
        .dk-filter-meta { display: flex; align-items: center; gap: 20px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--dk-border); font-size: 14px; color: var(--dk-ink-2); }
        .dk-count { font-weight: 600; color: var(--dk-ink); }
        .dk-clear-btn { color: var(--dk-coral); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; font-size: 14px; }
        .dk-clear-btn:hover { color: var(--dk-coral-deep); }

        .dk-occ-section { margin-bottom: 56px; }
        .dk-occ-section:last-child { margin-bottom: 0; }
        .dk-occ-header { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1.5px solid var(--dk-ink); }
        .dk-occ-title { font-family: var(--dk-fd); font-weight: 600; font-size: clamp(32px, 5vw, 52px); line-height: 1.02; letter-spacing: -0.03em; color: var(--dk-ink); margin: 0; }
        .dk-occ-count { font-family: var(--dk-fd); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--dk-ink-3); }
        .dk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .dk-tile { background: var(--dk-paper); border-radius: var(--dk-radius); padding: 24px 22px 22px; box-shadow: var(--dk-shadow); border: 1.5px solid transparent; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 14px; min-height: 300px; transition: transform var(--dk-tx-fast), box-shadow var(--dk-tx-fast), border-color var(--dk-tx-fast); position: relative; overflow: hidden; }
        .dk-tile:hover { transform: translateY(-3px); box-shadow: var(--dk-shadow-hover); border-color: var(--dk-coral); }
        .dk-tile:focus-visible { outline: 2px solid var(--dk-coral); outline-offset: 3px; }
        .dk-tile-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .dk-tile-num { font-family: var(--dk-fd); font-weight: 300; font-style: italic; font-size: 52px; line-height: 0.85; color: var(--dk-coral); letter-spacing: -0.04em; }
        .dk-tile-macro-flag { font-family: var(--dk-fd); font-weight: 700; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dk-ink); border: 1px solid var(--dk-ink); padding: 4px 8px; border-radius: var(--dk-radius-pill); }
        .dk-tile-name { font-family: var(--dk-fd); font-weight: 600; font-size: 22px; line-height: 1.08; letter-spacing: -0.02em; color: var(--dk-ink); }
        .dk-tile-blurb { font-size: 13.5px; color: var(--dk-ink-2); line-height: 1.5; flex-grow: 1; }
        .dk-tile-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .dk-chip { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: var(--dk-radius-pill); letter-spacing: 0.02em; }
        .dk-chip-kcal { color: var(--dk-coral); border: 1px solid var(--dk-coral); }
        .dk-chip-effort { color: var(--dk-ink-2); border: 1px solid var(--dk-border-strong); }
        .dk-tile-tags { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10.5px; color: var(--dk-ink-3); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; padding-top: 4px; border-top: 1px dashed var(--dk-border); }
        .dk-tile-tag + .dk-tile-tag::before { content: ' · '; color: var(--dk-ink-3); padding: 0 2px; }

        .dk-empty { padding: 80px 20px; text-align: center; background: var(--dk-paper); border-radius: var(--dk-radius); margin-top: 20px; }
        .dk-empty h3 { font-family: var(--dk-fd); font-weight: 600; font-size: 32px; color: var(--dk-ink); margin: 0 0 12px; letter-spacing: -0.02em; }
        .dk-empty p { color: var(--dk-ink-2); margin: 0 0 24px; }

        .dk-coda { padding: 80px 0 100px; text-align: center; }
        .dk-coda-h2 { font-family: var(--dk-fd); font-weight: 400; font-style: italic; font-size: clamp(40px, 6vw, 76px); line-height: 1.02; letter-spacing: -0.03em; margin: 0 auto 32px; color: var(--dk-ink); max-width: 800px; }

        .dk-modal { border: none; padding: 0; border-radius: var(--dk-radius); background: var(--dk-paper); max-width: 640px; width: calc(100% - 32px); max-height: 90vh; overflow: hidden; box-shadow: 0 30px 80px -20px rgba(26, 23, 48, 0.4); color: var(--dk-ink); font-family: var(--dk-fb); }
        .dk-modal::backdrop { background: rgba(26, 23, 48, 0.55); backdrop-filter: blur(3px); }
        .dk-modal[open] { animation: dk-modal-in var(--dk-tx-mid) ease-out; }
        @keyframes dk-modal-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .dk-modal-body { padding: 32px 34px 28px; overflow-y: auto; max-height: 90vh; }
        .dk-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .dk-modal-eyebrow { font-family: var(--dk-fd); font-weight: 400; font-style: italic; font-size: 20px; color: var(--dk-coral); margin-bottom: 4px; }
        .dk-modal-title { font-family: var(--dk-fd); font-weight: 600; font-size: 42px; line-height: 1.02; letter-spacing: -0.025em; color: var(--dk-ink); }
        .dk-modal-close { width: 40px; height: 40px; border-radius: 50%; background: var(--dk-ink); color: var(--dk-paper); font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background var(--dk-tx-fast); }
        .dk-modal-close:hover { background: var(--dk-coral); }
        .dk-modal-blurb { font-size: 15px; color: var(--dk-ink-2); line-height: 1.55; margin-bottom: 22px; }
        .dk-modal-macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 16px; background: var(--dk-paper-warm); border-radius: var(--dk-radius-sm); margin-bottom: 22px; }
        .dk-modal-macros > div { text-align: center; }
        .dk-modal-macros > div span { display: block; font-family: var(--dk-fd); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--dk-ink-3); margin-bottom: 4px; }
        .dk-modal-macros > div strong { font-family: var(--dk-fd); font-weight: 600; font-size: 22px; color: var(--dk-ink); line-height: 1.1; }
        .dk-modal-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 18px 0; border-top: 1px solid var(--dk-border); border-bottom: 1px solid var(--dk-border); margin-bottom: 22px; }
        .dk-modal-meta > div span { display: block; font-family: var(--dk-fd); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--dk-ink-3); margin-bottom: 3px; }
        .dk-modal-meta > div strong { font-weight: 600; color: var(--dk-ink); font-size: 14px; }
        .dk-modal-section-title { font-family: var(--dk-fd); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--dk-coral); margin-bottom: 10px; }
        .dk-modal-ingredients { margin-bottom: 24px; }
        .dk-modal-ingredients li { padding: 9px 0; border-bottom: 1px dashed var(--dk-border); font-size: 14px; color: var(--dk-ink); }
        .dk-modal-ingredients li:last-child { border-bottom: none; }
        .dk-modal-method { counter-reset: step; margin-bottom: 22px; }
        .dk-modal-method li { position: relative; padding-left: 42px; margin-bottom: 14px; font-size: 14px; line-height: 1.55; color: var(--dk-ink-2); counter-increment: step; }
        .dk-modal-method li::before { content: counter(step, decimal-leading-zero); position: absolute; left: 0; top: -2px; font-family: var(--dk-fd); font-weight: 600; font-style: italic; font-size: 20px; color: var(--dk-coral); line-height: 1.2; }
        .dk-modal-note { padding: 14px 16px; background: var(--dk-lavender-soft); border-radius: var(--dk-radius-sm); font-size: 13px; color: var(--dk-ink-2); margin-bottom: 12px; }
        .dk-modal-note strong { font-family: var(--dk-fd); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--dk-coral); display: block; margin-bottom: 4px; }
        .dk-modal-actions { display: flex; gap: 6px; padding-top: 16px; border-top: 1px solid var(--dk-border); flex-wrap: wrap; margin-top: 8px; }
        .dk-modal-action-btn { font-size: 13px; font-weight: 500; color: var(--dk-ink-2); padding: 8px 14px; border-radius: var(--dk-radius-pill); transition: color var(--dk-tx-fast), background var(--dk-tx-fast); background: var(--dk-ink); color: var(--dk-paper); padding: 10px 18px; }
        .dk-modal-action-btn:hover { background: var(--dk-coral); color: var(--dk-paper); }

        @media (prefers-reduced-motion: reduce) {
          .dk-root *, .dk-root *::before, .dk-root *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          .dk-marquee-track { animation: none; }
        }
        @media (max-width: 1024px) { .dk-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px) {
          .dk-grid { grid-template-columns: repeat(2, 1fr); }
          .dk-modal-meta, .dk-modal-macros { grid-template-columns: repeat(2, 1fr); }
          .dk-hero { padding: 24px 0 40px; }
          .dk-filter-label { min-width: auto; width: 100%; }
          .dk-modal-body { padding: 24px 22px 20px; }
          .dk-modal-title { font-size: 32px; }
          .dk-tile { min-height: 280px; padding: 20px 18px 18px; }
          .dk-tile-num { font-size: 52px; }
        }
        @media (max-width: 440px) { .dk-grid { grid-template-columns: 1fr; } .dk-tile { min-height: 240px; } }
      `}</style>
    </div>
  );
}
