# Ablakbázis – 3D ablak- és párkány-összeállító

Bemutató változat az Ablakbázis (ablakbazis.hu) arculatával, a készülő párkányos oldalhoz.
Vite + React + TypeScript, a 3D nézet three.js / @react-three/fiber + drei. Minden kép és textúra kódból készül.

**Élő változat:** https://stratoswebdesign.github.io/ablakbazis-konfigurator/

## Mit tud

- **Termékek:** műanyag ablak, erkélyajtó, bejárati ajtó, és önálló **párkány**.
- **Profilrendszer:** Kömmerling 76 AD / 76 MD / 88 MD. A 3D tok mélysége a rendszerhez igazodik (76 vagy 88 mm). Az üvegezés 2 vagy 3 rétegű lehet.
- **Méret:** mm-ben, a modell valós arányban követi. Az erkélyajtónál a rendszer saját tokmérettartománya érvényes.
- **Osztás:** 1–3 mező (bukó-nyíló / nyíló / fix, pántoldal). A szárny a modellen be is mutatja a nyitást.
- **Szín** (kívül-belül vagy csak kívül) és **kilincs**.
- **Párkány:**
  - belső párkány: fehér / márvány hatású / aranytölgy / antracit, mélységgel;
  - külső alumínium párkány: vízorral, véglezáróval, mélységgel.
  - A modell ezen a lépésen ráközelít a párkányra, és kiírja a mélységet.
- **Redőny:** külső tokos / vakolható / ráépíthető, mindegyik a saját beépítési helyén. Ha a méret túllépi az ablakbazis.hu-n közölt határt, figyelmeztet. Szúnyogháló is választható.
- **Összegzés** nézetrajzzal, **ajánlatkérés** régióval, és a végén az **értékesítői adatlap**: nézetrajz, látványkép, minden adat, az értékesítő által kitöltendő mezők. A bemutató változat **nem küld adatot**.

## Bemutató – közvetlen linkek

A konfigurátor URL-ből is beállítható (`?…` a cím végén):

| Mit mutat | Link vége |
|---|---|
| Kezdés | `/` |
| Csak párkány, márvány hatású belső | `?product=parkany&step=parkany&sillIn=marvany` |
| Antracit ablak kívülről, külső tokos redőnnyel | `?step=arnyekolas&color=antracit&shutter=kulso-tokos&shutterPos=0.45&view=outside` |
| 3 mezős ablak, 88 MD | `?step=osztas&system=k88md&fields=bn-b,f,bn-j` |
| Bejárati ajtó két oldalvilágítóval | `?product=bejarati-ajto&step=osztas&fields=o,a,o&panel=uvegcsik` |
| Kész adatlap | `?sheet=1` |

Javasolt 5 perces bemutató:

1. Műanyag ablak, és mutasd meg a három Kömmerling-rendszert.
2. Írj be egy méretet: a modell követi, a méretvonal élőben frissül.
3. Osztás: jelölj ki egy mezőt, majd „Nyitás bemutatása”.
4. Szín antracit, „Csak kívül”.
5. Párkány: márvány hatású belső, majd „Mutasd kívülről”, és állítsd a külső párkány mélységét.
6. Redőny: a három típus egymás után. Egy 1900 mm széles ablaknál előjön a figyelmeztetés.
7. Összegzés, ajánlatkérés, és végül az értékesítői adatlap.

## Fejlesztés

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

A `main` ágra pusholt változatot a GitHub Actions automatikusan kiteszi a GitHub Pages-re (`.github/workflows/pages.yml`).

## Adatok és testreszabás

Minden ügyfélspecifikus adat egy helyen van: `src/config/brands/ablakbazis.ts`. Ide tartoznak a színek, a betűk, a termékek, a rendszerek, a redőnytípusok, a párkányok, a régiók és a telefonszám.

- **Az ablakbazis.hu oldalairól származik** (2026-11-25): a Kömmerling-rendszerek és jellemzőik, az erkélyajtó-mérettartományok, a redőnytípusok és határaik, a régiók és a telefonszám.
- **Mintakínálat, egyeztetendő:** a keretszínek és a párkányok választéka (anyagok, színek, mélységtartomány).
- **Helyőrző az adatlapon:** U-érték és ár, ezeket az értékesítő tölti ki.
- **Kontraszt:** a narancs gomb egy árnyalattal sötétebb, mint az ablakbazis.hu-n. Ott a fehér felirat kontrasztja 2,3:1, itt a nagy, félkövér felirattal megfelel a WCAG-nek.

Készítette: Stratos Webdesign
