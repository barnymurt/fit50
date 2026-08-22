const u = process.env.SUPABASE_URL;
const k = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  console.log('--- Check for remaining issues ---');

  // Names whose first character is a digit
  const digitStart = await fetch(u + '/rest/v1/foods?select=id,name&limit=200000', {
    headers: { apikey: k, Authorization: 'Bearer ' + k },
  });
  const all = await digitStart.json();
  const digit = all.filter((f) => /^\d/.test(f.name));
  console.log('Names starting with digit: ' + digit.length);
  digit.slice(0, 10).forEach((d) => console.log('  ' + JSON.stringify(d.name).slice(0, 80)));

  // Names whose first non-space char is non-letter
  const junk = all.filter((f) => /^[^A-Za-z]/.test(f.name.trim()));
  console.log('Names starting with non-letter: ' + junk.length);
  junk.slice(0, 10).forEach((d) => console.log('  ' + JSON.stringify(d.name).slice(0, 80)));

  // Names with leading size patterns that survived
  const sizePrefix = all.filter((f) => /^\s*\d+(\.\d+)?\s*(g|kg|oz|lb|ml|l|cl|%)\b/i.test(f.name));
  console.log('Names with leading size still there: ' + sizePrefix.length);
  sizePrefix.slice(0, 10).forEach((d) => console.log('  ' + JSON.stringify(d.name).slice(0, 80)));

  // Names containing &Quot;
  const quot = all.filter((f) => /&Quot;|&quot;/.test(f.name));
  console.log('Names with &Quot;: ' + quot.length);

  // Names containing &Deg;
  const deg = all.filter((f) => /&Deg;|&deg;/.test(f.name));
  console.log('Names with &Deg;: ' + deg.length);

  // Names starting with & or * or / or +
  const sym = all.filter((f) => /^[&*/+]/.test(f.name.trim()));
  console.log('Names starting with &*/+: ' + sym.length);
  sym.slice(0, 10).forEach((d) => console.log('  ' + JSON.stringify(d.name).slice(0, 80)));

  // Names with ", " at start (comma+space prefix)
  const comma = all.filter((f) => /^,/.test(f.name.trim()));
  console.log('Names starting with comma: ' + comma.length);
  comma.slice(0, 10).forEach((d) => console.log('  ' + JSON.stringify(d.name).slice(0, 80)));

  console.log('Total foods: ' + all.length);
})();