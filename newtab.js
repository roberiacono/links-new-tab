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

let columnsData = []; // Will be populated in loadColumns()

const defaultData = {
  columns: [
    {
      title: "Sample Column",
      links: [
        {
          emoji: "🔗",
          text: "OpenAI",
          url: "https://www.openai.com",
        },
        {
          emoji: "📘",
          text: "Documentation",
          url: "https://docs.openai.com",
        },
        {
          emoji: "🌐",
          text: "Google",
          url: "https://www.google.com",
        },
      ],
    },
  ],
};

// Carica le colonne salvate al caricamento della pagina
document.addEventListener("DOMContentLoaded", loadColumns);

// Aggiunge una nuova colonna quando si clicca sul pulsante "Aggiungi Colonna"
addColumnButton.addEventListener("click", () => {
  addColumn();
  saveColumns();
});

function addColumn(title = "Nuova Colonna", links = [], columnIndex) {
  const column = document.createElement("div");
  column.className = "column";

  const titleInput = document.createElement("input");
  titleInput.value = title;
  titleInput.className = "column-title";
  titleInput.oninput = saveColumns;
  column.appendChild(titleInput);

  // Wrapper per i link
  const linksWrapper = document.createElement("div");
  linksWrapper.className = "links-wrapper";
  column.appendChild(linksWrapper);

  // Aggiungi i link esistenti al wrapper
  links.forEach((linkData) => addLink(linksWrapper, linkData, columnIndex));

  const addLinkButton = document.createElement("button");
  addLinkButton.textContent = "Aggiungi Link";
  addLinkButton.onclick = () =>
    openEditModal(
      { emoji: "", text: "", url: "" },
      columnIndex,
      null,
      linksWrapper
    );
  column.appendChild(addLinkButton);

  columnsContainer.appendChild(column);
}

function addLink(linksWrapper, linkData, columnIndex) {
  const linkItem = document.createElement("div");
  linkItem.className = "link-item";

  // Create the link as an <a> element
  const linkAnchor = document.createElement("a");
  linkAnchor.href = linkData.url;
  linkAnchor.target = "_blank";
  linkAnchor.className = "link-anchor"; // New class for the anchor
  linkAnchor.style.display = "flex"; // Use flex for the emoji and text alignment
  linkAnchor.style.alignItems = "center"; // Center items vertically

  // Emoji as a div
  const emojiDiv = document.createElement("div");
  emojiDiv.textContent = linkData.emoji;
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

function saveColumns() {
  // Salva columnsData come stringa JSON in chrome.storage.sync
  chrome.storage.sync.set({ columns: JSON.stringify(columnsData) }, () => {
    console.log("Data saved successfully!");
  });
}

// Function to open the edit modal
function openEditModal(linkData, columnIndex, linkIndex, linksWrapper) {
  const editModal = document.getElementById("editModal");
  const urlInput = document.getElementById("url");
  const titleInput = document.getElementById("title");
  const emojiSelect = document.getElementById("emoji");

  // Populate the inputs with current data
  urlInput.value = linkData.url || "";
  titleInput.value = linkData.text || "";
  emojiSelect.value = linkData.emoji || "";

  // Show the modal
  editModal.classList.remove("hidden");

  // Save button event listener
  document.getElementById("saveButton").onclick = () => {
    const newLinkData = {
      emoji: emojiSelect.value,
      text: titleInput.value,
      url: urlInput.value,
    };

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
}

// Funzione per aggiornare l'interfaccia di un link esistente
function updateLinkDisplay(linksWrapper, linkData, linkIndex) {
  console.log("updateLinkDisplay", linksWrapper, linkData, linkIndex);
  const linkItems = linksWrapper.getElementsByClassName("link-item");
  const linkItem = linkItems[linkIndex];

  linkItem.querySelector(".emoji").textContent = linkData.emoji;
  linkItem.querySelector(".link-text").textContent = linkData.text;
  linkItem.querySelector("a").href = linkData.url;
}

// Function to close the edit modal
function closeEditModal() {
  const editModal = document.getElementById("editModal");
  editModal.classList.add("hidden"); // Hide the modal
}

function loadColumns() {
  //chrome.storage.sync.clear();
  chrome.storage.sync.get("columns", (data) => {
    if (data.columns) {
      columnsData = JSON.parse(data.columns); // Parse the JSON string
    } else {
      // Use default data if nothing is saved in storage
      columnsData = defaultData.columns;
      // Save this default data to storage
      chrome.storage.sync.set({ columns: JSON.stringify(columnsData) });
    }
    console.log("columnsData", columnsData);
    // Load columns to the UI
    columnsData.forEach((columnData, index) => {
      addColumn(columnData.title, columnData.links, index);
    });
  });
}
