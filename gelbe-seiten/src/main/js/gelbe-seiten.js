class Frachtkarte {
    /** @type JSON */
    #versandDaten;
    /** @type JSON */
    #empfangsDaten;
    #inhaber = '';
    #mapper = undefined;

    constructor(/*JSON*/versandDaten, /*JSON*/empfangsDaten) {
        this.#versandDaten = versandDaten;
        this.#empfangsDaten = empfangsDaten;
        this.#mapper = new Map();
        this.#mapper.set('Zielbahnhof', 'betriebsstelle');
        this.#mapper.set('Empfänger', 'empfaenger');
        this.#mapper.set('Epoche', 'epoche');
        this.#mapper.set('Gattung', 'wagengattung');
        this.#mapper.set('Ladung', 'produkt');
        this.#mapper.set('Versandbahnhof', 'betriebsstelle');
        this.#mapper.set('Versender', 'versender');
        this.#mapper.set('Bemerkungen', 'bemerkungen');
    }

    hatInhaber() {
        return /** @type Boolean*/ this.holeInhaber().length > 0;
    }

    holeInhaber() {
        return /** @type String */ this.#inhaber;
    }

    setzeInhaber(/*String */inhaber) {
        this.#inhaber = inhaber;
    }

    equals(/*Frachtkarte*/other) {
        if (other === null || other === undefined || typeof other !== 'object' || !(other instanceof Frachtkarte)) {
            return false;
        }
        return JSON.stringify(this.#versandDaten) === JSON.stringify(other.#versandDaten) && JSON.stringify(this.#empfangsDaten) === JSON.stringify(other.#empfangsDaten) && this.#inhaber === other.#inhaber;
    }

    #zeilenEintrag(/*Window*/fenster, /*String|Array*/titel, /*String|JSON|Array*/inhalt, spaltenBreiten = []) {
        let zeilenStil = 'height:1.15cm;margin:0;border-bottom:1px solid black;display:grid;grid-template-rows:min-content auto;';
        const zeile = fenster.document.createElement('div');

        if (!Array.isArray(titel)) {
            titel = [titel];
        }
        if (!Array.isArray(inhalt)) {
            inhalt = [inhalt];
        }
        if (titel.length !== inhalt.length) {
            throw new Error('Falsche Anzahl');
        }
        if (titel.length > 1 && inhalt.length > 1 && spaltenBreiten.length === 0) {
            throw new Error('Bei mehreren Spalten müssen Spaltenbreiten je Spalte angegeben werden!');
        }

        titel.forEach((t, i) => {
            const zeilenBeschriftung = fenster.document.createElement('span');
            zeilenBeschriftung.textContent = t + ':';
            let stile = 'font-size:x-small;padding-left:.1rem;';
            if (i > 0){
                stile += 'border-left:1px solid black;'
            }
            zeilenBeschriftung.setAttribute('style', stile);
            zeile.appendChild(zeilenBeschriftung);
        });

        inhalt.forEach((t, i) => {
            const zeilenInhalt = fenster.document.createElement('p');
            let stile = 'margin:.1rem 0px 0px;text-align:center;';
            if (i > 0) {
                stile += 'border-left:1px solid black;';
            }
            zeilenInhalt.setAttribute('style', stile);
            zeilenInhalt.setAttribute('class', 'inhalt');
            if (typeof t === "string") {
                zeilenInhalt.textContent = t;
            } else {
                zeilenInhalt.textContent = t[this.#mapper.get(titel[i])];
            }
            zeile.appendChild(zeilenInhalt);
            /*if ((titel[i] === 'Versandbahnhof' || titel[i] === 'Zielbahnhof') && zeilenInhalt.textContent === 'ROT') {
                zeilenStil += "background-color:red;color:white;"
            }*/
            zeilenInhalt.addEventListener('click', (e) => {
                e.preventDefault();
                this.#aenderbaresElement(fenster, zeilenInhalt).
                then(neuerWert => {
                    inhalt[i][this.#mapper.get(titel[i])] = neuerWert;
                    fenster.document.dispatchEvent(new CustomEvent('zettel', {bubbles: true, detail: neuerWert}));
                });
            });
        });
        // Bei mehreren Spalten müssen die Spaltenbreiten angegeben werden.
        if (titel.length > 1 && inhalt.length > 1) {
            zeilenStil += 'grid-template-columns:' + spaltenBreiten.join(" ");
        }
        zeile.setAttribute('style', zeilenStil);
        return zeile;
    }

    #isOverflown = ({ clientHeight, scrollHeight }) => scrollHeight > clientHeight;

    // https://dev.to/jankapunkt/make-text-fit-it-s-parent-size-using-javascript-m40
    #resizeText = ({ element, elements, minSize = 10, maxSize = 512, step = 1, unit = 'px' }) => {
        (elements || [element]).forEach(el => {
            let i = minSize
            let overflow = false

            const parent = el.parentNode

            while (!overflow && i < maxSize) {
                el.style.fontSize = `${i}${unit}`
                overflow = this.#isOverflown(parent)

                if (!overflow) i += step
            }

            // revert to last state where no overflow happened
            el.style.fontSize = `${i - step}${unit}`
        })
    }

    #aenderbaresElement(/*Window*/fenster, /*Node*/elternElement) {
        return /** @type Promise<String>*/new Promise(resolve => {
            if (elternElement.nodeType === Node.TEXT_NODE) {
                elternElement = elternElement.parentElement;
            }
            const eingabeElement = fenster.document.createElement('input');
            eingabeElement.setAttribute('type', 'text');
            eingabeElement.setAttribute('size', '15');
            eingabeElement.setAttribute('value', elternElement.textContent);
            eingabeElement.addEventListener('keydown', (i) => {
                if (i.key === 'Enter' || i.key === 'Escape') {
                    /** @type String */
                    const wert = fenster.escapedHTMLPolicy.createHTML(i.target.value).toString();
                    elternElement.removeChild(eingabeElement);
                    elternElement.textContent = wert;
                    resolve(wert);
                }
            });
            elternElement.textContent = '';
            elternElement.appendChild(eingabeElement);
            eingabeElement.focus();
            eingabeElement.setSelectionRange(eingabeElement.value.length, eingabeElement.value.length);
        });
    }

    html(/*Window*/fenster, /*HTMLElement*/elternElement) {
        const frachtzettel = fenster.document.createElement('div');
        frachtzettel.setAttribute('style', 'width:5cm;height:8.5cm;border:2px solid black;margin:0;margin-top:1rem;');
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, 'Zielbahnhof', this.#empfangsDaten));
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, 'Empfänger', this.#empfangsDaten));
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, ['Epoche', 'Gattung'], [this.#empfangsDaten, this.#empfangsDaten], ['25%', '75%']))
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, 'Ladung', this.#empfangsDaten));
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, 'Versandbahnhof', this.#versandDaten));
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, 'Versender', this.#versandDaten));
        frachtzettel.appendChild(this.#zeilenEintrag(fenster, 'Bemerkungen', this.#empfangsDaten));
        // Inhaber Zeile
        const inhaber = fenster.document.createElement('p');
        inhaber.textContent = this.holeInhaber();
        inhaber.setAttribute('style', 'width:100%;height:.25cm;margin:0;font-size:x-small;padding-left:.1rem;');
        inhaber.addEventListener('click', (e) => {
            e.preventDefault();
            this.#aenderbaresElement(fenster, e.target).then((neuerWert) => {
                this.setzeInhaber(neuerWert.toString());
                fenster.document.dispatchEvent(new CustomEvent('zettel', {bubbles: true, detail: neuerWert.toString()}));
            });
        });
        frachtzettel.appendChild(inhaber);
        // Hier wird das Frachtzettelelement in den DOM eingefügt und erst jetzt werden die Elementgrößen berechnet
        elternElement.appendChild(frachtzettel);
        const linieSchnell = fenster.document.createElement('hr');
        linieSchnell.setAttribute('style', 'display: none;');
        linieSchnell.classList.add('linie-schnell');
        frachtzettel.appendChild(linieSchnell);
        const linieSauSchnell = fenster.document.createElement('hr');
        linieSauSchnell.setAttribute('style', 'display: none;');
        linieSauSchnell.classList.add('linie-sauschnell');
        frachtzettel.appendChild(linieSauSchnell);
        const {breite, winkel, xVerschiebung, yVerschiebung} = this.#linienMasze(frachtzettel);
        if (this.#empfangsDaten['wagengattung'].endsWith('ss')) {
            linieSchnell.setAttribute('style', `transform: translateX(${xVerschiebung * 0.98}px) translateY(${yVerschiebung * 1.065}px) rotate(${winkel}rad); width:${breite * 95 / 100}px;border:2px solid red;color:red;`);
            linieSauSchnell.setAttribute('style', `transform: translateX(${xVerschiebung * 0.88}px) translateY(${yVerschiebung * 1.0675}px) rotate(${winkel}rad); width:${breite * 95 / 100}px;border:2px solid red;color:red;`);
        } else if (this.#empfangsDaten['wagengattung'].endsWith('s')) {
            linieSchnell.setAttribute('style', `transform: translateX(${xVerschiebung}px) translateY(${yVerschiebung * 1.03}px) rotate(${winkel}rad); width:${breite * 98 / 100}px;border:2px solid red;color:red;`);
        }
        this.#resizeText({elements: fenster.document.querySelectorAll('p.inhalt'), step: 0.5, maxSize: 16});
        return frachtzettel;
    }

    #linienMasze(/*HTMLElement*/element) {
        // enthält Elementabmessungen mit Grenzlinienbreiten
        const rect = element.getBoundingClientRect();
        const breite = Math.round(Math.sqrt(Math.pow(element.clientHeight,2) + Math.pow(element.clientWidth,2)));
        const winkel = -Math.atan(element.clientHeight / element.clientWidth);
        const grenzenLinienBreiten = rect.width - element.clientWidth;
        const x = -Math.round((element.clientWidth / 2) - grenzenLinienBreiten);
        const y = -Math.round((element.clientHeight / 2) + (grenzenLinienBreiten));
        return {breite: breite, winkel: winkel, xVerschiebung: x, yVerschiebung: y};
    }

    toString() {
        return JSON.stringify(this);
    }
}

class RechtsKlickMenue {
    /** @type String*/
    static #elementStilKlasse = 'context-menu';
    /** @type HTMLDivElement */
    #element;
    /** @type String*/
    #elementIdent;

    constructor(/*Window*/fenster) {
        this.#elementIdent = RechtsKlickMenue.#elementStilKlasse;
        const stile = fenster.document.getElementsByTagName('style')[0];
        // Stile nur einmal hinzufügen!
        if (!stile.innerHTML.includes('.context-menu {')) {
            stile.innerHTML += fenster.escapedHTMLPolicy.createHTML(`
                .context-menu {
                    position: fixed;
                    display: none;
                    width: 140px;
                    box-shadow: 2px 2px 9px #aaa;
                    overflow: hidden;
                    border:solid 1px #aaa;
                    z-index: 10000;
                }
                .context-menu > div {
                    padding: 10px;
                    background: #eee;
                    border-bottom: solid 1px #aaa;
                    font-size: 11pt;
                    cursor: pointer;
                    pointer-events: auto;
                }
                .context-menu > div:hover{
                    background:#fff;
                }
                .context-menu.show{
                    display:block;
                }
                @media print { .context-menu { display: none !important; } }`);
        }
        this.#element = fenster.document.getElementById(this.#elementIdent);
        if (this.#element === null) {
            this.#element = fenster.document.createElement('div');
            this.#element.setAttribute('id', this.#elementIdent);
            this.#element.setAttribute('class', this.#elementIdent);
            fenster.document.body.appendChild(this.#element);
        }
    }

    static fuerKnoten(/*Window*/fenster, /*Node*/knoten, /*Array<Object>*/menueInhalt) {
        const menue = new RechtsKlickMenue(fenster);
        knoten.addEventListener('contextmenu', (outerEvent) => {
            const { clientX: mouseX, clientY: mouseY } = outerEvent;
            const rect = knoten.getBoundingClientRect();
            if (outerEvent.target === knoten || ((mouseX >= rect.left || mouseX <= rect.right) && (mouseY >= rect.top || mouseY <= rect.bottom))) {
                outerEvent.preventDefault();
                outerEvent.stopPropagation();

                menue.#element.innerHTML = '';
                menueInhalt.forEach((item)=> {
                    const menuitem = fenster.document.createElement('div');
                    menuitem.textContent = item.Text;
                    menuitem.addEventListener('click', item.Action.bind(this));
                    menue.#element.appendChild(menuitem);
                });

                menue.#element.style.left = `${mouseX}px`;
                menue.#element.style.top = `${mouseY}px`;
                menue.#element.classList.add('show');
                menue.#element.parentElement.addEventListener('click', (innerEvent) => {
                    innerEvent.preventDefault();
                    menue.#element.classList.remove('show');
                });
            }
        });
    }
}

class ModalerDialog {
    static #elementStilKlasse = 'modaler-dialog';
    /** @type HTMLDialogElement */
    #element;
    /** @type HTMLParagraphElement */
    #frage;
    /** @type HTMLDivElement */
    #knoepfe;

    constructor(/*Document*/basisDokument) {
        this.#element = basisDokument.getElementById(ModalerDialog.#elementStilKlasse);
        if (this.#element === null) {
            this.#element = basisDokument.createElement('dialog');
            basisDokument.body.appendChild(this.#element);
            this.#frage = basisDokument.createElement('p');
            this.#element.appendChild(this.#frage);
            this.#knoepfe = basisDokument.createElement('div');
            this.#element.appendChild(this.#knoepfe);
        }
    }

    static async optionenDialog(/*Window*/fenster, /*String|Array*/nachrichten, /*Array<{}>*/optionen, /*Number*/initialeOption) {
        const dialog = new ModalerDialog(fenster.document);

        if (Array.isArray(nachrichten)) {
            nachrichten.forEach((nachricht, index) => {
                if (index > 0) {
                    dialog.#frage.appendChild(fenster.document.createElement('br'));
                }
                if (typeof nachricht === 'object') {
                    const span = fenster.document.createElement('span');
                    span.setAttribute('style', nachricht.stile);
                    span.textContent = nachricht.inhalt;
                    dialog.#frage.appendChild(span);
                } else {
                    dialog.#frage.appendChild(fenster.document.createTextNode(nachricht));
                }
            });
        } else {
            dialog.#frage.innerHTML = nachrichten;
        }
        dialog.#knoepfe.setAttribute('style', 'display:grid;gap:.5rem;grid-template-columns:repeat(' + optionen.length + ', min-content);justify-content:end;');

        optionen.forEach((option, index) => {
            const knopf = fenster.document.createElement('button');
            knopf.textContent = option.text;
            if (index === initialeOption) {
                knopf.autofocus = true;
                knopf.focus();
            }
            dialog.#knoepfe.appendChild(knopf);
            option['element'] = knopf;
        });

        dialog.#element.showModal();

        return /** @type Promise<any>*/new Promise(resolve => {
            optionen.forEach(knopf => {
                knopf.element.addEventListener('click', (e) => {
                    e.preventDefault();
                    resolve(knopf.wert);
                    dialog.#element.close();
                    fenster.document.body.removeChild(dialog.#element);
                });
            });
        });
    }
}

class FrachtkartenSpeicher {
    static #seitenStile = 'background:white;display:flex;margin:0 auto;margin-bottom:0.5cm;box-shadow:0 0 0.5cm rgba(0,0,0,0.5);width:21cm;height:29.7cm;flex-flow:row wrap;justify-content:center;'
    #maximaleAnzahlProSeite = 12;
    /** @type Array<Frachtkarte>*/
    #frachtkarten = [];
    /** @type Window */
    #anzeigeFenster;
    /** @type Function */
    #aktualisiereAnzahlUeberwacher;

    constructor() {
    }

    erzeugeFrachtkarte(/*JSON*/versandDaten, /*JSON*/empfangsDaten) {
        return new Frachtkarte(versandDaten, empfangsDaten);
    }

    push(/*Frachtkarte*/frachtkarte) {
        if (frachtkarte instanceof Frachtkarte && !this.#frachtkarten.find((inside) => inside.equals(frachtkarte))) {
            this.#frachtkarten.push(frachtkarte);
            if (this.#anzeigeFenster) {
                this.#frachtzettelAnzeigeAktualisieren(this.#anzeigeFenster);
            } else {
                if (this.#aktualisiereAnzahlUeberwacher) {
                    this.#aktualisiereAnzahlUeberwacher(this.holeAktuelleAnzahl());
                }
            }
        }
    }

    holeAktuelleAnzahl() {
        return this.#frachtkarten.length;
    }

    #frachtzettelAnzeigeAktualisieren(/*Window*/fenster) {
        fenster.document.body.innerText = '';
        /** @type Array<Object>*/
        const fensterMenueInhalt = [];
        fensterMenueInhalt.push({Text: 'Fenster schließen', Action: () => {fenster.close(); this.#anzeigeFenster = null;}});
        let seite;
        if (this.#frachtkarten.length > 0) {
            const hatInhaber = this.#frachtkarten.find((zettel) => zettel.hatInhaber());
            if (hatInhaber) {
                fensterMenueInhalt.unshift({Text: 'Inhaber für alle Frachtkarten übernehmen', Action: async () => {
                        const uebernahme = await this.#jaAbbrechenDialog(
                            fenster,
                            "Inhaber \"" + hatInhaber.holeInhaber() + "\" für alle Frachtkarten übernehmen?",
                            "Diese Aktion überschreibt alle vorhandenen Inhaber!");
                        if (uebernahme) {
                            this.#frachtkarten.forEach(karte => {
                                karte.setzeInhaber(hatInhaber.holeInhaber());
                            });
                            this.#frachtzettelAnzeigeAktualisieren(fenster);
                        }
                    }});
            }
            fensterMenueInhalt.unshift(
                {Text: 'Alle Frachtkarten drucken', Action: () => fenster.print()},
                {Text: 'Alle Frachtkarten entfernen', Action: async () => {
                        const kannGeloeschtWerden = await this.#jaAbbrechenDialog(
                            fenster,
                            "Wirklich alle Frachtkarten löschen?",
                            "Diese Aktion kann nicht rückgängig gemacht werden!");
                        if (kannGeloeschtWerden) {
                            this.#frachtkarten = [];
                            this.#frachtzettelAnzeigeAktualisieren(fenster);
                        }
                    }});
            this.#frachtkarten.forEach((frachtkarte, index) => {
                if (index % this.#maximaleAnzahlProSeite === 0) {
                    seite = fenster.document.createElement('section');
                    seite.setAttribute('style', FrachtkartenSpeicher.#seitenStile);
                    fenster.document.body.appendChild(seite);
                    RechtsKlickMenue.fuerKnoten(fenster, seite, fensterMenueInhalt);
                }
                const node = frachtkarte.html(fenster, seite);
                RechtsKlickMenue.fuerKnoten(fenster, node, [{Text: 'Frachtkarte entfernen', Action: async () => {
                        const kannGeloeschtWerden = await this.#jaAbbrechenDialog(
                            fenster,
                            "Frachtkarte wirklich löschen?",
                            "Diese Aktion kann nicht rückgängig gemacht werden!");
                        if (kannGeloeschtWerden) {
                            this.#frachtkarten.splice(index, 1);
                            this.#frachtzettelAnzeigeAktualisieren(fenster);
                        }
                    }}]);
            });
        } else {
            seite = fenster.document.createElement('section');
            seite.setAttribute('style', FrachtkartenSpeicher.#seitenStile);
            RechtsKlickMenue.fuerKnoten(fenster, seite, fensterMenueInhalt);
            fenster.document.body.appendChild(seite);
        }
        if (this.#aktualisiereAnzahlUeberwacher) {
            this.#aktualisiereAnzahlUeberwacher(this.holeAktuelleAnzahl());
        }
    }

    anzeigen() {
        this.#anzeigeFenster = window.open();

        const meta = this.#anzeigeFenster.document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Security-Policy');
        meta.setAttribute('content', "require-trusted-types-for 'script'");
        this.#anzeigeFenster.document.head.appendChild(meta);

        if (!this.#anzeigeFenster.trustedTypes || !this.#anzeigeFenster.trustedTypes.createPolicy) {
            this.#anzeigeFenster.trustedTypes = { createPolicy: (n, rules) => rules };
        } else {
            this.#anzeigeFenster.escapedHTMLPolicy = this.#anzeigeFenster.trustedTypes.createPolicy("default", {
                createHTML: (string) => string.replace(/</g, "&lt;")
            });
        }

        this.#anzeigeFenster.document.title = 'Frachtkarten-Speicher Ansicht';

        const stile = this.#anzeigeFenster.document.createElement('style');
        stile.innerHTML = this.#anzeigeFenster.escapedHTMLPolicy.createHTML(`
        @media print { 
            body, section { margin: 0px !important; padding: 0; box-shadow: 0; font-family: "Arial", "Verdana", "Helvetica", sans-serif;} 
            section { break-inside: avoid !important; }
        }
        @page {size: A4 portrait; margin: 0 !important;}`);
        this.#anzeigeFenster.document.head.appendChild(stile);

        this.#anzeigeFenster.document.body.setAttribute('style', 'background: rgb(204,204,204); font-family: "Arial", "Verdana", "Helvetica", sans-serif;');

        this.#frachtzettelAnzeigeAktualisieren(this.#anzeigeFenster);
        this.#anzeigeFenster.addEventListener('zettel', () => this.#frachtzettelAnzeigeAktualisieren(this.#anzeigeFenster));
    }

    setzeAnzahlUeberwacher(auszufuehrendeFunktion) {
        // noinspection JSValidateTypes
        this.#aktualisiereAnzahlUeberwacher = new Proxy(auszufuehrendeFunktion, {
            apply(target, thisArg, args) {
                return target(...args);
            }});
    }

    async #jaAbbrechenDialog(/*Window*/fenster, /*String*/frage, /*String*/hinweis) {
        return ModalerDialog.optionenDialog(fenster, [frage, {inhalt: hinweis, stile: 'color:red;'}], [{text: 'Ja', wert: true},{text:'Abbrechen', wert: false}], 1);
    }

    toString() {
        return JSON.stringify(this.#frachtkarten);
    }
}

class GelbeSeiten {
    static #fuellWoerter = ['und', 'oder', 'in', 'für', 'als', 'nach', 'auch', 'von', 'usw.'];
    #standardEpoche = 'IV';
    #aktuelleFilterWerte = {
        kategorie: '',
        produkt: '',
        versender: '',
        wagentyp: '',
        betriebsstelle: '',
        ladestelle: '',
        stueckgut: '',
        expressgut: '',
        betriebsstellen: [],
        empfang: []
    };
    /** @type FrachtkartenSpeicher */
    #frachtkartenSpeicher = undefined;
    #alleTabellenZeilenAktuelleEpoche = undefined;
    #gesamtFilter = undefined;
    #epocheAuswahlElement = undefined;

    constructor() {
        this.#frachtkartenSpeicher = new FrachtkartenSpeicher();
    }

    #wendeGesamtFilterAufTabellenZeilenAn = () => {
        if (this.#epocheAuswahlElement) {
            this.#alleTabellenZeilenAktuelleEpoche.forEach(zeile => {
                if (this.#gesamtFilter) {
                    const istSichtbar = this.#gesamtFilter(this.#aktuelleFilterWerte, zeile);
                    zeile.style.display = !istSichtbar ? 'none' : '';
                    if (!istSichtbar) {
                        zeile.classList.add('ausgeblendet');
                    } else {
                        zeile.classList.remove('ausgeblendet');
                    }
                }
            });
            // restyle all table rows to be stripped again properly
            document.querySelectorAll('tbody tr:not(.ausgeblendet)').forEach((zeile, index) => {
                zeile.style.backgroundColor = (index % 2 === 0) ? 'transparent' : '#e0d5d5';
            });
        }
    }

    #erneuereAnzeigeBetriebsstellenAuswahl = () => {
        const auswahlAnzeigeElement = document.getElementById('gs-betriebsstellen-auswahl-anzeige');
        auswahlAnzeigeElement.innerHTML = '';
        this.#aktuelleFilterWerte['betriebsstellen'].forEach(betriebsstelle => {
            if (auswahlAnzeigeElement.hasChildNodes()) {
                auswahlAnzeigeElement.appendChild(document.createTextNode(", "))
            }
            const betriebsstelleEintragElement = document.createElement('span');
            betriebsstelleEintragElement.style.paddingRight = '1rem';
            betriebsstelleEintragElement.innerHTML = `${betriebsstelle}&nbsp;`;
            const entfernenElement = document.createElement('a');
            entfernenElement.href = '#';
            entfernenElement.classList.add('entfernen-symbol');
            entfernenElement.addEventListener('click', (event) => {
                event.preventDefault();
                const entferneIndex = this.#aktuelleFilterWerte['betriebsstellen'].indexOf(betriebsstelle)
                if (entferneIndex > -1) {
                    this.#aktuelleFilterWerte['betriebsstellen'].splice(entferneIndex, 1);
                    this.#erneuereAnzeigeBetriebsstellenAuswahl();
                    this.#wendeGesamtFilterAufTabellenZeilenAn();
                }
            });
            betriebsstelleEintragElement.appendChild(entfernenElement);
            auswahlAnzeigeElement.appendChild(betriebsstelleEintragElement);
        });
        if (this.#aktuelleFilterWerte['betriebsstellen'].length === 0) {
            auswahlAnzeigeElement.innerHTML = 'Derzeit keine ausgewählt';
        }
    }

    #optionenElement = (wert, text) => {
        const option = document.createElement('option');
        option.value = wert;
        option.text = text;
        return option;
    }

    #clearElement = (element) => {
        if (element.hasChildNodes()) {
            element.innerHTML = '';
        }
    }

    erstelleBenutzerSchnittstelle(referenzKnoten) {
        // https://www.svgrepo.com/svg/497085/filter-search
        const sucheFilterBild = "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'%3E%3C/g%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'%3E%3C/g%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Cpath d='M14.3201 19.07C14.3201 19.68 13.92 20.48 13.41 20.79L12.0001 21.7C10.6901 22.51 8.87006 21.6 8.87006 19.98V14.63C8.87006 13.92 8.47006 13.01 8.06006 12.51L4.22003 8.47C3.71003 7.96 3.31006 7.06001 3.31006 6.45001V4.13C3.31006 2.92 4.22008 2.01001 5.33008 2.01001H18.67C19.78 2.01001 20.6901 2.92 20.6901 4.03V6.25C20.6901 7.06 20.1801 8.07001 19.6801 8.57001' stroke='%23292D32' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M16.07 16.52C17.8373 16.52 19.27 15.0873 19.27 13.32C19.27 11.5527 17.8373 10.12 16.07 10.12C14.3027 10.12 12.87 11.5527 12.87 13.32C12.87 15.0873 14.3027 16.52 16.07 16.52Z' stroke='%23292D32' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M19.87 17.12L18.87 16.12' stroke='%23292D32' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3C/g%3E%3C/svg%3E";
        let html =
            '<table style="border-spacing:1px;border-collapse:separate;width: 100%;">' +
            '<thead style="background-color:#C0C0C0; position: -webkit-sticky; position: sticky; top: 0;">' +
            '<tr>' +
            '<th style="text-align:right;padding:0;" rowspan="2"><label for="gs-betriebsstellen-auswahl-filter">Betriebsstellen:</label></th>' +
            '<th colspan="5" style="padding: 0.5em; text-align: left;"><input type="search" id="gs-betriebsstellen-auswahl-filter" size="30" list="betriebsstellen-liste"><datalist id="betriebsstellen-liste"></datalist><button id="gs-zum-bertriebsstellen-filter-hinzufuegen">Hinzufügen</button></th>' +
            '<th style="text-align:right;padding:0;" rowspan="2"><label for="gs-epochen-auswahl">Epoche:</label></th>' +
            '<th style="padding: 0.5em;" rowspan="2"><select id="gs-epochen-auswahl"></select></th>' +
            '<th style="text-align:center;" rowspan="2"><input type="button" value="Alle Text-Filter löschen" id="gs-filter-entfernen"></th>' +
            '</tr>' +
            '<tr>' +
            '<th colspan="5" style="padding: 0.5em; text-align: left; font-weight: normal"><span id="gs-betriebsstellen-auswahl-anzeige"></span></th>' +
            '</tr>' +
            '<tr>' +
            '<th style="text-align: right;">Frachtbeziehungen:</th>' +
            '<th colspan="5">' +
            '<table style="border-spacing:1px;border-collapse:separate;">' +
            '<thead>' +
            '<tr>' +
            '<th style="width: 350px;">Heimatbetriebsstelle</th>' +
            '<th style="width: 350px;">Ladegut zum Empfang</th>' +
            '<th style="width: 350px;">Empf&auml;nger</th>' +
            '<th style="width: 350px;">Ladestelle</th>' +
            '</tr>' +
            '<tr>' +
            '<th><select id="gs-empfangs-betriebsstelle" style="width: 350px;"></select></th>' +
            '<th><select id="gs-empfangs-ladegut" style="width: 350px;display: none;"></select></th>' +
            '<th><select id="gs-empfangs-verlader" style="width: 350px;display: none;"></select></th>' +
            '<th><select id="gs-empfangs-ladestelle" style="width: 350px;display: none;"></select></th>' +
            '</tr>' +
            '</thead>' +
            '</table>' +
            '</th>' +
            '<th colspan="3"><button id="gs-aktuelle-ansicht-drucken">Aktuelle Ansicht drucken</button><br><button id="gs-frachtkartenspeicher-ansicht">Frachtkartenspeicher ansehen (0)</button></th>' +
            '</tr>' +
            '<tr>' +
            '<th style="min-width: 154px;">Kategorie</th>' +
            '<th style="min-width: 154px;">Produkte</th>' +
            '<th style="min-width: 213px;">Versender</th>' +
            '<th style="min-width: 112px;max-width: 112px;">Wagengattung UIC</th>' +
            '<th style="min-width: 135px;">Betriebsstelle</th>' +
            '<th style="min-width: 213px;">Ladestelle</th>' +
            '<th style="min-width: 64px;max-width: 64px;">St&uuml;ckgut</th>' +
            '<th style="min-width: 64px;max-width: 64px;">Eilgut</th>' +
            '<th style="min-width: 131px;">Besonderheiten</th>' +
            '</tr>' +
            '<tr>' +
            '<th><input type="text" name="kategorie" class="gs-text-filter" size="10" disabled="disabled"><button type="reset" class="entfernen-symbol"></button></th>' +
            '<th><input type="text" name="produkt" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></th>' +
            '<th><input type="text" name="versender" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></th>' +
            '<th><input type="text" name="wagentyp" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></th>' +
            '<th><input type="text" name="betriebsstelle" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></th>' +
            '<th><input type="text" name="ladestelle" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></th>' +
            '<th><input type="checkbox" name="stueckgut" class="gs-ankreuz-filter"></th>' +
            '<th><input type="checkbox" name="expressgut" class="gs-ankreuz-filter"></th>' +
            '<th><input type="text" class="gs-text-filter" size="10" disabled="disabled"><button type="reset" class="entfernen-symbol"></button></th>' +
            '</tr>' +
            '</thead>' +
            '<tbody id="table-rows">' +
            '</tbody>' +
            '</table>';
        const stilDefinitionen = document.createElement("style");
        stilDefinitionen.innerHTML =
            '.entfernen-symbol {' +
            'position: absolute;' +
            'border:1px solid transparent;' +
            'background-color: transparent;' +
            'display: inline-block;' +
            'outline: 0;' +
            'cursor: pointer;' +
            '}' +
            '.entfernen-symbol::after {' +
            'content: "X";' +
            'display: inline-block;' +
            'background-color: #FA9595;' +
            'width: 14px;' +
            'height: 14px;' +
            'border-radius: 50%;' +
            'position: absolute;' +
            'z-index:1;' +
            'text-align: center;' +
            'color: white;' +
            'font-weight: normal;' +
            'font-size: 12px;' +
            'box-shadow: 0 0 2px #E50F0F;' +
            'cursor: pointer;' +
            'margin: auto;' +
            'padding: 0;' +
            '}' +
            'button.entfernen-symbol::after {' +
            'right: 12px;' +
            'top: 9px;' +
            'bottom: 0;' +
            '}' +
            'a.entfernen-symbol::after {' +
            'position:relative;' +
            'top: -3px;' +
            'text-decoration: none;' +
            'padding-top: 2px;' +
            '}' +
            'tbody tr:nth-child(even) {' +
            '  background-color: #e0d5d5;' +
            '}';
        document.getElementsByTagName("head")[0].appendChild(stilDefinitionen);
        const htmlElement = document.createElement('template');
        htmlElement.innerHTML = html.trim();
        Array.from(htmlElement.content.childNodes).forEach(kindElement => referenzKnoten.parentNode.insertBefore(kindElement, referenzKnoten));
        Array.from(document.getElementsByClassName("gs-text-filter")).forEach((eingabeFeld) => {
            eingabeFeld.style.backgroundImage = "url(\"" + sucheFilterBild + "\")";
            eingabeFeld.style.backgroundRepeat = "no-repeat";
            eingabeFeld.style.padding = "0px 0px 0px 20px";
            const eingabeEntfernenElement = eingabeFeld.parentElement.lastElementChild;
            eingabeEntfernenElement.style.display = "none";
            eingabeEntfernenElement.onclick = () => {
                eingabeEntfernenElement.style.display = "none";
                this.#aktuelleFilterWerte[eingabeFeld.name] = '';
                this.#wendeGesamtFilterAufTabellenZeilenAn();
                eingabeFeld.value = '';
            };
            eingabeFeld.onkeyup = function (ev) {
                eingabeEntfernenElement.style.display = (ev.target.value) ? "inline" : "none";
            };
        })
    }

    ausfuehren(versandJson, empfangJson) {
        if (!versandJson) return;

        let epochenListen = {};
        // Vorsortierung: Alle JSON Objekte einer Epoche kommen in eine Liste (Zuordnung Epoche => [JSON-Objekte,...])
        for (const eintrag of Object.values(versandJson)) {
            const epoche = eintrag['epoche'];
            if (epochenListen[epoche] === undefined) {
                epochenListen[epoche] = [];
            }
            epochenListen[epoche].push(eintrag);
        }

        const empfangsBetriebsstellenWahl = document.getElementById('gs-empfangs-betriebsstelle');
        const ladegutWahlElement = document.getElementById('gs-empfangs-ladegut');
        let empfang = {};
        if (empfangJson) {
            for (const eintrag of Object.values(empfangJson)) {
                const schluessel = eintrag['betriebsstelle'] + " (" + eintrag['kuerzel'] + ", "  + eintrag['epoche'] + ")";
                if (empfang[schluessel] === undefined) {
                    empfang[schluessel] = []
                }
                empfang[schluessel].push(eintrag);
            }

            empfangsBetriebsstellenWahl.appendChild(this.#optionenElement('#', 'Derzeit keine ausgewählt'));
            Object.keys(empfang).forEach((eintrag) => {
                empfangsBetriebsstellenWahl.appendChild(this.#optionenElement(eintrag, eintrag));
            });
            empfangsBetriebsstellenWahl.addEventListener('change', (event) => {
                event.preventDefault();
                this.#clearElement(ladegutWahlElement);
                const verladerElement = document.getElementById('gs-empfangs-verlader');
                this.#clearElement(verladerElement);
                verladerElement.style.display = 'none';
                const ladestellenElement = document.getElementById('gs-empfangs-ladestelle');
                this.#clearElement(ladestellenElement);
                ladestellenElement.style.display = 'none';
                const betriebsstellenSchluessel = event.target.value;
                if (betriebsstellenSchluessel !== '#') {
                    ladegutWahlElement.appendChild(this.#optionenElement('#', 'Derzeit keines ausgewählt'));
                    empfang[betriebsstellenSchluessel].forEach((eintrag) => {
                        ladegutWahlElement.appendChild(this.#optionenElement(eintrag['produkt'], eintrag['produkt']));
                        ladegutWahlElement.addEventListener('change', (event2) => {
                            event2.preventDefault();
                            const ladegutWahl = event2.target.value;
                            if (ladegutWahl !== '#') {
                                if (eintrag['produkt'] === ladegutWahl) {
                                    this.#clearElement(verladerElement);
                                    this.#clearElement(ladestellenElement);
                                    if (this.#aktuelleFilterWerte['empfang'].length > 0) {
                                        this.#aktuelleFilterWerte['empfang'] = [];
                                    }

                                    verladerElement.appendChild(this.#optionenElement(eintrag['empfaenger'], eintrag['empfaenger']));
                                    verladerElement.style.display = 'inherit';

                                    ladestellenElement.appendChild(this.#optionenElement(eintrag['ladestelle'], eintrag['ladestelle']));
                                    ladestellenElement.style.display = 'inherit';

                                    // Ladegüteraufzählung an Leerzeichen, Komma, Schrägstrich oder kaufmännischem und trennen
                                    ladegutWahl.split(/[\s,/&]/)
                                        // leere Werte aus dem Array entfernen
                                        .filter(v => v.trim().length > 0)
                                        // Klammern am Anfang und Ende aller Arrayelemente entfernen
                                        .map(v => v.trim().replaceAll(/[()]/g, "").trim())
                                        // typische Füllwörter aus dem Array entfernen
                                        .filter(v => !GelbeSeiten.#fuellWoerter.includes(v.trim().toLowerCase()))
                                        // noch vorhandene Arrayelemente zum Filter hinzufügen
                                        .forEach(ladegut => this.#aktuelleFilterWerte['empfang'].push(ladegut.trim()));
                                    this.#wendeGesamtFilterAufTabellenZeilenAn();
                                }
                            } else {
                                this.#aktuelleFilterWerte['empfang'] = [];
                                verladerElement.style.display = 'none';
                                ladestellenElement.style.display = 'none';
                                this.#wendeGesamtFilterAufTabellenZeilenAn();
                            }
                        });
                    });
                    ladegutWahlElement.style.display = 'inherit';
                } else {
                    ladegutWahlElement.style.display = 'none';
                }
                this.#aktuelleFilterWerte['empfang'] = [];
                this.#wendeGesamtFilterAufTabellenZeilenAn();
            });
        }

        this.#epocheAuswahlElement = document.getElementById('gs-epochen-auswahl');

        // all keys in JSON object are the epochs
        // => for each epoch add an option to a select element
        Object.keys(epochenListen).sort().forEach((epochenName) => {
            const optionenElement = document.createElement("option");
            optionenElement.value = epochenName;
            optionenElement.text = epochenName;
            optionenElement.selected = epochenName === this.#standardEpoche;
            this.#epocheAuswahlElement.appendChild(optionenElement);
        });

        this.#epocheAuswahlElement.addEventListener('change', (event) => {
           event.preventDefault();
            const tabellenKoerper = document.getElementById('table-rows');
            // zunächst alle vorhandenen Tabellenzeilen entfernen, sofern vorhanden
            if (tabellenKoerper.hasChildNodes()) {
                tabellenKoerper.textContent = '';
            }
            const vorhandeneBetriebsstellen = {};
            for (const eintrag of Object.values(epochenListen[this.#epocheAuswahlElement.value])) {
                const zeilenElement = document.createElement("tr");
                for (const spaltenName of ['kategorie', 'produkt', 'versender', 'wagengattung', 'betriebsstelle', 'ladestelle', 'stueckgut', 'eilgut', 'besonderheiten']) {
                    const spaltenElement = document.createElement("td");
                    if (spaltenName === 'stueckgut' || spaltenName === 'eilgut') {
                        spaltenElement.style.textAlign = "center";
                    }
                    spaltenElement.innerHTML = eintrag[spaltenName];
                    zeilenElement.appendChild(spaltenElement);
                }
                zeilenElement.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (empfangsBetriebsstellenWahl.value !== '#' && ladegutWahlElement.value !== '#') {
                        this.#frachtkartenSpeicher.push(this.#frachtkartenSpeicher.erzeugeFrachtkarte(
                            structuredClone(eintrag), structuredClone(empfang[empfangsBetriebsstellenWahl.value].find((empfangEintrag) => empfangEintrag['produkt'] === ladegutWahlElement.value))));
                    }
                });
                tabellenKoerper.appendChild(zeilenElement);
                vorhandeneBetriebsstellen[eintrag['kuerzel']] = eintrag['betriebsstelle'];
            }
            const betriebsstellenListe = document.getElementById('betriebsstellen-liste');
            this.#clearElement(betriebsstellenListe);
            for (const [kuerzel, name] of Object.entries(vorhandeneBetriebsstellen)) {
                const listenElement = document.createElement("option");
                listenElement.value = `${name}`;
                listenElement.text = `${name} (${kuerzel})`;
                betriebsstellenListe.appendChild(listenElement);
            }
            this.#alleTabellenZeilenAktuelleEpoche = Array.from(document.querySelectorAll("#table-rows tr"));
            // Anwendung aller vorhandenen Text-Filter auf die neue Liste → kann zu leerer Liste führen!
            // Prüfung, ob mindestens einer der Filter gesetzt ist
            const keinFilterGesetzt = Object.values(this.#aktuelleFilterWerte).every((filterWert) => {
                if (Array.isArray(filterWert) && filterWert.length > 0) return false; else return filterWert === '';
            });
            if (!keinFilterGesetzt) {
                this.#wendeGesamtFilterAufTabellenZeilenAn();
            }
        });
        this.#epocheAuswahlElement.dispatchEvent(new Event('change'));

        // TODO content hier geeignet zwischenspeichern, dass er nochmals gefiltert werden kann Stichwort Verwaltungen
        const spaltenTextFilter = (filterWert, tabellenZeile, spaltenNummer) => !filterWert || tabellenZeile.querySelector(`td:nth-child(${spaltenNummer})`).textContent.toLowerCase().includes(filterWert.trim().toLowerCase());
        // Der Betriebsstellen Filter ist anders, da hier mehr als ein Wert möglich ist
        const betriebsstellenFilter = (filterWerte, tabellenZeile) => {
            let eintragGefunden = false;
            if (filterWerte.length > 0) {
                tabellenZeile.querySelectorAll("td:nth-child(5)").forEach(spaltenEintrag => {
                    eintragGefunden = filterWerte.find(filterWert => spaltenEintrag.textContent.toLowerCase().includes(filterWert.toLowerCase()));
                });
            } else {
                eintragGefunden = true;
            }
            return !filterWerte || eintragGefunden;
        }

        const empfangsFilter = (filterWerte, tabellenZeile) => {
            let eintragGefunden = false;
            if (filterWerte.length > 0) {
                tabellenZeile.querySelectorAll("td:nth-child(2)").forEach(spaltenEintrag => {
                    eintragGefunden = filterWerte.find(filterWert => spaltenEintrag.textContent.toLowerCase().includes(filterWert.toLowerCase()));
                });
            } else {
                eintragGefunden = true;
            }
            return !filterWerte || eintragGefunden;
        }

        this.#gesamtFilter = ({kategorie, produkt, versender, wagentyp, betriebsstelle, ladestelle, betriebsstellen, stueckgut, expressgut, empfang}, tabellenZeile) => {
            return spaltenTextFilter(kategorie, tabellenZeile, 1)
                && spaltenTextFilter(produkt, tabellenZeile, 2)
                && spaltenTextFilter(versender, tabellenZeile, 3)
                && spaltenTextFilter(wagentyp, tabellenZeile, 4)
                && spaltenTextFilter(betriebsstelle, tabellenZeile, 5)
                && spaltenTextFilter(ladestelle, tabellenZeile, 6)
                && spaltenTextFilter(stueckgut, tabellenZeile, 7)
                && spaltenTextFilter(expressgut, tabellenZeile, 8)
                && betriebsstellenFilter(betriebsstellen, tabellenZeile)
                && empfangsFilter(empfang, tabellenZeile);
        }

        window.addEventListener('input', event => {
            if (event.target.matches('.gs-text-filter') || event.target.matches('.gs-ankreuz-filter')) {
                // Nur Leerzeichen werden direkt herausgefiltert
                if (event.target.value.length === 1 && event.target.value.trim().length === 0) {
                    event.target.value = event.target.value.trim();
                }
                if (event.target.type.toLowerCase() === 'checkbox') { // special handling of checkboxes
                    this.#aktuelleFilterWerte[event.target.name] = event.target.checked ? 'X' : '';
                } else {
                    this.#aktuelleFilterWerte[event.target.name] = event.target.value;
                }
                this.#wendeGesamtFilterAufTabellenZeilenAn();
            }
        });

        document.getElementById('gs-zum-bertriebsstellen-filter-hinzufuegen').addEventListener('click', (event) => {
            event.preventDefault();
            const eingabeElement = document.getElementById('gs-betriebsstellen-auswahl-filter');
            const eingabeWert = eingabeElement.value.trim();
            // Wert zuweisen => zum Array hinzufügen
            // Leer- und doppelte Einträge führen zu keiner Aktion!
            if (eingabeWert && !this.#aktuelleFilterWerte["betriebsstellen"].includes(eingabeWert)) {
                this.#aktuelleFilterWerte["betriebsstellen"].push(eingabeWert);
                this.#erneuereAnzeigeBetriebsstellenAuswahl();
                this.#wendeGesamtFilterAufTabellenZeilenAn();
            }
            // Eingabefeld leeren
            eingabeElement.value = '';
            eingabeElement.focus();
        });

        document.getElementById('gs-betriebsstellen-auswahl-anzeige').textContent = "Derzeit keine ausgewählt";

        document.getElementById('gs-filter-entfernen').addEventListener('click', (event) => {
            event.preventDefault();
            Object.keys(this.#aktuelleFilterWerte).forEach(filterName => {
                if (Array.isArray(this.#aktuelleFilterWerte[filterName])) {
                    this.#aktuelleFilterWerte[filterName] = [];
                } else {
                    this.#aktuelleFilterWerte[filterName] = '';
                }
            });
            document.querySelectorAll('button.entfernen-symbol').forEach(element => element.click());
            document.querySelectorAll('input.gs-ankreuz-filter').forEach(element => element.checked = false);
            empfangsBetriebsstellenWahl.dispatchEvent(new Event('change', { bubbles: true }));
            this.#erneuereAnzeigeBetriebsstellenAuswahl();
            this.#wendeGesamtFilterAufTabellenZeilenAn();
        });

        document.getElementById('gs-aktuelle-ansicht-drucken').addEventListener('click', (event) => {
            event.preventDefault();
            window.print();
        });

        document.getElementById('gs-frachtkartenspeicher-ansicht').addEventListener('click', (event) => {
            event.preventDefault();
            this.#frachtkartenSpeicher.anzeigen();
        });
        this.#frachtkartenSpeicher.setzeAnzahlUeberwacher((aktuelleAnzahl) => {
            const knopf = document.getElementById('gs-frachtkartenspeicher-ansicht');
            knopf.innerHTML = knopf.innerHTML.replace(/\((.+?)\)/g, `(${aktuelleAnzahl})`);
        });

    }
}

// provides new scope avoiding error of redeclaration
(async function () {
    const scriptElement = document.getElementById('gelbe-seiten-anwendung');
    const fileUrl = scriptElement.dataset.versandUrl?.trim();
    const empfangsUrl = scriptElement.dataset.empfangUrl?.trim();
    const anwendung = new GelbeSeiten();
    anwendung.erstelleBenutzerSchnittstelle(scriptElement);
    const contents = await Promise.all([fetch(fileUrl), fetch(empfangsUrl)]);
    const [versand, empfang] = await Promise.all(contents.map( async (r) => { if (r.ok) return await r.json(); else return null; }));
    anwendung.ausfuehren(versand, empfang);
})();
