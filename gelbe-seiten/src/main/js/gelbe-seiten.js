class GelbeSeiten {
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
        betriebsstellen: []
    };
    #alleTabellenZeilenAktuelleEpoche = undefined;
    #gesamtFilter = undefined;
    #epocheAuswahlElement = undefined;

    constructor() {
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
            '<th><form><input type="text" name="kategorie" class="gs-text-filter" size="10" disabled="disabled"><button type="reset" class="entfernen-symbol"></button></form></th>' +
            '<th><form><input type="text" name="produkt" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></form></th>' +
            '<th><form><input type="text" name="versender" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></form></th>' +
            '<th><form><input type="text" name="wagentyp" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></form></th>' +
            '<th><form><input type="text" name="betriebsstelle" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></form></th>' +
            '<th><form><input type="text" name="ladestelle" class="gs-text-filter" size="10"><button type="reset" class="entfernen-symbol"></button></form></th>' +
            '<th><form><input type="checkbox" name="stueckgut" class="gs-ankreuz-filter"></form></th>' +
            '<th><form><input type="checkbox" name="expressgut" class="gs-ankreuz-filter"></form></th>' +
            '<th><form><input type="text" class="gs-text-filter" size="10" disabled="disabled"><button type="reset" class="entfernen-symbol"></button></form></th>' +
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
            };
            eingabeFeld.onkeyup = function (ev) {
                eingabeEntfernenElement.style.display = (ev.target.value) ? "inline" : "none";
            };
        })
    }

    ausfuehren(json) {
        let epochenListen = {};
        // Vorsortierung: Alle JSON Objekte einer Epoche kommen in eine Liste (Zuordnung Epoche => [JSON-Objekte,...])
        for (const eintrag of Object.values(json)) {
            const epoche = eintrag['epoche'];
            if (epochenListen[epoche] === undefined) {
                epochenListen[epoche] = [];
            }
            epochenListen[epoche].push(eintrag);
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
                tabellenKoerper.appendChild(zeilenElement);
                vorhandeneBetriebsstellen[eintrag['kuerzel']] = eintrag['betriebsstelle'];
            }
            const betriebsstellenListe = document.getElementById('betriebsstellen-liste');
            if (betriebsstellenListe.hasChildNodes()) {
                betriebsstellenListe.innerHTML = '';
            }
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

        this.#gesamtFilter = ({kategorie, produkt, versender, wagentyp, betriebsstelle, ladestelle, betriebsstellen, stueckgut, expressgut}, tabellenZeile) => {
            return spaltenTextFilter(kategorie, tabellenZeile, 1)
                && spaltenTextFilter(produkt, tabellenZeile, 2)
                && spaltenTextFilter(versender, tabellenZeile, 3)
                && spaltenTextFilter(wagentyp, tabellenZeile, 4)
                && spaltenTextFilter(betriebsstelle, tabellenZeile, 5)
                && spaltenTextFilter(ladestelle, tabellenZeile, 6)
                && spaltenTextFilter(stueckgut, tabellenZeile, 7)
                && spaltenTextFilter(expressgut, tabellenZeile, 8)
                && betriebsstellenFilter(betriebsstellen, tabellenZeile);
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
            document.querySelectorAll('button.entfernen-symbol').forEach(element => {
                // Klick Event für den Button reicht nicht aus, da es die Eingabefelder nicht zurücksetzt ...
                element.dispatchEvent(new Event('click', { bubbles: true }));
                // ... daher beim Eltern-Element auch noch ein Reset Ereignis auslösen
                element.parentElement.dispatchEvent(new Event('reset', { bubbles: true }));
            });
            document.querySelectorAll('input.gs-ankreuz-filter').forEach(element => {
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.parentElement.dispatchEvent(new Event('reset', { bubbles: true }));
            });
            this.#erneuereAnzeigeBetriebsstellenAuswahl();
            this.#wendeGesamtFilterAufTabellenZeilenAn();
        });
    }
}

// provides new scope avoiding error of redeclaration
(function () {
    const scriptElement = document.getElementById('gelbe-seiten-anwendung');
    const fileUrl = scriptElement.dataset.fileUrl.trim();
    const anwendung = new GelbeSeiten();
    anwendung.erstelleBenutzerSchnittstelle(scriptElement);
    fetch(fileUrl)
        .then((response) => {
            if (response.ok) {
                return response.json()
            }
            throw new Error(`Datei nicht gefunden: ${response.url}`);
        })
        .then(content => anwendung.ausfuehren(content), e => console.error(e));
})();
