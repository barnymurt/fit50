const fs = require('fs');
const readline = require('readline');

(async () => {
  const rl = readline.createInterface({
    input: fs.createReadStream('C:/Users/bmurt/Downloads/archive/en.openfoodfacts.org.products.tsv', { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let header = null;
  const queries = {
    squid: 0, cod: 0, salmon: 0, tuna: 0, mackerel: 0,
    prawn: 0, shrimp: 0, mussel: 0, oyster: 0, crab: 0,
    lobster: 0, sardine: 0, anchovy: 0, scallop: 0, clam: 0,
    haddock: 0, sea: 0, fish: 0, chicken: 0, beef: 0,
    pork: 0, lamb: 0, turkey: 0, duck: 0, rice: 0,
    pasta: 0, bread: 0, oats: 0, banana: 0, apple: 0,
  };
  for await (const line of rl) {
    if (!header) {
      header = line.split('\t');
      continue;
    }
    const cols = line.split('\t');
    if (cols.length < header.length) continue;
    const name = (cols[header.indexOf('product_name')] || '').toLowerCase();
    for (const q of Object.keys(queries)) {
      if (name.includes(q)) queries[q]++;
    }
  }
  console.log('OFF dump counts (all languages, all regions):');
  const sorted = Object.entries(queries).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of sorted) console.log(' ', n.toString().padStart(5), k);
})();