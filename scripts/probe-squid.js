const fs = require('fs');
const readline = require('readline');

(async () => {
  const rl = readline.createInterface({
    input: fs.createReadStream('C:/Users/bmurt/Downloads/archive/en.openfoodfacts.org.products.tsv', { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let header = null;
  let nameIdx, catsEnIdx, pnns1Idx, pnns2Idx, countriesIdx;
  const pnnsCounts = {};
  const pnns1Counts = {};
  const countriesCounts = {};
  const categEnCount = 0;
  let totalSquid = 0;
  for await (const line of rl) {
    if (!header) {
      header = line.split('\t');
      nameIdx = header.indexOf('product_name');
      catsEnIdx = header.indexOf('categories_en');
      pnns1Idx = header.indexOf('pnns_groups_1');
      pnns2Idx = header.indexOf('pnns_groups_2');
      countriesIdx = header.indexOf('countries_en');
      continue;
    }
    const cols = line.split('\t');
    if (cols.length < header.length) continue;
    const name = (cols[nameIdx] || '').toLowerCase();
    if (!(name.includes('squid') || name.includes('calamar'))) continue;
    totalSquid++;
    const p1 = (cols[pnns1Idx] || '').trim() || '(empty)';
    const p2 = (cols[pnns2Idx] || '').trim() || '(empty)';
    pnns1Counts[p1] = (pnns1Counts[p1] || 0) + 1;
    pnnsCounts[p2] = (pnnsCounts[p2] || 0) + 1;
    const c = (cols[countriesIdx] || '').trim() || '(empty)';
    countriesCounts[c] = (countriesCounts[c] || 0) + 1;
  }
  console.log('Total squid rows:', totalSquid);
  console.log('');
  console.log('pnns_groups_1 distribution:');
  Object.entries(pnns1Counts).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(' ', n, '-', k));
  console.log('');
  console.log('pnns_groups_2 distribution:');
  Object.entries(pnnsCounts).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(' ', n, '-', k));
  console.log('');
  console.log('Top 10 countries_en values:');
  Object.entries(countriesCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => console.log(' ', n, '-', k));
})();