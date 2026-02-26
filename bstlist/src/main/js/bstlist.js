class BetriebsstellenListe {
    #defaultEpoch = 'IV';
    #languages = {0: 'DE', 1: 'EN', 2: 'CS'};
    #sortingColumnOptions = [{
        description: 'Betriebsstellenname (aufsteigend)',
        style: ['none', 'inline', 'inline', 'none', 'inline', 'none'],
        compareFunction: function(a, b) { return a['name'].localeCompare(b['name']); }
    }, {
        description: 'Kürzel (aufsteigend)',
        style: ['inline', 'none', 'none', 'inline', 'inline', 'none'],
        compareFunction: function(a, b) { return a['kuerzel'].localeCompare(b['kuerzel']); }
    }, {
        description: 'Letzte Änderung (absteigend)',
        style: ['inline', 'none', 'inline', 'none', 'none', 'inline'],
        compareFunction: function (a, b) { return b['zeit'] >= a['zeit']; }
    }];
    #dateOptions = {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: undefined
    }
    #baseUrl = '';
    #zipFileName = undefined;
    #yellowPages = undefined;
    #allInEpochs = {};
    #epochSelectElement = undefined;
    #columnSelectElement = undefined;
    #nameFilterElement = undefined;

    constructor(baseUrl, zipFileName = null, yellowPages = null) {
        this.#baseUrl = baseUrl;
        this.#zipFileName = zipFileName;
        this.#yellowPages = yellowPages;
    }

    #ce(elementName) {
        return document.createElement(elementName);
    }

    #createHyperRefElement(href, title, className, text) {
        const _e = this.#ce('a');
        _e.setAttribute('href', this.#baseUrl + href);
        _e.setAttribute('title', title);
        _e.setAttribute('class', className);
        _e.setAttribute('target', '_blank');
        _e.textContent = text;
        return _e;
    }

    #createOptionElement(valueText, valueAttr = null, selected = false) {
        const _e = this.#ce('option');
        if (valueAttr !== null) _e.setAttribute('value', (valueAttr.includes('.html')) ? this.#baseUrl + valueAttr : valueAttr);
        if (selected) _e.setAttribute('selected', 'selected')
        _e.textContent = valueText;
        return _e;
    }

    #buildLanguageSelection(kuerzel, viewid) {
        const _e = this.#ce('select');
        _e.setAttribute('size', '1');
        _e.setAttribute('class', 'datenblatt-sprachauswahl');
        _e.appendChild(this.#createOptionElement(kuerzel, '#'));
        // use sorted
        // noinspection JSUnusedLocalSymbols
        for (const [key, value] of Object.entries(this.#languages).sort((a, b) => a[1].localeCompare(b[1]))) {
            _e.appendChild(this.#createOptionElement(
                kuerzel + " (" + value + ")", viewid + (value.toLowerCase() !== 'de' ? '_' + value.toLowerCase() : '') + '.html'));
        }
        return _e;
    }

    #createCellElement(content, centered = true) {
        const _e = this.#ce('td');
        if (centered) {
            _e.setAttribute('style', 'text-align:center;');
        }
        if (content instanceof HTMLElement) {
            _e.appendChild(content);
        } else {
            _e.textContent = content;
        }
        return _e;
    }

    #createBuildTableRow(identifier, styles, cells = []) {
        const _e = this.#ce('tr');
        _e.setAttribute('id', identifier);
        _e.setAttribute('style', styles);
        for (const cell of cells) {
            _e.appendChild(cell);
        }
        return _e;
    }

    #buildUpdateTableRows(tableRowContent) {
        // check if tbody has children elements aka content
        const tbody = document.getElementById('table-rows');
        if (tbody.hasChildNodes()) {
            tbody.textContent = '';
        }
        // let selectedEpoch = epochSelectElement.value;
        // selectedEpoch = (selectedEpoch !== defaultEpoch ? '-' + selectedEpoch : '');

        tableRowContent.forEach((value, index) => {
            const _date = new Date();
            _date.setTime(value['zeit']);
            tbody.appendChild(this.#createBuildTableRow(
                value['kuerzel'].toLowerCase(),
                (index + 1) % 2 === 0 ? 'background-color:#dadada;' : 'background-color:#e0d5d5;',
                [
                    this.#createCellElement(((index + 1) <= 9 ? '0' + (index + 1) : (index + 1)) + '.'),
                    this.#createCellElement(
                        this.#createHyperRefElement(
                            value['viewid'] + '.html',
                            value['name'],
                            'datasheet-view-select',
                            value['name']
                        ), false),
                    this.#createCellElement(this.#buildLanguageSelection(value['kuerzel'], value['viewid'])),
                    this.#createCellElement(value['typ']),
                    this.#createCellElement(_date.toLocaleString('de-DE', this.#dateOptions), false),
                    this.#createCellElement(
                        this.#createHyperRefElement(
                            value['viewid'] + '_fpl.html',
                            value['kuerzel'],
                            'datasheet-view-fpl',
                            value['kuerzel']
                        )
                    ),
                ]
            ));
        });
        // add event handlers for the different views
        Array.from(document.getElementsByClassName("datenblatt-sprachauswahl")).forEach(item => {
            item.addEventListener("change", event => {
                event.preventDefault();
                const tref = event.target.value;
                if (tref.length > 0 && tref !== '#') {
                    window.open(tref, '_blank');
                }
            });
        });
    }

    #changeEventHandler(event) {
        if (event === null) {
            // reset all filters to default values
            this.#epochSelectElement.selectedIndex = 3;
            this.#columnSelectElement.selectedIndex = 0;
            this.#nameFilterElement.value = "";
            //console.clear();
        } else {
            event.preventDefault();
        }
        const epochSelection = this.#epochSelectElement.value;
        const sortingSelection = this.#sortingColumnOptions[this.#columnSelectElement.value];
        this.#allInEpochs[epochSelection].sort(sortingSelection.compareFunction);
        Array.from(document.getElementsByClassName('bstlist-sortierbare-spalten')).forEach((item, index) => {
            // marks the table column head where to sort of
            item.style['display'] = sortingSelection.style[index];
        })
        if (this.#nameFilterElement.value.trim().length > 0) {
            this.#buildUpdateTableRows(this.#allInEpochs[epochSelection].filter(value => {
                return this.#nameFilterElement.value.trim().split(/[, ]+/).some(spl => {
                    return value['name'].toLowerCase().includes(spl.trim().toLowerCase()) ||
                        value['kuerzel'].toLowerCase().includes(spl.trim().toLowerCase());
                })
            }));
        } else {
            this.#buildUpdateTableRows(this.#allInEpochs[epochSelection]);
        }
    }

    async #toggleVisibilitySetLastChangeFor(paragraphId, timeStampId) {
        const url = document.querySelector(`#${paragraphId} > a`).getAttribute('href');
        return await fetch(url, {method: 'HEAD'}).then((response) => {
            if (response.ok) {
                let _date = new Date(Date.parse(response.headers.get("Last-Modified")));
                document.getElementById(timeStampId).textContent = _date.toLocaleString('de-DE', this.#dateOptions);
                document.getElementById(paragraphId).setAttribute('style', 'display:block;');
            }
        });
    }

    async #setZipLastEdited() {
        return await this.#toggleVisibilitySetLastChangeFor('archiv-datei', 'archiv-datei-zeitstempel');
    }

    async #setYellowPagesLastEdited() {
        return await this.#toggleVisibilitySetLastChangeFor('gelbe-seiten', 'gelbe-seiten-zeitstempel');
    }

    init(refNode) {
        let ui =
            '<table>' +
            '<tr>' +
            '<td style="text-align:right;padding:0;"><label for="bstlist-spaltenauswahl">Ordnen nach:</label></td>' +
            '<td style="padding: 0.5em;"><select name="bstlist-spaltenauswahl" id="bstlist-spaltenauswahl"></select></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="text-align:right;padding:0;"><label for="bstlist-epochenauswahl">Epoche:</label></td>' +
            '<td style="padding: 0.5em;"><select name="bstlist-epochenauswahl" id="bstlist-epochenauswahl"></select></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="text-align:right;padding:0;"><label for="bstlist-betriebsstellenauswahl">Filter f&uuml;r Betriebsstellen:</label></td>' +
            '<td style="padding: 0.5em;"><input type="text" name="bstlist-betriebsstellenauswahl" id="bstlist-betriebsstellenauswahl"></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td style="text-align:right;"><input type="button" value="Filter löschen" id="bstlist-filter-entfernen"></td>' +
            '</tr>' +
            '</table>' +
            '<table style="border-spacing:1px;border-collapse:separate;">' +
            '<thead>' +
            '<tr style="background-color:#C0C0C0;">' +
            '<th>Lfd. Nr.</th>' +
            '<th><span class="bstlist-sortierbare-spalten" style="display:none">Betriebsstellenname</span><span style="color:red;display:inline" class="bstlist-sortierbare-spalten">Betriebsstellenname&nbsp;&#8593;</span></th>' +
            '<th><span class="bstlist-sortierbare-spalten" style="display:inline">K&uuml;rzel</span><span style="color:red;display:none" class="bstlist-sortierbare-spalten">K&uuml;rzel&nbsp;&#8593;</span></th>' +
            '<th>Kategorie</th>' +
            '<th><span class="bstlist-sortierbare-spalten" style="display:inline">Letzte &Auml;nderung</span><span style="color:red;display:none" class="bstlist-sortierbare-spalten">Letzte &Auml;nderung&nbsp;&#8595;</span></th>' +
            '<th>Spezial Ansicht</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody id="table-rows">' +
            '</tbody>' +
            '</table>';
        if (this.#yellowPages) {
            ui += '<p id="gelbe-seiten" style="display: none;"><a href="';
            ui += this.#yellowPages
            ui += '" title="Gelbe Seiten">Gelbe Seiten</a>&nbsp;(<span id="gelbe-seiten-zeitstempel"></span>)</p>';

        }
        if (this.#zipFileName) {
            ui += '<p id="archiv-datei" style="display: none;"><a href="';
            ui += this.#zipFileName;
            ui += '" title="Archiv mit allen Datenblättern und Gelben Seiten">Archiv mit allen Datenbl&auml;ttern und Gelben Seiten</a>&nbsp;(<span id="archiv-datei-zeitstempel"></span>)</p>';
        }
        const uiElement = document.createElement('template');
        uiElement.innerHTML = ui.trim();
        Array.from(uiElement.content.childNodes).forEach(c => refNode.parentNode.insertBefore(c, refNode));
    }

    run(result) {

        this.#epochSelectElement = document.getElementById('bstlist-epochenauswahl');
        this.#columnSelectElement = document.getElementById('bstlist-spaltenauswahl');
        this.#nameFilterElement = document.getElementById('bstlist-betriebsstellenauswahl');

        // convert result json to an object containing arrays for each epoch
        for (const [key, val] of Object.entries(result)) {
            let ep = (key.indexOf('-') === -1) ? this.#defaultEpoch : key.substring(key.indexOf('-') + 1);
            if (ep !== null) {
                // dynamically add epochs
                if (this.#allInEpochs[ep] === undefined) {
                    this.#allInEpochs[ep] = [];
                }
                this.#allInEpochs[ep].push(val);
            }
        }
        // all keys in json object are the epochs
        // => for each epoch add an option to a select element
        Object.keys(this.#allInEpochs).sort().forEach((value) => {
            this.#epochSelectElement.appendChild(this.#createOptionElement(value, value, value === this.#defaultEpoch));
            // default sort: all elements by name
            this.#allInEpochs[value].sort(this.#sortingColumnOptions[0].compareFunction);
        });
        this.#sortingColumnOptions.forEach((key, value) => {
            this.#columnSelectElement.appendChild(this.#createOptionElement(key.description, value.toString()));
        });
        this.#columnSelectElement.addEventListener('change', this.#changeEventHandler.bind(this));
        this.#epochSelectElement.addEventListener('change', this.#changeEventHandler.bind(this));
        this.#nameFilterElement.addEventListener('input', this.#changeEventHandler.bind(this));
        document.getElementById('bstlist-filter-entfernen').addEventListener('click', ev => {
            ev.preventDefault();
            this.#changeEventHandler(null);
        });
        this.#changeEventHandler(null);
        void this.#setZipLastEdited();
        void this.#setYellowPagesLastEdited();
    }
}
(function () {
    const el = document.getElementById('bstlist-anwendung');
    const jsonOrUrl = el.dataset.jsonOrUrl.trim();
    const handler = new BetriebsstellenListe(
        jsonOrUrl.toString().substring(0, jsonOrUrl.toString().lastIndexOf('/') + 1),
        el.dataset.zipFile.trim(), el.dataset.yellowPages.trim());
    handler.init(el);
    fetch(jsonOrUrl)
        .then((response) => {
            if (response.ok) {
                return response.json()
            }
            throw new Error(`Datei nicht gefunden: ${response.url}`);
        }).then((content) => handler.run(content), e => console.error(e));
})();
