// --- Data Initialization ---
const itemsById = {};
embeddedItemData.forEach(item => {
    if (item["Item ID"] != null) { itemsById[String(item["Item ID"])] = item; }
});

// --- DOM Elements ---
const listingsContainer = document.getElementById('listings-container');
const historyContainer = document.getElementById('history-container');
const addListingBtn = document.getElementById('add-listing-btn');
const listingTemplate = document.getElementById('listing-template');
const historyTemplate = document.getElementById('history-template');
const historyHeader = document.querySelector('.history-header');
const exportBtn = document.getElementById('export-data-btn');
const importInput = document.getElementById('import-file-input');

// Summary Stat Elements
const totalFlipsEl = document.getElementById('total-flips');
const totalProfitEl = document.getElementById('total-profit');
const biggestFlipIconEl = document.getElementById('biggest-flip-icon');
const biggestFlipProfitEl = document.getElementById('biggest-flip-profit');
const mostFlippedIconEl = document.getElementById('most-flipped-icon');
const mostFlippedCountEl = document.getElementById('most-flipped-count');

// --- Global Variables ---
let nextListingId = 1;
let flipHistory = [];
let activeListings = [];
const MARKET_FEE_PERCENT = 0.05;
let currentHistorySort = { column: 'dateSold', direction: 'desc' };

// Helper function to check if items can be grouped
function canGroupItems(item1, item2) {
    const sameItem = item1.itemId === item2.itemId;
    const sameDate = Math.floor(item1.dateSold / 86400000) === Math.floor(item2.dateSold / 86400000); // Group by day
    const sameBuyPrice = item1.buyPrice === item2.buyPrice;
    const sameSellPrice = item1.sellPrice === item2.sellPrice;
    const sameNoFee = item1.noFeeApplied === item2.noFeeApplied;
    
    return sameItem && sameDate && sameBuyPrice && sameSellPrice && sameNoFee;
}

// --- Utility Functions ---
function generateUniqueId() { 
    return Date.now().toString(36) + Math.random().toString(36).substring(2); 
}

function getItemData(itemId) { 
    return itemsById[String(itemId)] || null; 
}

function formatPrice(price, roundToInteger = false) { 
    const num = Number(price); 
    if (isNaN(num)) return 'N/A';
    
    if (roundToInteger) {
        return Math.round(num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
        return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
}

function formatDate(timestamp) { 
    if (!timestamp) return 'N/A'; 
    const date = new Date(timestamp); 
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' }); 
}

function calculateProfit(buy, sell, applyFee = true) {
    const buyNum = Number(buy);
    const sellNum = Number(sell);
    if (isNaN(buyNum) || isNaN(sellNum)) return null;
    const sellAfterFee = applyFee ? (sellNum * (1 - MARKET_FEE_PERCENT)) : sellNum;
    return sellAfterFee - buyNum;
}

function getProfitClass(profit) { 
    if (profit === null || profit === 0) return 'profit-neutral'; 
    return profit > 0 ? 'profit-positive' : 'profit-negative'; 
}

// --- Summary Statistics Function ---
function updateSummaryStats() {
    // Calculate total number of items flipped (accounting for quantities)
    let totalFlips = 0;
    flipHistory.forEach(entry => {
        totalFlips += (entry.quantity || 1);
    });
    
    totalFlipsEl.textContent = totalFlips;

    if (flipHistory.length === 0) {
        totalProfitEl.textContent = formatPrice(0);
        biggestFlipIconEl.style.display = 'none';
        biggestFlipProfitEl.textContent = 'N/A';
        mostFlippedIconEl.style.display = 'none';
        mostFlippedCountEl.textContent = 'N/A';
        return;
    }

    let totalProfit = 0;
    let biggestProfit = -Infinity;
    let biggestFlipEntry = null;
    const itemCounts = {};

    flipHistory.forEach(entry => {
        const profit = entry.noFeeApplied
            ? (entry.sellPrice - entry.buyPrice)
            : calculateProfit(entry.buyPrice, entry.sellPrice, true);

        // Add profit property if missing for calculation consistency
        if (entry.profit === undefined) entry.profit = profit;

        const quantity = entry.quantity || 1;
        
        if (profit !== null) {
            totalProfit += profit * quantity;
            const profitPerItem = profit;
            if (profitPerItem > biggestProfit) {
                biggestProfit = profitPerItem;
                biggestFlipEntry = entry;
            }
        }
        // Count item occurrences (including quantities)
        itemCounts[entry.itemId] = (itemCounts[entry.itemId] || 0) + quantity;
    });

    // Update Total Profit
    totalProfitEl.textContent = formatPrice(totalProfit, true);
    totalProfitEl.className = `stat-value ${getProfitClass(totalProfit)}`;

    // Update Biggest Flip (per individual item)
    if (biggestFlipEntry) {
        const itemData = getItemData(biggestFlipEntry.itemId);
        biggestFlipIconEl.src = itemData ? (itemData['Sprite-Link'] || 'placeholder-icon.png') : 'placeholder-icon.png';
        biggestFlipIconEl.alt = itemData ? itemData.Name : `Item #${biggestFlipEntry.itemId}`;
        biggestFlipIconEl.style.display = 'inline-block';
        biggestFlipProfitEl.textContent = formatPrice(biggestProfit, true);
        biggestFlipProfitEl.className = getProfitClass(biggestProfit);
    } else {
        biggestFlipIconEl.style.display = 'none';
        biggestFlipProfitEl.textContent = 'N/A';
        biggestFlipProfitEl.className = 'profit-neutral';
    }

    // Update Most Flipped (counting total quantities)
    let mostFlippedItemId = null;
    let maxCount = 0;
    for (const itemId in itemCounts) {
        if (itemCounts[itemId] > maxCount) {
            maxCount = itemCounts[itemId];
            mostFlippedItemId = itemId;
        }
    }

    if (mostFlippedItemId) {
        const itemData = getItemData(mostFlippedItemId);
        mostFlippedIconEl.src = itemData ? (itemData['Sprite-Link'] || 'placeholder-icon.png') : 'placeholder-icon.png';
        mostFlippedIconEl.alt = itemData ? itemData.Name : `Item #${mostFlippedItemId}`;
        mostFlippedIconEl.style.display = 'inline-block';
        mostFlippedCountEl.textContent = `(${maxCount}x)`;
    } else {
        mostFlippedIconEl.style.display = 'none';
        mostFlippedCountEl.textContent = 'N/A';
    }
}

// --- State Management Functions ---
function saveState() {
    activeListings = [];
    listingsContainer.querySelectorAll('.listing-entry').forEach(entry => {
        const select = entry.querySelector('.item-select');
        const noFeeCheckbox = entry.querySelector('.no-fee-checkbox');
        const quantityElem = entry.querySelector('.item-quantity');
        activeListings.push({
            id: entry.dataset.id,
            itemId: select.value,
            buyPrice: entry.querySelector('.buy-price').value,
            sellPrice: entry.querySelector('.sell-price').value,
            searchText: entry.querySelector('.item-search-input').value,
            noFee: noFeeCheckbox.checked,
            quantity: parseInt(quantityElem?.textContent?.replace('x', '') || '1')
        });
    });
    localStorage.setItem('activeFlipListings', JSON.stringify(activeListings));
    localStorage.setItem('flipHistory', JSON.stringify(flipHistory));
    localStorage.setItem('nextListingId', nextListingId.toString());
    localStorage.setItem('currentHistorySort', JSON.stringify(currentHistorySort));
}

function loadState(source = 'localStorage') {
    let loadedData = null;
    if (source === 'localStorage') {
        loadedData = {
            active: localStorage.getItem('activeFlipListings'),
            history: localStorage.getItem('flipHistory'),
            nextId: localStorage.getItem('nextListingId'),
            sort: localStorage.getItem('currentHistorySort')
        };
    } else if (typeof source === 'object') {
        loadedData = {
            active: JSON.stringify(source.activeListings || []),
            history: JSON.stringify(source.flipHistory || []),
            nextId: source.nextListingId?.toString(),
            sort: JSON.stringify(source.currentHistorySort || { column: 'dateSold', direction: 'desc' })
        };
    } else {
        console.error("Invalid load source");
        return;
    }

    if (loadedData.history) {
        try {
            flipHistory = JSON.parse(loadedData.history);
            if (!Array.isArray(flipHistory)) flipHistory = [];
        } catch (e) {
            console.error("Error parsing flip history:", e);
            flipHistory = [];
        }
    } else {
        flipHistory = [];
    }

    if (loadedData.nextId) {
        nextListingId = parseInt(loadedData.nextId, 10) || 1;
    } else {
        nextListingId = flipHistory.length + (JSON.parse(loadedData.active || '[]')).length + 1;
    }

    if (loadedData.sort) {
        try {
            currentHistorySort = JSON.parse(loadedData.sort);
            if (!currentHistorySort || typeof currentHistorySort !== 'object' || !currentHistorySort.column || !currentHistorySort.direction) {
                throw new Error("Invalid sort object");
            }
        } catch(e) {
            console.error("Error parsing sort state:", e);
            currentHistorySort = { column: 'dateSold', direction: 'desc' };
        }
    } else {
        currentHistorySort = { column: 'dateSold', direction: 'desc' };
    }

    sortAndRenderHistory(); // Also calls updateSummaryStats

    listingsContainer.innerHTML = '';
    activeListings = [];
    let loadedActiveListings = [];
    if (loadedData.active) {
        try {
            loadedActiveListings = JSON.parse(loadedData.active);
            if (!Array.isArray(loadedActiveListings)) loadedActiveListings = [];
        } catch (e) {
            console.error("Error parsing active listings:", e);
            loadedActiveListings = [];
        }
    }

    if (loadedActiveListings.length > 0) {
        loadedActiveListings.forEach(data => {
            const newEntry = createListingEntry(data.id);
            const searchInput = newEntry.querySelector('.item-search-input');
            const select = newEntry.querySelector('.item-select');
            const buyInput = newEntry.querySelector('.buy-price');
            const sellInput = newEntry.querySelector('.sell-price');
            const noFeeCheckbox = newEntry.querySelector('.no-fee-checkbox');
            const icon = newEntry.querySelector('.item-icon');
            const quantityElem = newEntry.querySelector('.item-quantity');

            searchInput.value = data.searchText || '';
            buyInput.value = data.buyPrice || '';
            sellInput.value = data.sellPrice || '';
            noFeeCheckbox.checked = data.noFee || false;

            // Handle quantity display
            if (data.quantity && data.quantity > 1) {
                quantityElem.textContent = `x${data.quantity}`;
                quantityElem.style.display = 'block';
            } else {
                quantityElem.textContent = 'x1';
                quantityElem.style.display = 'none';
            }

            populateItemDropdown(select, data.searchText || '');

            if (data.itemId && itemsById[data.itemId]) {
                select.value = data.itemId;
                const itemData = getItemData(data.itemId);
                if (itemData) {
                    icon.src = itemData['Sprite-Link'] || 'placeholder-icon.png';
                    icon.alt = itemData.Name;
                    searchInput.value = itemData.Name;
                    select.style.display = 'none';
                }
                updateHoverInfo(newEntry);
            } else {
                icon.src = 'placeholder-icon.png';
                icon.alt = 'Item Icon';
                select.style.display = searchInput.value ? 'block' : 'none';
            }
            listingsContainer.appendChild(newEntry);
            activeListings.push(data);
        });
    } else {
        addListing();
    }
	const maxIdNum = Math.max(
        ...flipHistory.map(h => parseInt((h.id || '').split('-')[1] || '0', 10)),
        ...activeListings.map(a => parseInt((a.id || '').split('-')[1] || '0', 10)),
        0
    );
    nextListingId = Math.max(nextListingId, maxIdNum + 1);

    saveState();
    updateSummaryStats(); // Ensure summary is updated on initial load/import
}

// --- Item Dropdown Functions ---
function populateItemDropdown(selectElement, filter = '') {
    selectElement.innerHTML = '<option value="">-- Select Item --</option>';
    const filterLower = filter.toLowerCase();
    const sortedItems = [...embeddedItemData].sort((a, b) => {
        const nameA = a.Name || '';
        const nameB = b.Name || '';
        return nameA.localeCompare(nameB);
    });
    sortedItems.forEach(item => {
        const itemIdStr = String(item["Item ID"]);
        const itemName = item.Name || `Item #${itemIdStr}`;
        if (filter === '' || itemName.toLowerCase().includes(filterLower)) {
            const option = document.createElement('option');
            option.value = itemIdStr;
            option.textContent = itemName;
            option.dataset.icon = item['Sprite-Link'] || 'placeholder-icon.png';
            selectElement.appendChild(option);
        }
    });
}

function updateHoverInfo(listingEntryElement) {
    const itemId = listingEntryElement.querySelector('.item-select').value;
    const hoverInfoDiv = listingEntryElement.querySelector('.hover-info');

    if (!itemId || !hoverInfoDiv) {
        hoverInfoDiv.innerHTML = `Last Flip: N/A<br>Previous Flips: 0<br>Avg Profit: N/A<br>Highest Margin: N/A`;
        return;
    }

    const relevantHistory = flipHistory.filter(entry => String(entry.itemId) === String(itemId));
    const flipCount = relevantHistory.length;

    let lastFlipDate = 'N/A';
    let avgProfitStr = 'N/A';
    let highestMarginStr = 'N/A';
    if (flipCount > 0) {
        relevantHistory.sort((a, b) => b.dateSold - a.dateSold);
        lastFlipDate = formatDate(relevantHistory[0].dateSold);

        let totalProfit = 0;
        let currentHighest = -Infinity;
        relevantHistory.forEach(entry => {
            const profit = entry.noFeeApplied ? (entry.sellPrice - entry.buyPrice) : calculateProfit(entry.buyPrice, entry.sellPrice, true);
            entry.profit = profit;

            if (profit !== null) {
                totalProfit += profit;
                if (profit > currentHighest) {
                    currentHighest = profit;
                }
            }
        });
        avgProfitStr = formatPrice(totalProfit / flipCount);
        highestMarginStr = formatPrice(currentHighest);
    }
    hoverInfoDiv.innerHTML = `Last Flip: ${lastFlipDate}<br>Previous Flips: ${flipCount}<br>Avg Profit: ${avgProfitStr}<br>Highest Margin: ${highestMarginStr}`;
}

// --- Listing Entry Creation ---
function createListingEntry(id = null) {
    const template = listingTemplate.content.cloneNode(true);
    const entryDiv = template.querySelector('.listing-entry');
    const newId = id || `listing-${nextListingId++}`;
    entryDiv.dataset.id = newId;
    const searchInput = entryDiv.querySelector('.item-search-input');
    const select = entryDiv.querySelector('.item-select');
    const iconDiv = entryDiv.querySelector('.item-icon');
    const buyPriceInput = entryDiv.querySelector('.buy-price');
    const sellPriceInput = entryDiv.querySelector('.sell-price');
    const sellButton = entryDiv.querySelector('.sell-button');
    const removeButton = entryDiv.querySelector('.remove-button');
    const noFeeCheckbox = entryDiv.querySelector('.no-fee-checkbox');
    const quantityAddBtn = entryDiv.querySelector('.quantity-add-btn');
    const quantityRemoveBtn = entryDiv.querySelector('.quantity-remove-btn');
    let selectVisible = false;

    populateItemDropdown(select);

    // Initialize quantity element
    const quantityElem = entryDiv.querySelector('.item-quantity');
    quantityElem.textContent = 'x1';
    quantityElem.style.display = 'none';

    const showDropdown = () => {
        populateItemDropdown(select, searchInput.value);
        select.style.display = 'block';
        selectVisible = true;
        const currentVal = select.querySelector(`option[value="${select.dataset.currentValue || ''}"]`);
        if (currentVal) { } else if (select.options.length > 1) { }
    };
    searchInput.addEventListener('focus', showDropdown);
    searchInput.addEventListener('click', showDropdown);

    searchInput.addEventListener('input', () => {
        populateItemDropdown(select, searchInput.value);
        if (!selectVisible) {
            select.style.display = 'block';
            selectVisible = true;
        }
        select.value = "";
        iconDiv.style.backgroundImage = '';
        updateHoverInfo(entryDiv);
    });

    entryDiv.querySelector('.item-select-wrapper').addEventListener('focusout', (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            select.style.display = 'none';
            selectVisible = false;
        }
    });

    const handleSelection = () => {
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            iconDiv.style.backgroundImage = '';
            searchInput.value = '';
            select.dataset.currentValue = '';
            updateHoverInfo(entryDiv);
        } else {
            const itemId = selectedOption.value;
            const itemData = getItemData(itemId);
            if (itemData) {
                iconDiv.style.backgroundImage = itemData['Sprite-Link'] ? `url('${itemData['Sprite-Link']}')` : '';
                searchInput.value = itemData.Name;
                select.dataset.currentValue = itemId;
                updateHoverInfo(entryDiv);
                
                // Show quantity indicator if it exists
                const quantityElem = entryDiv.querySelector('.item-quantity');
                const currentQty = parseInt(quantityElem.textContent.replace('x', '') || '1');
                quantityElem.style.display = currentQty > 1 ? 'block' : 'none';
            }
        }
        select.style.display = 'none';
        selectVisible = false;
        saveState();
    };

    select.addEventListener('change', handleSelection);
    select.addEventListener('click', handleSelection);
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { handleSelection(); }
    });

    // Quantity buttons functionality
    quantityAddBtn.addEventListener('click', () => {
        const currentQty = parseInt(quantityElem.textContent.replace('x', '') || '1');
        const newQty = currentQty + 1;
        quantityElem.textContent = `x${newQty}`;
        quantityElem.style.display = newQty > 1 ? 'block' : 'none';
        saveState();
    });
    
    quantityRemoveBtn.addEventListener('click', () => {
        const currentQty = parseInt(quantityElem.textContent.replace('x', '') || '1');
        if (currentQty > 1) {
            const newQty = currentQty - 1;
            quantityElem.textContent = `x${newQty}`;
            quantityElem.style.display = newQty > 1 ? 'block' : 'none';
        } else {
            // If quantity would go below 1, remove the entire entry
            entryDiv.remove();
            activeListings = activeListings.filter(l => l.id !== entryDiv.dataset.id);
        }
        saveState();
    });

    // Remove button functionality
    removeButton.addEventListener('click', () => {
        entryDiv.remove();
        activeListings = activeListings.filter(l => l.id !== entryDiv.dataset.id);
        saveState();
    });
    
    // Sell button functionality (replaces the sell checkbox)
    sellButton.addEventListener('click', () => {
        const itemId = select.value;
        let buyPrice = buyPriceInput.value;
        let sellPrice = sellPriceInput.value;
        const applyFee = !noFeeCheckbox.checked;
        const itemData = getItemData(itemId);
        const quantity = parseInt(quantityElem?.textContent?.replace('x', '') || '1');

        if (!itemId || !itemData) { 
            alert('Please select a valid item.'); 
            return; 
        }
        
        // Auto-fill NPC sell price if applicable
        if (noFeeCheckbox.checked && sellPrice === '' && itemData.Sell) {
            sellPrice = itemData.Sell;
            sellPriceInput.value = sellPrice;
        }
        
        if (buyPrice === '' || sellPrice === '') { 
            alert('Please enter both Buy and Sell prices.'); 
            return; 
        }

        const profit = calculateProfit(buyPrice, sellPrice, applyFee);
        const historyData = {
            id: `history-${generateUniqueId()}`,
            itemId: itemId,
            dateSold: Date.now(),
            buyPrice: Number(buyPrice),
            sellPrice: Number(sellPrice),
            profit: profit,
            itemName: itemData.Name,
            noFeeApplied: !applyFee,
            quantity: quantity
        };
        
        // Try to group with existing history items
        let grouped = false;
        for (let i = 0; i < flipHistory.length; i++) {
            if (canGroupItems(flipHistory[i], historyData)) {
                flipHistory[i].quantity = (flipHistory[i].quantity || 1) + quantity;
                grouped = true;
                break;
            }
        }
        
        if (!grouped) {
            flipHistory.push(historyData);
        }
        
        sortAndRenderHistory();
        entryDiv.remove();

        activeListings = activeListings.filter(l => l.id !== entryDiv.dataset.id);
        saveState();

        listingsContainer.querySelectorAll('.listing-entry').forEach(entry => {
            if (entry.querySelector('.item-select').value === itemId) {
                updateHoverInfo(entry);
            }
        });
    });
    
    buyPriceInput.addEventListener('change', saveState);
    sellPriceInput.addEventListener('change', saveState);
    noFeeCheckbox.addEventListener('change', () => {
        const selectedItemId = select.value;
        const itemData = getItemData(selectedItemId);
        
        if (noFeeCheckbox.checked && itemData && itemData.Sell) {
            // If NPC checkbox is checked and we have valid item data with a Sell price
            sellPriceInput.value = itemData.Sell;
        }
        
        saveState();
    });

    return entryDiv;
}

// --- History Entry Rendering ---
function renderHistoryEntry(historyData) {
    const template = historyTemplate.content.cloneNode(true);
    const historyEntryDiv = template.querySelector('.history-entry');
    historyEntryDiv.dataset.id = historyData.id;
    
    const itemData = getItemData(historyData.itemId);
    const iconElement = historyEntryDiv.querySelector('.history-item-icon');
    iconElement.src = itemData ? (itemData['Sprite-Link'] || 'placeholder-icon.png') : 'placeholder-icon.png';
    iconElement.alt = itemData ? itemData.Name : `Item #${historyData.itemId}`;
    
    // Add quantity display
    const quantityElem = historyEntryDiv.querySelector('.item-quantity');
    const quantity = historyData.quantity || 1;
    quantityElem.textContent = `x${quantity}`;
    quantityElem.style.display = quantity > 1 ? 'block' : 'none';
    
    historyEntryDiv.querySelector('.history-date').textContent = formatDate(historyData.dateSold);
    historyEntryDiv.querySelector('.history-name').textContent = itemData ? itemData.Name : `Item #${historyData.itemId}`;
    historyEntryDiv.querySelector('.history-buy').textContent = formatPrice(historyData.buyPrice);
    historyEntryDiv.querySelector('.history-sell').textContent = formatPrice(historyData.sellPrice);
    
    const profitCell = historyEntryDiv.querySelector('.history-profit');
    const profitPerItem = historyData.noFeeApplied ? (historyData.sellPrice - historyData.buyPrice) : calculateProfit(historyData.buyPrice, historyData.sellPrice, true);
    const totalProfit = profitPerItem * quantity;
    profitCell.textContent = formatPrice(totalProfit, false); // Keep decimals for history entries
    profitCell.className = `history-cell history-profit ${getProfitClass(totalProfit)}`;
    
    if (historyData.noFeeApplied) {
        const npcSpan = document.createElement('span');
        npcSpan.className = 'npc-indicator';
        npcSpan.textContent = '(NPC)';
        profitCell.appendChild(npcSpan);
    }
    
    const deleteBtn = historyEntryDiv.querySelector('.history-delete-button');
    deleteBtn.addEventListener('click', () => {
        const historyIdToDelete = historyData.id;
        const originalItemId = historyData.itemId;
        flipHistory = flipHistory.filter(entry => entry.id !== historyIdToDelete);
        historyEntryDiv.remove();
        saveState();
        updateSummaryStats();
        
        listingsContainer.querySelectorAll('.listing-entry').forEach(entry => {
            if (entry.querySelector('.item-select').value === originalItemId) {
                updateHoverInfo(entry);
            }
        });
    });
    
    return historyEntryDiv;
}

// --- History Sorting and Rendering ---
function sortAndRenderHistory() {
    const { column, direction } = currentHistorySort;
    const sortedHistory = [...flipHistory].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        if (column === 'profit') {
            valA = a.noFeeApplied ? (a.sellPrice - a.buyPrice) : calculateProfit(a.buyPrice, a.sellPrice, true);
            valB = b.noFeeApplied ? (b.sellPrice - b.buyPrice) : calculateProfit(b.buyPrice, b.sellPrice, true);
        }
        
        if (column === 'itemName') {
            valA = (valA || '').toLowerCase();
            valB = (valB || '').toLowerCase();
            return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (column === 'dateSold') {
            return direction === 'asc' ? valA - valB : valB - valA;
        } else {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    historyContainer.innerHTML = '';
    sortedHistory.forEach(entry => {
        const entryElement = renderHistoryEntry(entry);
        historyContainer.appendChild(entryElement);
    });
    
    updateSortIndicators();
    updateSummaryStats();
}

function updateSortIndicators() {
    historyHeader.querySelectorAll('[data-sort]').forEach(headerCell => {
        headerCell.classList.remove('sort-asc', 'sort-desc');
        if (headerCell.dataset.sort === currentHistorySort.column) {
            headerCell.classList.add(currentHistorySort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// --- Listing Management Functions ---
function addListing() {
    const newEntry = createListingEntry();
    listingsContainer.appendChild(newEntry);
    activeListings.push({
        id: newEntry.dataset.id,
        itemId: '', 
        buyPrice: '', 
        sellPrice: '', 
        searchText: '',
        noFee: false,
        quantity: 1
    });
    saveState();
}

// --- Import/Export Functions ---
function exportData() {
    saveState();
    const dataToExport = {
        activeListings: activeListings,
        flipHistory: flipHistory,
        nextListingId: nextListingId,
        currentHistorySort: currentHistorySort
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = 'flip_tracker_data.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) { return; }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (typeof importedData !== 'object' || importedData === null) {
                throw new Error("Invalid JSON structure");
            }
            loadState(importedData);
            alert('Data imported successfully!');
        } catch (error) {
            console.error("Error importing data:", error);
            alert(`Failed to import data. Please ensure the file is a valid JSON export from this tool.\nError: ${error.message}`);
        } finally {
            importInput.value = null;
        }
    };
    reader.onerror = function() {
        alert(`Error reading file: ${reader.error}`);
        importInput.value = null;
    }
    reader.readAsText(file);
}

// --- Event Listeners ---
addListingBtn.addEventListener('click', addListing);

historyHeader.addEventListener('click', (e) => {
    const headerCell = e.target.closest('[data-sort]');
    if (!headerCell) return;
    
    const sortColumn = headerCell.dataset.sort;
    if (currentHistorySort.column === sortColumn) {
        currentHistorySort.direction = currentHistorySort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentHistorySort.column = sortColumn;
        currentHistorySort.direction = (sortColumn === 'dateSold' || sortColumn === 'profit') ? 'desc' : 'asc';
    }
    
    sortAndRenderHistory();
    saveState();
});

exportBtn.addEventListener('click', exportData);

// Replace the import input event listener with a button click handler
document.getElementById('import-btn').addEventListener('click', () => {
    importInput.click();
});
importInput.addEventListener('change', importData);

// --- Initialize Application ---
document.addEventListener('DOMContentLoaded', () => loadState('localStorage'));