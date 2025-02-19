const showDebug = false;

const columnsContainer = document.getElementById("columns-container");

const addColumnButton = document.getElementById("addColumnButton");

const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
</svg>
`;
// Icona di eliminazione (SVG)
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
 <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
`;

const plusIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>`;

let columnsData = []; // Will be populated in loadColumns()

const stateHistory = []; // Stack per salvare gli stati
const MAX_HISTORY = 10; // Limite massimo di stati salvati
const undoButton = document.getElementById("undoButton");

let defaultData;

// Aggiornare l'ordine delle colonne
const sortableColumns = new Sortable(columnsContainer, {
  animation: 150,
  onEnd: (event) => {
    saveState();
    // Ottieni l'indice della colonna spostata
    const movedColumnIndex = event.oldIndex;
    const newColumnIndex = event.newIndex;

    // Aggiorna columnsData
    const movedColumn = columnsData.splice(movedColumnIndex, 1)[0]; // Rimuovi la colonna da movedColumnIndex
    columnsData.splice(newColumnIndex, 0, movedColumn); // Inserisci la colonna alla nuova posizione

    // Salva i dati aggiornati
    saveColumns();
  },
});

// Aggiungi drag-and-drop ai link di ogni colonna
function initializeLinkSorting() {
  // Inizializza il drag-and-drop per ogni links-wrapper
  document
    .querySelectorAll(".links-wrapper")
    .forEach((wrapper, columnIndex) => {
      Sortable.create(wrapper, {
        group: "shared-links", // Stesso gruppo per permettere spostamento tra colonne
        animation: 150,
        handle: ".link-item", // Permette di draggare direttamente il link
        draggable: ".link-item",
        onEnd: function (event) {
          saveState();
          const oldIndex = event.oldIndex;
          const newIndex = event.newIndex;
          const fromColumnIndex = Array.from(
            document.querySelectorAll(".links-wrapper")
          ).indexOf(event.from);
          const toColumnIndex = Array.from(
            document.querySelectorAll(".links-wrapper")
          ).indexOf(event.to);

          // Aggiorna l'ordine di columnsData in base al movimento
          const [movedLink] = columnsData[fromColumnIndex].links.splice(
            oldIndex,
            1
          );
          columnsData[toColumnIndex].links.splice(newIndex, 0, movedLink);
          saveColumns(); // Salva l'ordine aggiornato
        },
      });
    });
}

// Carica le colonne salvate al caricamento della pagina
document.addEventListener("DOMContentLoaded", function () {
  localizeText();
  loadColumns();
});

function localizeText() {
  document.getElementById("addBoxButtonText").textContent =
    chrome.i18n.getMessage("addBoxButtonText");
  /*   document.getElementById("undoButtonText").textContent =
    chrome.i18n.getMessage("undoButtonText"); */
  document.getElementById("noneRadioText").textContent =
    chrome.i18n.getMessage("noneRadioText");
  document.getElementById("saveButton").textContent =
    chrome.i18n.getMessage("saveButton");
  document.getElementById("closeButton").textContent =
    chrome.i18n.getMessage("closeButton");
  document.getElementById("labelTitle").textContent =
    chrome.i18n.getMessage("labelTitle");
  document.getElementById("labelIcon").textContent =
    chrome.i18n.getMessage("labelIcon");
}

// Aggiunge una nuova colonna quando si clicca sul pulsante "Aggiungi Colonna"
addColumnButton.addEventListener("click", () => {
  const columnIndex = columnsData.length; // Ottieni l'indice per la nuova colonna
  addColumn("", [], columnIndex, true);
  saveColumns();
});

function addColumn(
  title = "Nuova Colonna",
  links = [],
  columnIndex,
  isAddNewColumn = false
) {
  const column = document.createElement("div");
  column.className = "column";

  // Crea un contenitore per il titolo e l'icona di eliminazione
  const header = document.createElement("div");
  header.className = "column-header";

  const titleInput = document.createElement("input");
  titleInput.value = title;
  titleInput.className = "column-title";
  //   titleInput.oninput = saveColumns;

  // Aggiungi un evento onchange per salvare il titolo quando cambia
  titleInput.onchange = () => {
    saveState();
    columnsData[columnIndex].title = titleInput.value; // Aggiorna il titolo nella struttura dati
    saveColumns(); // Salva i dati aggiornati
  };

  titleInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Previene il comportamento predefinito di "Enter"
      saveColumns(); // Chiama la funzione per salvare le colonne
      titleInput.blur(); // Rimuove il focus dal campo, se desiderato
    }
  });

  header.appendChild(titleInput); // Aggiungi il titolo al contenitore

  // Focus sull'input del titolo subito dopo aver aggiunto la colonna
  if (isAddNewColumn) {
    setTimeout(() => titleInput.focus(), 0);
  }

  const deleteColumnIcon = document.createElement("div");
  deleteColumnIcon.innerHTML = deleteIconSVG;
  deleteColumnIcon.className = "delete-column-icon";

  // Funzionalità di eliminazione della colonna
  deleteColumnIcon.onclick = () => {
    saveState();
    columnsData.splice(columnIndex, 1); // Rimuovi la colonna dall'array
    column.remove(); // Rimuovi la colonna dall'interfaccia utente
    saveColumns(); // Salva le modifiche alle colonne
    // Aggiorna gli indici dei pulsanti "Aggiungi Link"
    updateAddLinkButtons();
  };

  header.appendChild(deleteColumnIcon); // Aggiungi l'icona di eliminazione al contenitore
  column.appendChild(header); // Aggiungi il contenitore alla colonna

  // Wrapper per i link
  const linksWrapper = document.createElement("div");
  linksWrapper.className = "links-wrapper";
  column.appendChild(linksWrapper);

  // Aggiungi i link esistenti al wrapper
  links.forEach((linkData) => addLink(linksWrapper, linkData, columnIndex));

  const addLinkButton = document.createElement("button");
  addLinkButton.className = "add-link";
  addLinkButton.innerHTML =
    plusIconSVG + chrome.i18n.getMessage("addLinkButtonText");
  addLinkButton.onclick = () => {
    openEditModal(
      { emoji: "😄", text: "", url: "" },
      columnIndex,
      null,
      linksWrapper
    );
  };
  column.appendChild(addLinkButton);

  columnsContainer.appendChild(column);

  columnsData[columnIndex] = {
    links: links,
    title: title,
  };

  initializeLinkSorting();
}

function addLink(linksWrapper, linkData, columnIndex) {
  const linkItem = document.createElement("div");
  linkItem.className = "link-item";

  let linkAnchor = null;

  linkAnchor = document.createElement("a");

  if (linkData.url) {
    // Create the link as an <a> element
    linkAnchor.href = linkData.url;
    linkAnchor.className = "link-anchor"; // New class for the anchor
  } else {
    linkAnchor.className = "link-anchor not-linked"; // New class for the anchor
  }

  // Emoji as a div
  const emojiDiv = document.createElement("div");

  if (linkData.icon) {
    if (linkData.icon === "favicon" && linkData.imageUrl) {
      emojiDiv.innerHTML = `<img src="${linkData.imageUrl}" alt="icon" style="width: 16px; height: 16px;">`;
    } else if (linkData.icon === "emoji") {
      emojiDiv.textContent = linkData.emoji;
    }
  } else {
    emojiDiv.textContent = "";
  }

  //emojiDiv.textContent = linkData.emoji;
  emojiDiv.className = "emoji";
  linkAnchor.appendChild(emojiDiv); // Add emoji to the anchor

  // Title as a div
  const titleDiv = document.createElement("div");
  titleDiv.textContent = linkData.text;
  titleDiv.className = "link-text"; // Class for link text
  linkAnchor.appendChild(titleDiv); // Add title to the anchor

  // Add the anchor to the link item
  linkItem.appendChild(linkAnchor);

  // Edit icon (SVG)
  const editIcon = document.createElement("div");
  editIcon.innerHTML = editIconSVG;
  editIcon.className = "edit-icon";
  editIcon.onclick = () => {
    const linkIndex = Array.from(
      linksWrapper.getElementsByClassName("link-item")
    ).indexOf(linkItem);
    openEditModal(linkData, columnIndex, linkIndex, linksWrapper);
  };
  linkItem.appendChild(editIcon);

  const deleteIcon = document.createElement("div");
  deleteIcon.innerHTML = deleteIconSVG;
  deleteIcon.className = "delete-icon";

  // Funzionalità di eliminazione
  deleteIcon.onclick = () => {
    saveState(); // Salva lo stato attuale
    const linkIndex = Array.from(
      linksWrapper.getElementsByClassName("link-item")
    ).indexOf(linkItem);
    columnsData[columnIndex].links.splice(linkIndex, 1); // Rimuovi il link dall'array
    linkItem.remove(); // Rimuovi il link dall'interfaccia utente
    saveColumns(); // Salva le modifiche alle colonne
  };

  linkItem.appendChild(deleteIcon); // Aggiungi l'icona di eliminazione

  linksWrapper.appendChild(linkItem);
}

// Function to open the edit modal
function openEditModal(linkData, columnIndex, linkIndex, linksWrapper) {
  const editModal = document.getElementById("editModal");
  const urlInput = document.getElementById("url");
  const titleInput = document.getElementById("title");
  const faviconOption = document.getElementById("faviconOption");
  const faviconPreview = document.getElementById("faviconPreview");
  const emojiOption = document.getElementById("emojiOption");
  const emptyOption = document.getElementById("emptyOption");
  const selectedEmoji = document.getElementById("selectedEmoji");
  const pickerContainer = document.getElementById("pickerContainer");
  const emojiModal = document.getElementById("emojiModal");

  //const linkData = columnsData[columnIndex].links[linkIndex];
  if (showDebug) {
    console.log("linkData in open modal", linkData, columnIndex, linkIndex);
  }

  const modalTitle = document.querySelector(".modal-title");
  modalTitle.textContent =
    linkIndex === null
      ? chrome.i18n.getMessage("addNewLinkModalTitleText")
      : chrome.i18n.getMessage("editLinkModalTitleText");

  selectedEmoji.textContent = linkData.emoji;

  // Inizializza il picker e nascondilo
  const picker = new EmojiMart.Picker({
    onEmojiSelect: (emoji) => {
      selectedEmoji.textContent = emoji.native; // Aggiorna l'emoji visualizzata
      linkData.emoji = emoji.native;
      emojiModal.classList.add("hidden"); // Nascondi il picker dopo la selezione
    },
  });
  pickerContainer.appendChild(picker);

  // Mostra il picker al click sul radio button o sull'emoji
  emojiOption.addEventListener("click", (event) => {
    emojiOption.checked = true; // Check emoji radio button when emoji is selected
    event.stopPropagation(); // Evita che il click sul radio trigger il listener sul document
  });

  selectedEmoji.addEventListener("click", (event) => {
    emojiOption.checked = true; // Check emoji radio button when emoji is selected
    emojiModal.classList.remove("hidden"); // Mostra o nascondi il picker
    event.stopPropagation(); // Evita che il click sul radio trigger il listener sul document
  });

  // Chiude il picker se si clicca fuori da esso
  document.addEventListener("mousedown", (event) => {
    if (
      !pickerContainer.contains(event.target) &&
      !emojiOption.contains(event.target)
    ) {
      emojiModal.classList.add("hidden"); // Chiude il picker se il click è fuori
    }
  });

  // Populate the inputs with current data
  urlInput.value = linkData.url || "";
  titleInput.value = linkData.text || "";
  faviconOption.checked = linkData.icon === "favicon" ? true : false;
  emojiOption.checked = linkData.icon === "emoji" ? true : false;
  emptyOption.checked = !linkData.icon ? true : false;
  faviconPreview.src = linkData.imageUrl
    ? linkData.imageUrl
    : chrome.runtime.getURL("assets/images/favicon-empty.png");

  // Metti il focus nel campo URL se è un nuovo link
  if (!linkIndex) {
    setTimeout(() => urlInput.focus(), 0);
  }

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Fetch favicon when URL is updated
  urlInput.addEventListener("change", () => {
    const url = urlInput.value.trim();
    if (url && isValidUrl(url)) {
      const faviconUrl =
        "https://www.google.com/s2/favicons?domain=" + new URL(url).origin;
      faviconPreview.src = faviconUrl;
      faviconOption.checked = true; // Default to favicon on URL change
      linkData.imageUrl = faviconUrl; // Store favicon URL
    }
  });

  // Show the modal
  editModal.classList.remove("hidden");

  // Event listener per il salvataggio con "Invio"
  document.onkeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Previene il comportamento predefinito del tasto Invio
      document.getElementById("saveButton").click(); // Esegue il salvataggio
    }
  };

  // Save button event listener
  document.getElementById("saveButton").onclick = () => {
    saveState();
    //const linkData = columnsData[columnIndex].links[linkIndex];
    if (showDebug) {
      console.log("on save", linkData, columnIndex, linkIndex);
    }

    const iconValue = faviconOption.checked
      ? "favicon"
      : emojiOption.checked
      ? "emoji"
      : null;

    linkData.icon = iconValue;
    linkData.url = urlInput.value || "#";

    const newLinkData = {
      emoji: selectedEmoji.textContent,
      text: titleInput.value,
      url: linkData.url,
      imageUrl: linkData.imageUrl || null,
      icon: linkData.icon,
    };

    if (showDebug) {
      console.log("newLinkData", newLinkData);
    }

    if (linkIndex === null) {
      // Se linkIndex è null, aggiungiamo un nuovo link
      columnsData[columnIndex].links.push(newLinkData);
      addLink(linksWrapper, newLinkData, columnIndex);
    } else {
      // Aggiorna un link esistente
      columnsData[columnIndex].links[linkIndex] = newLinkData;
      updateLinkDisplay(linksWrapper, newLinkData, linkIndex);
    }

    saveColumns(); // Salva i dati aggiornati
    closeEditModal(); // Chiude il modal
  };

  // Close button event listener
  document.getElementById("closeButton").onclick = closeEditModal;

  // Event listener per chiudere il modal al clic fuori dal contenuto
  editModal.addEventListener("mousedown", (event) => {
    const modalContent = document.querySelector(".modal-content");
    if (!modalContent.contains(event.target)) {
      // Controlla se il clic è fuori dal contenuto
      closeEditModal();
    }
  });
}

function saveColumns() {
  // Salva columnsData come stringa JSON in chrome.storage.local
  chrome.storage.local.set({ columns: JSON.stringify(columnsData) }, () => {
    if (showDebug) {
      console.log("Data saved successfully!");
      console.log("columnsData", columnsData);
    }
  });
}

// Funzione per aggiornare l'interfaccia di un link esistente
function updateLinkDisplay(linksWrapper, linkData, linkIndex) {
  if (showDebug) {
    console.log("updateLinkDisplay", linkData, linkIndex);
  }
  const linkItems = linksWrapper.getElementsByClassName("link-item");
  const linkItem = linkItems[linkIndex];

  if (linkData.icon) {
    if (linkData.icon === "favicon") {
      // Usa l'immagine
      linkItem.querySelector(
        ".emoji"
      ).innerHTML = `<img src="${linkData.imageUrl}" alt="icon" style="width: 16px; height: 16px;">`;
    } else {
      // Usa l'emoji
      linkItem.querySelector(".emoji").textContent = linkData.emoji;
    }
  } else {
    linkItem.querySelector(".emoji").textContent = "";
  }

  //linkItem.querySelector(".emoji").textContent = linkData.emoji;
  linkItem.querySelector(".link-text").textContent = linkData.text;
  linkItem.querySelector("a").href = linkData.url;
}

// Function to close the edit modal
function closeEditModal() {
  const editModal = document.getElementById("editModal");
  editModal.classList.add("hidden"); // Hide the modal
  document.onkeydown = null; // Rimuove l'event listener per "Invio"
}

// Crea una funzione updateAddLinkButtons che aggiorna columnIndex in addLinkButton.onclick per ciascuna colonna, in base alla posizione aggiornata di ogni .column dopo una modifica.
function updateAddLinkButtons() {
  // Seleziona tutte le colonne attualmente presenti
  const columns = Array.from(document.querySelectorAll(".column"));

  columns.forEach((column, newIndex) => {
    const addLinkButton = column.querySelector(".add-link");

    // Assicurati che addLinkButton esista per la colonna
    if (addLinkButton) {
      // Aggiorna l'handler del pulsante per il nuovo indice
      addLinkButton.onclick = () => {
        openEditModal(
          { emoji: "😄", text: "", url: "" },
          newIndex, // Usa il nuovo indice aggiornato
          null,
          column.querySelector(".links-wrapper")
        );
      };
    }
  });
}

function saveState() {
  if (stateHistory.length >= MAX_HISTORY) {
    stateHistory.shift(); // Rimuove il più vecchio se si supera il limite
  }
  // Salva una copia profonda dell'attuale columnsData
  stateHistory.push(JSON.parse(JSON.stringify(columnsData)));
  undoButton.disabled = false; // Abilita il pulsante "Annulla" ogni volta che si salva uno stato
}

function undo() {
  if (stateHistory.length === 0) {
    alert("Non ci sono modifiche da annullare.");
    return;
  }
  columnsContainer.innerHTML = "";
  columnsData = stateHistory.pop(); // Ripristina l'ultimo stato
  saveColumns(); // Salva lo stato ripristinato
  loadColumns(); // Ricarica l'interfaccia
  undoButton.disabled = stateHistory.length === 0; // Disabilita il pulsante se non ci sono più stati
}

undoButton.addEventListener("click", undo);

// Funzione per caricare i dati di default dal file JSON
async function loadDefaultData() {
  try {
    const response = await fetch(
      chrome.runtime.getURL("assets/json/defaultData.json")
    );
    const defaultData = await response.json();
    return defaultData;
  } catch (error) {
    console.error("Errore nel caricamento dei dati di default:", error);
    return null;
  }
}

function loadColumns() {
  //chrome.storage.local.clear();
  chrome.storage.local.get(["columns", "alreadyInstalled"], async (data) => {
    if (!data.alreadyInstalled) {
      // Prima installazione: carica i dati predefiniti

      // Carica le colonne al caricamento della pagina
      try {
        defaultData = await loadDefaultData();
        if (showDebug) {
          console.log("first time defaultData", defaultData);
        }

        columnsData = defaultData.columns;
        chrome.storage.local.set({
          columns: JSON.stringify(columnsData),
          alreadyInstalled: true,
        });
      } catch (error) {
        console.error("Errore nel caricamento dei dati predefiniti:", error);
        columnsData = []; // Usa un array vuoto se il caricamento fallisce
      }
      //alert("Benvenuto! È stato caricato un elenco di link predefiniti.");
    } else if (data.columns) {
      // Carica i dati salvati se esistono
      columnsData = JSON.parse(data.columns);
    }

    if (showDebug) {
      console.log("columnsData", columnsData);
    }
    // Load columns to the UI
    columnsData.forEach((columnData, index) => {
      addColumn(columnData.title, columnData.links, index);
    });

    // Inizializza il drag-and-drop sui link
    initializeLinkSorting();
  });
}
