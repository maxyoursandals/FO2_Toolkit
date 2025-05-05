const API_BASE_URL = 'https://fantasyonline2.com/api/public';
const API_KEY = process.env.API_KEY;
let embeddedItemData = null; // Initialize as null

// Load the JSON file and assign its contents to embeddedItemData
async function loadEmbeddedItemData() {
    try {
        console.log('Attempting to load item-data.json...');
        const response = await fetch('item-data.json'); // Ensure the path is correct
        console.log('Fetch response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to load JSON file: ${response.statusText}`);
        }
        const jsonData = await response.json();
        console.log('Raw JSON data:', jsonData);

        embeddedItemData = jsonData;
        console.log('Embedded item data loaded:', embeddedItemData);
    } catch (error) {
        console.error('Error loading embedded item data:', error);
    }
}

// Call the function to load the JSON file
loadEmbeddedItemData();

let currentPage = 1;
let totalPages = 1;
let currentSort = 'TimeLeft';
let currentDirection = 'DESC';
let lastApiSearchTerm = ''; // Store term used for last API call
let isLoading = false;
let itemDatabase = null;
let currentMarketListings = []; // Stores full data for the current page from API
let currentlyDisplayedListings = []; // Stores the listings currently shown (after filtering)
let abortController = null;
// let lastUpdateTime = null;
let showProfitableOnlyState = false; // Tracks if the profitable filter *should* be active
let isComprehensiveSearchActive = false; // Tracks if we are *currently showing* comprehensive results
let comprehensiveSearchResults = [];
let searchedPages = 0;
let totalSearchPages = 0;
let comprehensiveSearchAborted = false;
let personalPrices = {}; // Holds user-defined prices {itemId: price}
let selectedItemId = null; // Track the currently selected item ID for the details panel

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortBySelect = document.getElementById('sort-by');
const sortDirectionSelect = document.getElementById('sort-direction');
const messageContainer = document.getElementById('message-container');
const databaseStatus = document.getElementById('database-status');
const resultsContainer = document.getElementById('results-container');
const resultsTable = document.getElementById('results-table');
const resultsBody = document.getElementById('results-body');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const itemDetailsColumn = document.getElementById('item-details-column');
const detailsIcon = document.getElementById('details-icon');
const detailsName = document.getElementById('details-name');
const detailsRecentlyListedPrice = document.getElementById('details-recently-listed-price');
const detailsBuyPrice = document.getElementById('details-buy-price');
const detailsSellPrice = document.getElementById('details-sell-price');
const detailsError = document.getElementById('details-error');
// const lastUpdatedTimestampSpan = document.getElementById('last-updated-timestamp');
const refreshButton = document.getElementById('refresh-button');
const detailsPotentialProfit = document.getElementById('details-potential-profit');
const detailsPersonalProfit = document.getElementById('details-personal-profit');
const showProfitableButton = document.getElementById('show-profitable-only');
const personalPriceInput = document.getElementById('details-personal-price');
const searchProgressModal = document.getElementById('search-progress-modal');
const searchProgressContent = document.getElementById('search-progress-content');
const searchProgressMessage = document.getElementById('search-progress-message');
const searchProgressBarContainer = document.getElementById('search-progress-bar-container');
const searchProgressBar = document.getElementById('search-progress-bar');
const cancelSearchButton = document.getElementById('cancel-search-button');


// --- Local Storage Functions ---
function loadPersonalPrices() {
    try {
        const storedPrices = localStorage.getItem('fo2PersonalPrices');
        personalPrices = storedPrices ? JSON.parse(storedPrices) : {};
        console.log("Loaded personal prices:", Object.keys(personalPrices).length);
    } catch (error) {
        console.error("Failed to load personal prices:", error);
        personalPrices = {}; // Reset on error
    }
}

function savePersonalPrice(itemId, price) {
        if (itemId == null) return;
        const stringItemId = String(itemId);

    const priceValue = price === '' ? null : parseFloat(price);

    if (priceValue === null || (!isNaN(priceValue) && priceValue >= 0)) {
            if (priceValue === null || price === '') {
                delete personalPrices[stringItemId];
            } else {
            personalPrices[stringItemId] = priceValue;
            }
            try {
            localStorage.setItem('fo2PersonalPrices', JSON.stringify(personalPrices));
            console.log("Saved personal price:", stringItemId, priceValue);
            // Re-apply highlighting and details after saving a price
            displayResults(currentlyDisplayedListings); // Update highlights based on current view
            if (selectedItemId === stringItemId) { // Re-display details if the current item was changed
                displayItemDetails(itemId);
            }
            } catch (error) {
                console.error("Failed to save personal prices:", error);
                showMessage('error', 'Could not save personal price. Storage might be full.');
            }
    } else {
            console.warn("Invalid personal price entered:", price);
            // Optionally show a user error - maybe highlight the input field?
    }
}

// --- Core Functions ---

async function loadItemDatabase() {
    try {
        console.log('Checking embeddedItemData:', embeddedItemData); // Debugging log
        if (!embeddedItemData || embeddedItemData.length === 0) {
            throw new Error("Embedded item data is missing or empty.");
        }
        itemDatabase = {};
        let validItems = 0;
        embeddedItemData.forEach(item => {
            const itemIdStr = String(item["Item ID"]);
            if (item["Item ID"] != null && itemIdStr !== '') {
                if (itemDatabase[itemIdStr]) {
                    console.warn(`Duplicate Item ID found: ${itemIdStr}. Overwriting.`);
                }
                itemDatabase[itemIdStr] = item;
                validItems++;
            } else {
                console.warn("Item missing or has invalid 'Item ID':", item);
            }
        });
        console.log('Database load successfully:', (validItems));
        // databaseStatus.innerHTML = `<div class="database-status"><span>Item database loaded successfully (${validItems} items)</span></div>`;
        return true;
    } catch (error) {
        console.error('Database load error:', error);
        // databaseStatus.innerHTML = `<div class="database-status error"><span>Failed to load item database: ${error.message}</span><button onclick="location.reload()">Retry</button></div>`;
        return false;
    }
}

function findItemById(itemId) { return itemDatabase?.[String(itemId)] || null; }
function formatNumber(num) { return (num == null || isNaN(num)) ? 'N/A' : num.toLocaleString(); }
function formatPrice(price) { return (price == null || price === "" || isNaN(price)) ? 'N/A' : `${formatNumber(price)} Coins`; }
function setTableLoading(loading) { if (loading) { resultsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 30px;"><div class="loading-spinner"></div></td></tr>`; } }
// function updateTimestampDisplay() { lastUpdatedTimestampSpan.textContent = lastUpdateTime ? `Last Updated: ${lastUpdateTime.toLocaleTimeString()}` : 'Last Updated: Never'; }

async function searchMarket(page = currentPage, term = searchInput.value.trim(), sort = currentSort, direction = currentDirection) {
    const isForComprehensive = isComprehensiveSearchActive; // Snapshot state
    if (isLoading && !isForComprehensive) return { error: "Already loading" };

    isLoading = true;
    disableControls(true, isForComprehensive); // Disable controls
    if (!isForComprehensive) {
        setTableLoading(true);
        messageContainer.innerHTML = '';
    }
    lastApiSearchTerm = term;

    if (abortController) { abortController.abort("New search started"); }
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
        const response = await fetch(`${API_BASE_URL}/market/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ search_term: term, sort_by: sort, sort_direction: direction, page: page }),
            signal: signal
        });

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch { errorData = null; }
            let errorMsg = `API Error: ${response.status} ${response.statusText}. ${errorData?.message || ''}`;
            if (response.status === 429) errorMsg = `API Rate Limit Hit. Please wait. ${errorData?.message || ''}`;
            else if (response.status === 401) errorMsg = `API Authentication Error (Invalid Key?). ${errorData?.message || ''}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();

        if (isForComprehensive) {
                isLoading = false; // Reset loading *only* for comprehensive flow here
                disableControls(false, isForComprehensive); // Re-enable *only* if needed for comp. flow (likely not)
                return data; // Return raw data for comprehensive handler
            }

        // --- Normal Page Load Logic ---
        currentMarketListings = data.listings || [];
        if (data.pagination) {
            totalPages = parseInt(data.pagination.totalPages) || 1;
            currentPage = Math.min(page, totalPages);
            currentPage = Math.max(1, currentPage);
        } else {
            totalPages = 1; currentPage = 1;
        }
        updatePagination();
        applyClientSideFilter(); // Filter and display the new data
        resultsContainer.style.display = 'flex';
        // lastUpdateTime = new Date();
        // updateTimestampDisplay();
        return data; // Return data

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted:', error.message);
            // If aborted by user cancel, it's handled in the cancel logic
            if (comprehensiveSearchAborted) return { aborted: true };
                // Otherwise, likely aborted by a new search starting, which is fine.
                // Ensure UI is reset correctly if needed.
                return { error: "Fetch aborted" }; // Indicate non-user abort
        } else {
                console.error('Search error:', error);
                if (!isForComprehensive) { // Only show errors for normal searches here
                    showMessage('error', `Failed to fetch market data: ${error.message}`);
                    resultsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: red;">Error loading data.</td></tr>`;
                    currentlyDisplayedListings = [];
                    itemDetailsColumn.style.display = 'none';
                    selectedItemId = null;
                    personalPriceInput.value = '';
                    personalPriceInput.disabled = true;
                    totalPages = 1; currentPage = 1;
                    updatePagination();
                }
                return { error: error.message }; // Indicate error occurred
        }
    } finally {
        if (!isForComprehensive) { // Final state reset only for normal searches
            isLoading = false;
            disableControls(false, false); // Re-enable controls fully
            abortController = null;
        }
    }
}

function applyClientSideFilter() {
    const filterText = searchInput.value.trim().toLowerCase();
    let listingsToFilter = isComprehensiveSearchActive ? comprehensiveSearchResults : currentMarketListings;

    if (!listingsToFilter) {
        currentlyDisplayedListings = [];
        resultsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">No listings available.</td></tr>`;
        return;
    }

    let filteredListings = listingsToFilter;
    if (filterText) {
        filteredListings = listingsToFilter.filter(item => {
            if (!item || item.ItemDefinitionId == null) return false;
            const dbItem = findItemById(item.ItemDefinitionId);
            const itemName = dbItem ? dbItem.Name.toLowerCase() : `item #${item.ItemDefinitionId}`;
            return itemName.includes(filterText);
        });
    }

    // Apply profitable-only state *only if not in comprehensive mode*
    if (showProfitableOnlyState && !isComprehensiveSearchActive) {
        filteredListings = filteredListings.filter(item => isItemProfitable(item));
    }

    currentlyDisplayedListings = filteredListings;
    displayResults(filteredListings);

    // --- Update No Results Message Logic ---
    let baseListingsCount = (isComprehensiveSearchActive ? comprehensiveSearchResults : currentMarketListings)?.length ?? 0;
    if (filteredListings.length === 0) {
        let message = "No listings found.";
        if (filterText && (showProfitableOnlyState && !isComprehensiveSearchActive)) {
            message = `No profitable items match '${filterText}'.`;
        } else if (filterText) {
                message = `No items match '${filterText}' in the current view.`;
                if (isComprehensiveSearchActive) message = `No profitable items match '${filterText}'.`;
            } else if (showProfitableOnlyState && !isComprehensiveSearchActive) {
            message = 'No profitable items found on this page.';
        } else if (baseListingsCount === 0 && !isLoading) {
                message = 'No listings available for the current view. Try Refreshing.';
            }
        resultsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">${message}</td></tr>`;
    }
}


function isItemProfitable(item) {
    if (!item || item.ItemDefinitionId == null || item.Price == null) return false;
    const itemDefinitionId = String(item.ItemDefinitionId);
    const dbItem = findItemById(itemDefinitionId);

    // Check vs NPC sell price
    if (dbItem && dbItem.Sell) {
        const sellPrice = (typeof dbItem.Sell === 'string' && dbItem.Sell !== '')
            ? parseInt(dbItem.Sell.replace(/,/g, ''), 10) : dbItem.Sell;
        if (sellPrice && !isNaN(sellPrice) && sellPrice > item.Price) {
            return true;
        }
    }
    // Check vs Personal price
    const personalPrice = personalPrices[itemDefinitionId];
    if (personalPrice != null && !isNaN(personalPrice) && personalPrice > item.Price) {
        return true;
    }
    return false;
}

function displayResults(listingsToDisplay) {
        if (!listingsToDisplay) {
            resultsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">Error displaying listings.</td></tr>`;
            return;
        }
        // Message setting is handled in applyClientSideFilter
        if (listingsToDisplay.length === 0 && !isLoading) {
            if (resultsBody.innerHTML === '') {
                resultsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">No listings match the current filters.</td></tr>`;
            }
            return;
        }

        resultsBody.innerHTML = ''; // Clear previous results
        listingsToDisplay.forEach(item => {
            if (!item || item.ItemDefinitionId == null || item.Price == null) {
                console.warn("Skipping invalid listing item:", item); return;
            }
            const row = document.createElement('tr');
            const itemDefinitionId = String(item.ItemDefinitionId);
            row.dataset.itemId = itemDefinitionId;

            // Time Left Calculation
            const endTime = item.Listed + (item.Duration * 86400000);
            const timeLeftMs = endTime - Date.now();
            let timeLeftText = 'Expired';
            if (timeLeftMs > 0) {
                const secondsLeft = Math.floor(timeLeftMs / 1000);
                const minutesLeft = Math.floor(secondsLeft / 60);
                const hoursLeft = Math.floor(minutesLeft / 60);
                const daysLeft = Math.floor(hoursLeft / 24);
                if (daysLeft > 0) timeLeftText = `${daysLeft}d ${hoursLeft % 24}h`;
                else if (hoursLeft > 0) timeLeftText = `${hoursLeft}h ${minutesLeft % 60}m`;
                else if (minutesLeft > 0) timeLeftText = `${minutesLeft}m ${secondsLeft % 60}s`;
                else timeLeftText = `${secondsLeft}s`;
            } else if (timeLeftMs > -3600000) { timeLeftText = 'Ending Soon'; }

            const databaseItem = findItemById(itemDefinitionId);
            const itemName = databaseItem ? databaseItem.Name : (item.ItemInstanceData?.name || `Item #${itemDefinitionId}`);
            const iconUrl = databaseItem ? databaseItem["Sprite-Link"] : null;

            // Profit Calculation & Display
            let npcProfit = null, personalProfit = null;
            let npcProfitDisplay = '', personalProfitDisplay = '';
            let isNpcProfitable = false, isPersonalProfitable = false;

            if (databaseItem && databaseItem.Sell) {
                const sellPrice = (typeof databaseItem.Sell === 'string' && databaseItem.Sell !== '')
                    ? parseInt(databaseItem.Sell.replace(/,/g, ''), 10) : databaseItem.Sell;
                if (sellPrice && !isNaN(sellPrice) && sellPrice > item.Price) {
                    isNpcProfitable = true;
                    npcProfit = sellPrice - item.Price;
                    npcProfitDisplay = `<span class="profit-amount npc-profit" title="NPC Sell Profit">(NPC +${formatNumber(npcProfit)})</span>`;
                }
            }
            const personalPrice = personalPrices[itemDefinitionId];
            if (personalPrice != null && !isNaN(personalPrice) && personalPrice > item.Price) {
                isPersonalProfitable = true;
                personalProfit = personalPrice - item.Price;
                personalProfitDisplay = `<span class="profit-amount personal-profit" title="Personal Price Profit">(Pers +${formatNumber(personalProfit)})</span>`;
            }

            // Add Classes
            row.classList.toggle('profitable-item', isNpcProfitable || isPersonalProfitable);
            row.classList.toggle('personal-price-highlight', isPersonalProfitable); // Highlight specifically for personal profit finds

            row.innerHTML = `
                <td class="item-cell">
                    <div class="item-info">
                        <img src="${iconUrl || './images/AI-DEN_Cowboy.png'}" class="item-icon pixelated" alt="${itemName}" onerror="this.onerror=null; this.src='./images/AI-DEN_Cowboy.png';">
                        <span>${itemName}</span>
                    </div>
                </td>
                <td>${formatNumber(item.Price)} Coins ${npcProfitDisplay} ${personalProfitDisplay}</td>
                <td>${timeLeftText}</td>`;
            resultsBody.appendChild(row);
        });
}

function displayItemDetails(itemId) {
    detailsError.style.display = 'none'; detailsError.textContent = '';
    const stringItemId = String(itemId);
    selectedItemId = stringItemId;

    if (!itemDatabase) {
        detailsError.textContent = 'Error: Item database not available'; detailsError.style.display = 'block';
        personalPriceInput.value = ''; personalPriceInput.disabled = true; return;
    }
    const dbItemInfo = findItemById(stringItemId);
    if (!dbItemInfo) {
        detailsError.textContent = `Error: Item #${stringItemId} not found in database`; detailsError.style.display = 'block';
        selectedItemId = null; personalPriceInput.value = ''; personalPriceInput.disabled = true; return;
    }

    const specificItemListings = currentlyDisplayedListings.filter(listing => String(listing.ItemDefinitionId) === stringItemId);
    let recentlyListedPriceStr = 'N/A';
    const prices = specificItemListings.map(listing => listing.Price).sort((a, b) => a - b);
    const lowestPrice = prices.length > 0 ? prices[0] : null;

    if (lowestPrice !== null) {
            // Find the timestamp of the lowest priced item among the displayed ones
            const lowestPricedItem = specificItemListings.find(item => item.Price === lowestPrice);
            // Or simply show the lowest price found? Let's show lowest price.
            recentlyListedPriceStr = formatPrice(lowestPrice); // Show lowest price in view
        } else if (specificItemListings.length > 0) { // Should not happen if lowestPrice is null, but safety check
            const sortedByTime = [...specificItemListings].sort((a, b) => b.Listed - a.Listed);
            recentlyListedPriceStr = formatPrice(sortedByTime[0].Price); // Fallback to most recent if lowest fails?
        } else {
            recentlyListedPriceStr = 'N/A (Not in current view)';
        }

    let npcProfitStr = 'N/A', personalProfitStr = 'N/A';
    let npcProfitClass = '', personalProfitClass = '';
    const sellPrice = (typeof dbItemInfo.Sell === 'string' && dbItemInfo.Sell !== '') ? parseInt(dbItemInfo.Sell.replace(/,/g, ''), 10) : dbItemInfo.Sell;

    if (sellPrice && !isNaN(sellPrice) && lowestPrice !== null) {
        if (lowestPrice < sellPrice) {
            npcProfitStr = `+${formatNumber(sellPrice - lowestPrice)} Coins`; npcProfitClass = 'profit-positive';
        } else {
            npcProfitStr = 'No profit'; npcProfitClass = 'profit-negative';
        }
    } else if (!lowestPrice) {
        npcProfitStr = 'N/A (No listing displayed)'; npcProfitClass = 'profit-negative';
    }

    const personalPrice = personalPrices[stringItemId];
    if (personalPrice != null && !isNaN(personalPrice) && lowestPrice !== null) {
        if (lowestPrice < personalPrice) {
            personalProfitStr = `+${formatNumber(personalPrice - lowestPrice)} Coins`; personalProfitClass = 'profit-positive';
        } else {
            personalProfitStr = 'No profit'; personalProfitClass = 'profit-negative';
        }
    } else if (lowestPrice && personalPrice == null) {
        personalProfitStr = 'N/A (No personal price)'; personalProfitClass = 'profit-negative';
    } else if (!lowestPrice && personalPrice != null) {
            personalProfitStr = 'N/A (No listing displayed)'; personalProfitClass = 'profit-negative';
    }

    detailsIcon.src = dbItemInfo["Sprite-Link"] || 'placeholder-icon.png'; detailsIcon.onerror = () => { detailsIcon.src = 'placeholder-icon.png'; }; detailsIcon.alt = dbItemInfo.Name;
    detailsName.textContent = dbItemInfo.Name;
    detailsBuyPrice.textContent = formatPrice(dbItemInfo.Buy);
    detailsSellPrice.textContent = formatPrice(dbItemInfo.Sell);
    if (detailsRecentlyListedPrice) { detailsRecentlyListedPrice.textContent = recentlyListedPriceStr; }
    if (detailsPotentialProfit) { detailsPotentialProfit.textContent = npcProfitStr; detailsPotentialProfit.className = npcProfitClass; }
    if (detailsPersonalProfit) { detailsPersonalProfit.textContent = personalProfitStr; detailsPersonalProfit.className = personalProfitClass; }

    const savedPersonalPrice = personalPrices[selectedItemId];
    personalPriceInput.value = (savedPersonalPrice != null && !isNaN(savedPersonalPrice)) ? savedPersonalPrice : '';
    personalPriceInput.disabled = false;
    itemDetailsColumn.style.display = 'block';
}

function updatePagination() {
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    const disablePag = isLoading || isComprehensiveSearchActive;
    prevPageButton.disabled = currentPage <= 1 || disablePag;
    nextPageButton.disabled = currentPage >= totalPages || disablePag;
    console.log('Pagination state:', { currentPage, totalPages, isPrevDisabled: prevPageButton.disabled, isNextDisabled: nextPageButton.disabled, isLoading, isComprehensiveSearchActive });
}

function showMessage(type, message, isDismissable = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    const textNode = document.createTextNode(message + ' '); // Add space before button
    messageDiv.appendChild(textNode);

    if (isDismissable) {
        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'Dismiss';
        dismissButton.style.marginLeft = '10px'; // Add some space
        dismissButton.onclick = () => messageDiv.remove();
        messageDiv.appendChild(dismissButton);
    }
    messageContainer.innerHTML = ''; // Clear previous messages
    messageContainer.appendChild(messageDiv);
}

function updateSortIndicators() {
        resultsTable.querySelectorAll('thead th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === currentSort) {
                th.classList.add(currentDirection === 'ASC' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    function disableControls(disable, isCompSearch = false) {
    searchButton.disabled = disable;
    refreshButton.disabled = disable;
    showProfitableButton.disabled = disable; // Always disable during any load/search
    // sortBySelect.disabled = disable;
    // sortDirectionSelect.disabled = disable;
    searchInput.disabled = disable;

        // Keep pagination disabled during comprehensive search display
    prevPageButton.disabled = disable || (isComprehensiveSearchActive && !isCompSearch); // Disable if loading OR if comp search results are active
    nextPageButton.disabled = disable || (isComprehensiveSearchActive && !isCompSearch);

    if (disable && !isCompSearch) { // Only show spinner on refresh for normal load
        refreshButton.innerHTML = 'Refreshing...<span class="refresh-spinner"></span>';
    } else if (!disable) {
        refreshButton.textContent = 'Refresh';
    }
}

// --- Comprehensive Search Functions ---

async function performComprehensiveSearch() {
    if (isLoading) { showMessage('info', 'Please wait for the current operation to finish.'); return; }
    if (!itemDatabase) { showMessage('error', 'Item database not loaded.'); return; }

    isComprehensiveSearchActive = true; // Mark as active *displaying* comprehensive results later
    showProfitableOnlyState = true; // Mark that we *want* profitable items
    comprehensiveSearchAborted = false;
    comprehensiveSearchResults = [];
    searchedPages = 0;
    totalSearchPages = 0;

    createSearchProgressModal();
    searchProgressModal.style.display = 'flex';
    updateSearchProgressModal(0, 0, false);
    disableControls(true, true); // Disable controls for comprehensive search

    try {
        console.log("Fetching page 1 to get total pages...");
        // Use a default sort that makes sense for finding *any* profitable item quickly, maybe recently listed?
        const initialData = await searchMarket(1, '', 'Listed', 'DESC'); // Fetch page 1, most recent first

        if (initialData.error || initialData.aborted) { throw new Error(initialData.error || "Initial fetch failed or aborted."); }
        if (!initialData.pagination || !initialData.pagination.totalPages) { throw new Error("Could not determine total pages."); }

        totalSearchPages = parseInt(initialData.pagination.totalPages);
        console.log(`Total pages to search: ${totalSearchPages}`);

        const page1Profitable = (initialData.listings || []).filter(isItemProfitable);
        comprehensiveSearchResults.push(...page1Profitable);
        searchedPages = 1;
        updateSearchProgressModal(searchedPages, totalSearchPages);

        // Fetch remaining pages sequentially
        for (let page = 2; page <= totalSearchPages; page++) {
            if (comprehensiveSearchAborted) {
                    console.log("Comprehensive search aborted by user.");
                    showMessage('info', 'Profitable item search cancelled.', true);
                    break;
                }
            console.log(`Fetching page ${page}...`);
            const pageData = await searchMarket(page, '', 'Listed', 'DESC'); // Use same sort

            if (pageData.aborted) { // Check if aborted during this specific fetch
                    comprehensiveSearchAborted = true;
                    console.log("Comprehensive search aborted during fetch loop.");
                    showMessage('info', 'Profitable item search cancelled.', true);
                    break;
                }
            if (pageData.error) {
                console.warn(`Error fetching page ${page}: ${pageData.error}. Skipping.`);
                showMessage('error', `Error fetching page ${page}. Results may be incomplete.`, true);
                    // Continue to next page
                } else {
                    const profitableOnPage = (pageData.listings || []).filter(isItemProfitable);
                    comprehensiveSearchResults.push(...profitableOnPage);
                }
                searchedPages++;
                updateSearchProgressModal(searchedPages, totalSearchPages);
                await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between fetches
            }

        if (!comprehensiveSearchAborted) {
                console.log("Comprehensive search finished.");
                displayComprehensiveResults(); // Display sorted results
            }

    } catch (error) {
        console.error("Comprehensive search failed:", error);
        showMessage('error', `Comprehensive search failed: ${error.message}`, true);
        updateSearchProgressModal(searchedPages, totalSearchPages, true, error.message);
        // Reset state fully on critical failure
        isComprehensiveSearchActive = false;
        showProfitableOnlyState = false;
        showProfitableButton.classList.remove('active');
        showProfitableButton.textContent = 'Show Profitable Only';
    } finally {
        // isLoading was handled within searchMarket for the comp. search loop
        isLoading = false; // Ensure loading is false now
        // Re-enable controls EXCEPT pagination if search was successful & not aborted
        if (!comprehensiveSearchAborted) {
                disableControls(false, isComprehensiveSearchActive); // isComprehensiveSearchActive might be true here if successful
                searchProgressModal.style.display = 'none'; // Hide modal only if not aborted
            } else {
                // Handle UI reset if aborted
                resetToNormalView();
                searchProgressModal.style.display = 'none'; // Hide modal after resetting view
            }
            abortController = null; // Clear controller
    }
}

function displayComprehensiveResults() {
        // Sort results by max potential profit (NPC or Personal)
        comprehensiveSearchResults.sort((a, b) => {
            const itemAId = String(a.ItemDefinitionId), itemBId = String(b.ItemDefinitionId);
            const dbItemA = findItemById(itemAId), dbItemB = findItemById(itemBId);
            if (!dbItemA || !dbItemB) return 0;

            const sellA = (typeof dbItemA.Sell === 'string' && dbItemA.Sell !== '') ? parseInt(dbItemA.Sell.replace(/,/g, ''), 10) : dbItemA.Sell;
            const sellB = (typeof dbItemB.Sell === 'string' && dbItemB.Sell !== '') ? parseInt(dbItemB.Sell.replace(/,/g, ''), 10) : dbItemB.Sell;
            const personalA = personalPrices[itemAId], personalB = personalPrices[itemBId];
            const marketA = a.Price ?? Infinity, marketB = b.Price ?? Infinity;

            let maxProfitA = -Infinity;
            if (sellA && !isNaN(sellA) && sellA > marketA) maxProfitA = Math.max(maxProfitA, sellA - marketA);
            if (personalA != null && !isNaN(personalA) && personalA > marketA) maxProfitA = Math.max(maxProfitA, personalA - marketA);

            let maxProfitB = -Infinity;
            if (sellB && !isNaN(sellB) && sellB > marketB) maxProfitB = Math.max(maxProfitB, sellB - marketB);
            if (personalB != null && !isNaN(personalB) && personalB > marketB) maxProfitB = Math.max(maxProfitB, personalB - marketB);

            return maxProfitB - maxProfitA; // Highest profit first
        });

        currentlyDisplayedListings = comprehensiveSearchResults;
        displayResults(currentlyDisplayedListings);
        currentPage = 1; totalPages = 1;
        updatePagination(); // Disable pagination buttons

        const resultCount = comprehensiveSearchResults.length;
        showMessage('info', `Showing ${resultCount} profitable items found across all ${searchedPages} market pages. Sorted by highest potential profit.`, true);

        showProfitableButton.classList.add('active'); // Set button to active/reset state
        showProfitableButton.textContent = 'Reset Search';
        isComprehensiveSearchActive = true; // Mark that we ARE displaying comprehensive results now
        // Controls remain disabled except for the reset button (handled in disableControls)
        disableControls(false, true); // Enable only the reset button basically
}

function createSearchProgressModal() {
    // Attach listener only once
    if (!cancelSearchButton.dataset.listenerAttached) {
        cancelSearchButton.addEventListener('click', () => {
            console.log("Cancel button clicked.");
            comprehensiveSearchAborted = true; // Signal abortion
            if (abortController) {
                console.log("Aborting fetch controller from cancel button.");
                abortController.abort("User cancelled search"); // Abort the current fetch
            }
            // Update modal immediately to show cancellation
            updateSearchProgressModal(searchedPages, totalSearchPages, true, "Search cancelled by user.");
            // The finally block in performComprehensiveSearch handles the rest of the UI reset
        });
        cancelSearchButton.dataset.listenerAttached = 'true';
    }
        // Reset button text for new search
        cancelSearchButton.textContent = 'Cancel Search';
        cancelSearchButton.onclick = null; // Clear previous completion handler if any
}

function updateSearchProgressModal(current, total, completed = false, errorMessage = null) {
        if (!searchProgressModal) return;
        const percent = total > 0 ? Math.round((current / total) * 100) : (completed ? 100 : 0);
        const foundCount = comprehensiveSearchResults.length;

        let messageText = `Checking page ${current} of ${total}... Found ${foundCount} profitable items.`;
        if (completed) {
            messageText = errorMessage
                ? `Error: ${errorMessage}`
                : `Search complete! Found ${foundCount} items across ${current} pages.`;
            cancelSearchButton.textContent = 'Close';
            // Make the button just close the modal once completed/errored
            cancelSearchButton.onclick = () => { searchProgressModal.style.display = 'none'; };
        } else {
            // Ensure the cancel logic is attached for ongoing searches
            if (!cancelSearchButton.dataset.listenerAttached) {
                createSearchProgressModal();
            }
            cancelSearchButton.textContent = 'Cancel Search';
        }

        searchProgressMessage.textContent = messageText;
        searchProgressBar.style.width = `${percent}%`;
        searchProgressBar.textContent = `${percent}%`;
}

function resetToNormalView() {
        console.log("Resetting to normal view...");
        isComprehensiveSearchActive = false;
        showProfitableOnlyState = false;
        comprehensiveSearchResults = [];
        comprehensiveSearchAborted = false; // Reset abort flag

        showProfitableButton.classList.remove('active');
        showProfitableButton.textContent = 'Show Profitable Only';
        currentPage = 1;
        searchInput.value = lastApiSearchTerm || ''; // Restore last search term or clear if none
        searchMarket(); // Fetch default view for page 1 with current settings/term
}


// --- Event Listeners ---

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isComprehensiveSearchActive) {
            applyClientSideFilter(); // Just filter the comprehensive results
        } else {
            currentPage = 1;
            searchMarket(); // Fetch page 1 with the new filter term
        }
});

searchInput.addEventListener('input', () => { applyClientSideFilter(); }); // Live filter

prevPageButton.addEventListener('click', function() {
    if (this.disabled || isComprehensiveSearchActive) return;
    if (currentPage > 1) { currentPage--; searchMarket(); }
});
nextPageButton.addEventListener('click', function() {
    if (this.disabled || isComprehensiveSearchActive) return;
    if (currentPage < totalPages) { currentPage++; searchMarket(); }
});

// sortBySelect.addEventListener('change', () => {
//     if (isLoading || isComprehensiveSearchActive) return;
//     currentSort = sortBySelect.value; currentPage = 1;
//     updateSortIndicators(); searchMarket();
// });
// sortDirectionSelect.addEventListener('change', () => {
//         if (isLoading || isComprehensiveSearchActive) return;
//         currentDirection = sortDirectionSelect.value; currentPage = 1;
//         updateSortIndicators(); searchMarket();
//     });

resultsTable.querySelector('thead').addEventListener('click', (e) => {
    if (isLoading || isComprehensiveSearchActive) return;

    const th = e.target.closest('th');
    if (th && th.dataset.sort) {
        const column = th.dataset.sort;

        // Toggle the sort direction if the same column is clicked, otherwise reset to ascending
        if (currentSort === column) {
            currentDirection = currentDirection === 'ASC' ? 'DESC' : 'ASC';
        } else {
            currentSort = column;
            currentDirection = 'ASC';
        }

        // Update the sort indicators and fetch the sorted data
        updateSortIndicators();
        currentPage = 1;
        searchMarket();
    }
});

resultsBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (row && row.dataset.itemId) {
        displayItemDetails(row.dataset.itemId);
    }
});

refreshButton.addEventListener('click', () => {
    if (!isLoading) { resetToNormalView(); }
});

personalPriceInput.addEventListener('change', () => {
        if (selectedItemId) { savePersonalPrice(selectedItemId, personalPriceInput.value); }
});

showProfitableButton.addEventListener('click', function() {
    if (isLoading) return; // Prevent action during any loading state

    if (isComprehensiveSearchActive) {
        resetToNormalView(); // Resets comprehensive search view
    } else {
        performComprehensiveSearch(); // Starts comprehensive search
    }
});

// --- Initial Load ---
async function initializeApp() {
    try {
        loadPersonalPrices(); // Load personal prices (if applicable)
        await loadEmbeddedItemData(); // Ensure JSON data is loaded before proceeding
        const dbLoaded = await loadItemDatabase(); // Load the item database after JSON is loaded
        // updateTimestampDisplay(); // Update timestamp display

        if (dbLoaded) {
            updateSortIndicators(); // Set initial sort indicators
            await searchMarket(); // Perform initial search for page 1
        } else {
            showMessage('error', 'Failed to load item database. Market data cannot be displayed.');
            disableControls(true); // Disable everything if DB fails
        }

        personalPriceInput.disabled = true; // Disable personal price input
    } catch (error) {
        console.error('Error initializing application:', error);
        showMessage('error', 'An unexpected error occurred during initialization.');
    }
}
window.addEventListener('DOMContentLoaded', initializeApp);