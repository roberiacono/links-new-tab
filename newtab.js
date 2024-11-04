
const columnsContainer = document.getElementById('columns-container');
const addColumnButton = document.getElementById('addColumnButton');

// Carica le colonne salvate al caricamento della pagina
document.addEventListener('DOMContentLoaded', loadColumns);

// Aggiunge una nuova colonna quando si clicca sul pulsante "Aggiungi Colonna"
addColumnButton.addEventListener('click', () => {
    addColumn();
    saveColumns();
});

function addColumn(title = 'Nuova Colonna', links = []) {
    const column = document.createElement('div');
    column.className = 'column';

    const titleInput = document.createElement('input');
    titleInput.value = title;
    titleInput.className = 'column-title';
    titleInput.oninput = saveColumns;
    column.appendChild(titleInput);

    const addLinkButton = document.createElement('button');
    addLinkButton.textContent = 'Aggiungi Link';
    addLinkButton.onclick = () => addLink(column);
    column.appendChild(addLinkButton);

    links.forEach(linkData => addLink(column, linkData));

    columnsContainer.appendChild(column);
}

function addLink(column, linkData = { emoji: '🔗', text: 'Nuovo Link', url: '#' }) {
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';

    const emojiInput = document.createElement('input');
    emojiInput.value = linkData.emoji;
    emojiInput.size = 1;
    emojiInput.oninput = saveColumns;
    linkItem.appendChild(emojiInput);

    const linkText = document.createElement('a');
    linkText.href = linkData.url;
    linkText.target = '_blank';
    linkText.textContent = linkData.text;
    linkText.contentEditable = true;
    linkText.onblur = saveColumns;
    linkItem.appendChild(linkText);

    column.appendChild(linkItem);
}

function saveColumns() {
    const columnsData = Array.from(columnsContainer.getElementsByClassName('column')).map(column => {
        return {
            title: column.querySelector('.column-title').value,
            links: Array.from(column.getElementsByClassName('link-item')).map(item => {
                const emoji = item.querySelector('input').value;
                const linkText = item.querySelector('a').textContent;
                const url = item.querySelector('a').href;
                return { emoji, text: linkText, url };
            })
        };
    });

    chrome.storage.sync.set({ columns: columnsData });
}

function loadColumns() {
    chrome.storage.sync.get('columns', data => {
        if (data.columns) {
            data.columns.forEach(columnData => {
                addColumn(columnData.title, columnData.links);
            });
        }
    });
}
