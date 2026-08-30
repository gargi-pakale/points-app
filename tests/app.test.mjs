import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "index.html contains the application script");
const core = script.split("/* ---- add a card ---- */")[0] + `
globalThis.__whichCardTest = {
  APP_VERSION, DATA_VERSION, CATS, DEFAULT_CARDS, CARD_CATALOG, CARD_LIBRARY, MERCHANTS, SEARCH_SHORTCUTS,
  POINT_GROUPS, POINT_PROGRAMS, pointAmount, formatPoints, creditAmount, formatCredit, expiryLabel,
  freshState, load, migrate, applyRoute, rank, headline, baseHeadline,
  findSearchHit, categoryMultiplier, biltHousingRate, capInfo, overridingPerk, protectionRunner, esc,
  setState(value){ S = value; }, getState(){ return S; }
};`;

let stored = null;
const localStorage = {
  getItem(){ return stored; },
  setItem(_key, value){ stored = value; }
};
const context = vm.createContext({console, localStorage});
new vm.Script(core, {filename:"index.html"}).runInContext(context);
const app = context.__whichCardTest;

function reset(change = {}){
  const state = app.freshState();
  Object.assign(state, change);
  app.setState(state);
  app.applyRoute();
  return state;
}
function cardResult(category, id, options){
  return app.rank(category, options).list.find(result => result.c.id === id);
}

test("United Explorer uses only the card-dependent 3x rate", () => {
  reset();
  const united = cardResult("unitedFlights", "united");
  assert.equal(united.mult, 3);
  assert.equal(united.c.earn.unitedFlights, 3);
});

test("Bilt receives no housing-conversion bonus when housing is zero", () => {
  reset({rent:0, biltOption:"flexible", biltRoute:"rent"});
  app.applyRoute();
  const bilt = cardResult("retail", "bilt");
  assert.equal(bilt.plus, 0);
  assert.equal(app.headline(bilt), "1x");
});

test("Bilt Flexible produces 2.33x only while housing can absorb the points", () => {
  reset({rent:4700, biltOption:"flexible", biltRoute:"rent", plusSpent:false});
  app.applyRoute();
  const active = cardResult("retail", "bilt");
  assert.equal(app.headline(active), "2.33x");
  app.getState().plusSpent = true;
  const exhausted = cardResult("retail", "bilt");
  assert.equal(app.headline(exhausted), "1x");
});

test("Bilt Housing-only uses the official spend-ratio tiers and no 4% Bilt Cash", () => {
  reset({rent:2000, biltOption:"housing", biltCycleSpend:1500});
  app.applyRoute();
  const rent = cardResult("rent", "bilt");
  const retail = cardResult("retail", "bilt");
  assert.equal(rent.mult, 1);
  assert.equal(retail.plus, 0);
  app.getState().biltCycleSpend = 2000;
  assert.equal(app.biltHousingRate(), 1.25);
});

test("BofA shared quarterly cap switches affected categories to the base rate", () => {
  const state = reset();
  state.capSpend.bofa = 2499;
  assert.equal(cardResult("online", "bofa").mult, 3);
  assert.equal(cardResult("groceriesOnline", "bofa").mult, 3);
  state.capSpend.bofa = 2500;
  assert.equal(cardResult("online", "bofa").mult, 1);
  assert.equal(app.capInfo(cardResult("online", "bofa").c, "online").exhausted, true);
});

test("user-facing rates keep point cards in x and cash-back cards in percent", () => {
  reset();
  assert.equal(app.headline(cardResult("dining", "csp")), "3x");
  assert.equal(app.headline(cardResult("online", "bofa")), "4.5%");
  assert.equal(app.baseHeadline(cardResult("retail", "bilt").c, "retail"), "1x");
  assert.doesNotMatch(html, /fmt\(best\.pct\) \+ '% return'/);
});

test("Costco in-store network filtering excludes Mastercard", () => {
  reset();
  const result = app.rank("groceries", {network:"Visa"});
  assert.equal(result.list.some(x => x.c.id === "bilt"), false);
  assert.equal(result.list.every(x => x.c.network === "Visa"), true);
});

test("issuer portal categories cannot award another issuer's portal rate", () => {
  reset();
  assert.deepEqual([...app.rank("flightsChase").list.map(x => x.c.id)], ["csp", "prime"]);
  assert.deepEqual([...app.rank("flightsCapone").list.map(x => x.c.id)], ["ventx"]);
  assert.deepEqual([...app.rank("hotelsBilt").list.map(x => x.c.id)], ["bilt"]);
  assert.deepEqual([...app.rank("hotelsCiti").list.map(x => x.c.id)], []);
  assert.equal(app.CATS.some(c => c.id === "flightsPortal" || c.id === "hotelsPortal"), false);
});

test("every shipped reward, caveat and protection points to a real category", () => {
  const ids = new Set(app.CATS.map(c => c.id));
  assert.equal(ids.size, app.CATS.length, "category ids are unique");
  const allCards = [...app.DEFAULT_CARDS, ...app.CARD_CATALOG];
  const cardIds = new Set(allCards.map(c => c.id));
  assert.equal(cardIds.size, allCards.length, "card ids are unique");
  for(const category of app.CATS){
    for(const cardId of category.eligibleIds || []) assert.ok(cardIds.has(cardId), `${category.id}.${cardId} is valid`);
  }
  for(const card of allCards){
    for(const group of [card.earn, card.caveat, card.perk, card.feeFree]){
      for(const id of Object.keys(group || {})) assert.ok(ids.has(id), `${card.id}.${id} is valid`);
    }
    for(const id of card.quarterlyCap?.cats || []) assert.ok(ids.has(id), `${card.id}.${id} is valid`);
    for(const route of Object.values(card.plusRoutes || {})){
      for(const id of route.notOn || []) assert.ok(ids.has(id), `${card.id}.${id} is valid`);
    }
  }
  for(const merchant of app.MERCHANTS) assert.ok(ids.has(merchant.cat), `${merchant.n} category is valid`);
  for(const shortcut of app.SEARCH_SHORTCUTS) assert.ok(ids.has(shortcut.cat), `${shortcut.q} category is valid`);
});

test("typed merchant search resolves exact intent instead of first substring", () => {
  assert.equal(app.findSearchHit("uber").cat, "transit");
  assert.equal(app.findSearchHit("Uber Eats").cat, "dining");
  assert.equal(app.findSearchHit("online").cat, "online");
  assert.equal(app.findSearchHit("online").how, "online");
  assert.equal(app.findSearchHit("Whole Foods").cat, "amazon");
  assert.equal(app.findSearchHit("Costco Travel rental car").cat, "rentalAgency");
  assert.equal(app.findSearchHit("Costco Travel rental car").how, "online");
  assert.equal(app.findSearchHit("Expedia").cat, "travelAgency");
  assert.equal(app.findSearchHit("Citi Travel hotel").cat, "hotelsCiti");
  assert.equal(app.findSearchHit("Citi Travel"), null);
  assert.equal(app.findSearchHit("Capital One Travel"), null);
  assert.equal(app.findSearchHit("zzzz-not-a-merchant"), null);
});

test("Citi Strata Premier template is complete and ranks only eligible Citi Travel purchases at 10x", () => {
  const state = reset();
  const template = app.CARD_CATALOG.find(card => card.id === "citi-strata-premier");
  assert.ok(template);
  assert.equal(template.cur, "citi");
  assert.equal(template.network, "Mastercard");
  assert.equal(template.af, 95);
  assert.equal(template.ftf, 0);
  assert.equal(template.earn.hotelsCiti, 10);
  assert.equal(template.earn.rentalCiti, 10);
  assert.equal(template.earn.attractionsCiti, 10);
  assert.equal(template.earn.travelAgency, 3);
  assert.equal(template.earn.rentalAgency, 3);
  state.cards.push({...JSON.parse(JSON.stringify(template)), on:true});
  state.cpp.citi = {name:"Citi ThankYou Points", cpp:1.7};
  assert.equal(cardResult("hotelsCiti", template.id).mult, 10);
  assert.equal(cardResult("travelAgency", template.id).mult, 3);
  assert.equal(cardResult("rentalAgency", template.id).mult, 3);
  assert.equal(cardResult("travelOther", template.id).mult, 1);
  assert.deepEqual([...app.rank("hotelsCiti").list.map(x => x.c.id)], [template.id]);
});

test("schema migration refreshes shipped rates but preserves personal multiplier", () => {
  const state = reset();
  state.schema = 1;
  state.cards.find(c => c.id === "united").earn.unitedFlights = 9;
  state.cards.find(c => c.id === "bilt").network = "";
  state.cards.find(c => c.id === "bofa").mult = 1.25;
  state.cards.forEach(c => c.verified = true);
  app.migrate();
  assert.equal(state.cards.find(c => c.id === "united").earn.unitedFlights, 3);
  assert.equal(state.cards.find(c => c.id === "bilt").network, "Mastercard");
  assert.equal(state.cards.find(c => c.id === "bofa").mult, 1.25);
  assert.equal(state.cards.some(c => c.verified), false);
  assert.equal(state.schema, 3);
});

test("manual points tracker starts empty and contains a valid popular-program library", () => {
  const state = reset();
  assert.deepEqual([...state.balances], []);
  const groups = new Set(app.POINT_GROUPS.map(group => group.id));
  const programs = new Set(app.POINT_PROGRAMS.map(program => program.id));
  assert.equal(programs.size, app.POINT_PROGRAMS.length);
  for(const program of app.POINT_PROGRAMS) assert.ok(groups.has(program.group), `${program.id} has a valid group`);
  assert.ok(app.POINT_PROGRAMS.some(program => program.id === "united-mileageplus"));
  assert.ok(app.POINT_PROGRAMS.some(program => program.id === "world-of-hyatt"));
});

test("manual point balances and airline credits migrate safely without account data", () => {
  const state = reset({balances:[{
    id:"balance-united", programId:"united-mileageplus", name:"United MileagePlus",
    short:"United Airlines", group:"airlines", initials:"ua", color:"#075aaa",
    balance:125689.4, expiryType:"never", flightCredit:246.789,
    creditExpiryType:"date", creditExpiryDate:"2027-06-01"
  }]});
  app.migrate();
  assert.equal(state.balances[0].balance, 125689);
  assert.equal(state.balances[0].flightCredit, 246.79);
  assert.equal(state.balances[0].initials, "UA");
  assert.equal(state.balances[0].creditExpiryDate, "2027-06-01");
  assert.equal("accountNumber" in state.balances[0], false);
});

test("manual balance formatting and expiration labels are deterministic", () => {
  assert.equal(app.formatPoints(125689.4), "125,689");
  assert.equal(app.formatCredit(246.789), "$246.79");
  const now = new Date(2026, 0, 1);
  assert.equal(app.expiryLabel({expiryType:"never"}, now), "does not expire");
  assert.equal(app.expiryLabel({expiryType:"unknown"}, now), "expiration unknown");
  assert.equal(app.expiryLabel({expiryType:"date", expiryDate:"2026-01-02"}, now), "expires in 1 day");
});

test("v2 user overrides survive migration while unmarked shipped values refresh", () => {
  const state = reset();
  const csp = state.cards.find(c => c.id === "csp");
  csp.earn.dining = 99;
  csp.userOverrides = {earn:true};
  app.migrate();
  assert.equal(csp.earn.dining, 99);
  delete csp.userOverrides.earn;
  app.migrate();
  assert.equal(csp.earn.dining, 3);
});

test("an intentionally empty card list stays empty after load", () => {
  const state = app.freshState();
  state.cards = [];
  stored = JSON.stringify(state);
  app.load();
  assert.deepEqual([...app.getState().cards], []);
});

test("foreign fees are subtracted instead of disqualifying a card", () => {
  reset();
  const bofa = cardResult("online", "bofa", {abroad:true});
  assert.ok(bofa);
  assert.equal(bofa.foreignFee, 3);
  assert.equal(bofa.pct, 1.5);
});

test("rental protection priorities keep Venture X first and Sapphire second", () => {
  reset();
  const cards = app.getState().cards;
  assert.equal(cards.find(c => c.id === "ventx").perk.rentalCar.priority, 3);
  assert.equal(cards.find(c => c.id === "csp").perk.rentalCar.priority, 2);
  assert.equal(cards.find(c => c.id === "bilt").perk.rentalCar.priority, 1);
  assert.equal(app.overridingPerk("rentalCar").c.id, "ventx");
  assert.equal(app.overridingPerk("rentalAgency").c.id, "ventx");
  const citi = {...JSON.parse(JSON.stringify(app.CARD_CATALOG[0])), on:true};
  cards.push(citi);
  const rentalList = app.rank("rentalAgency").list;
  assert.equal(app.protectionRunner("rentalAgency", "ventx", rentalList).c.id, "csp");
  cards.find(c => c.id === "ventx").on = false;
  assert.equal(app.overridingPerk("rentalCar").c.id, "csp");
  cards.find(c => c.id === "csp").on = false;
  assert.equal(app.overridingPerk("rentalCar"), null);
});

test("HTML escaping neutralizes stored custom names", () => {
  assert.equal(app.esc('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});

test("service worker isolates this app's caches and never caches error responses", () => {
  assert.match(serviceWorker, /startsWith\(CACHE_PREFIX\)/);
  assert.match(serviceWorker, /if\(response\.ok\)/);
  assert.match(serviceWorker, /e\.request\.mode === "navigate"/);
  assert.doesNotMatch(serviceWorker, /keys\.filter\(k => k !== CACHE\)/);
  assert.match(serviceWorker, /SKIP_WAITING/);
  assert.match(serviceWorker, new RegExp(`v${app.APP_VERSION.replaceAll(".", "\\.")}`));
});

test("manifest includes standard install icons", () => {
  assert.ok(manifest.icons.some(icon => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some(icon => icon.sizes === "512x512"));
});

test("primary mobile controls expose names and state to assistive technology", () => {
  assert.match(html, /<label class="sr-only" for="search">/);
  assert.match(html, /id="answer" role="status" aria-live="polite"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-expanded=/);
  assert.match(html, /aria-pressed=/);
  assert.doesNotMatch(html, /id="unver"|unconfirmed rate/i);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /id="pickq" aria-label="Search card library"/);
  assert.match(html, /id="program-pickq" aria-label="Search points programs"/);
  assert.match(html, /Manual only\. Balances stay in this browser/);
  assert.match(html, /data-tab="points"/);
  assert.doesNotMatch(html, /prompt\(/);
});
